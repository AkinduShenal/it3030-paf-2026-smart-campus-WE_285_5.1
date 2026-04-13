package com.smartcampus.operationshub.service;

import com.smartcampus.operationshub.dto.TicketAssignRequest;
import com.smartcampus.operationshub.dto.TicketAttachmentResponse;
import com.smartcampus.operationshub.dto.TicketCommentCreateRequest;
import com.smartcampus.operationshub.dto.TicketCommentResponse;
import com.smartcampus.operationshub.dto.TicketCommentUpdateRequest;
import com.smartcampus.operationshub.dto.TicketCreateRequest;
import com.smartcampus.operationshub.dto.TicketRejectRequest;
import com.smartcampus.operationshub.dto.TicketResponse;
import com.smartcampus.operationshub.dto.TicketStatusUpdateRequest;
import com.smartcampus.operationshub.entity.NotificationType;
import com.smartcampus.operationshub.entity.Resource;
import com.smartcampus.operationshub.entity.Ticket;
import com.smartcampus.operationshub.entity.TicketAttachment;
import com.smartcampus.operationshub.entity.TicketComment;
import com.smartcampus.operationshub.entity.TicketStatus;
import com.smartcampus.operationshub.exception.InvalidAttachmentException;
import com.smartcampus.operationshub.exception.ResourceNotFoundException;
import com.smartcampus.operationshub.exception.TicketAttachmentLimitException;
import com.smartcampus.operationshub.exception.TicketCommentNotFoundException;
import com.smartcampus.operationshub.exception.TicketCommentOwnershipException;
import com.smartcampus.operationshub.exception.TicketNotFoundException;
import com.smartcampus.operationshub.repository.ResourceRepository;
import com.smartcampus.operationshub.repository.TicketAttachmentRepository;
import com.smartcampus.operationshub.repository.TicketCommentRepository;
import com.smartcampus.operationshub.repository.TicketRepository;
import com.smartcampus.operationshub.validation.TicketFilter;
import jakarta.persistence.criteria.Predicate;
import java.io.IOException;
import java.time.Instant;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class TicketServiceImpl implements TicketService {

    private static final long MAX_ATTACHMENT_SIZE_BYTES = 5L * 1024 * 1024;
    private static final int MAX_ATTACHMENTS_PER_TICKET = 3;
    private static final Set<String> ALLOWED_ATTACHMENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository ticketCommentRepository;
    private final TicketAttachmentRepository ticketAttachmentRepository;
    private final ResourceRepository resourceRepository;
    private final Path attachmentStoragePath;
    private NotificationService notificationService;

    public TicketServiceImpl(
            TicketRepository ticketRepository,
            TicketCommentRepository ticketCommentRepository,
            TicketAttachmentRepository ticketAttachmentRepository,
            ResourceRepository resourceRepository,
            @Value("${app.storage.ticket-attachments-dir}") String attachmentStorageDir
    ) {
        this.ticketRepository = ticketRepository;
        this.ticketCommentRepository = ticketCommentRepository;
        this.ticketAttachmentRepository = ticketAttachmentRepository;
        this.resourceRepository = resourceRepository;
        this.attachmentStoragePath = Paths.get(attachmentStorageDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.attachmentStoragePath);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to initialize ticket attachment storage", ex);
        }
    }

    @Autowired(required = false)
    public void setNotificationService(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Override
    public TicketResponse createTicket(TicketCreateRequest request) {
        Ticket ticket = new Ticket();
        ticket.setCategory(request.getCategory().trim());
        ticket.setDescription(request.getDescription().trim());
        ticket.setPriority(request.getPriority());
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setRequesterEmail(request.getRequesterEmail().trim().toLowerCase(Locale.ROOT));
        ticket.setPreferredContact(request.getPreferredContact().trim());
        ticket.setLocation(request.getLocation() == null ? null : request.getLocation().trim());
        ticket.setResolveBy(calculateResolveBy(ticket.getPriority()));

        if (request.getResourceId() != null) {
            Resource resource = resourceRepository.findById(request.getResourceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Resource not found for id: " + request.getResourceId()));
            ticket.setResource(resource);
        }

        Ticket saved = ticketRepository.save(ticket);
        createTicketNotifications(
            recipientSet(saved.getRequesterEmail()),
            NotificationType.TICKET_CREATED,
            "Ticket created",
            "Ticket #" + saved.getId() + " has been created and is open.",
            saved.getId()
        );
        return toTicketResponse(saved, true);
    }

    @Override
    @Transactional(readOnly = true)
    public TicketResponse getTicketById(Long id) {
        return toTicketResponse(findTicket(id), true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> getTickets(TicketFilter filter) {
        Specification<Ticket> specification = (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getStatus() != null) {
                predicates.add(builder.equal(root.get("status"), filter.getStatus()));
            }
            if (filter.getPriority() != null) {
                predicates.add(builder.equal(root.get("priority"), filter.getPriority()));
            }
            if (filter.getRequesterEmail() != null && !filter.getRequesterEmail().isBlank()) {
                predicates.add(builder.equal(
                        builder.lower(root.get("requesterEmail")),
                        filter.getRequesterEmail().trim().toLowerCase(Locale.ROOT)
                ));
            }
            if (filter.getAssignedTechnicianEmail() != null && !filter.getAssignedTechnicianEmail().isBlank()) {
                predicates.add(builder.equal(
                        builder.lower(root.get("assignedTechnicianEmail")),
                        filter.getAssignedTechnicianEmail().trim().toLowerCase(Locale.ROOT)
                ));
            }

            return builder.and(predicates.toArray(Predicate[]::new));
        };

        return ticketRepository.findAll(specification, Sort.by(Sort.Direction.DESC, "id"))
                .stream()
                .map(ticket -> toTicketResponse(ticket, false))
                .toList();
    }

    @Override
    public TicketResponse assignTechnician(Long id, TicketAssignRequest request) {
        Ticket ticket = findTicket(id);
        ticket.setAssignedTechnicianEmail(request.getTechnicianEmail().trim().toLowerCase(Locale.ROOT));
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        Ticket saved = ticketRepository.save(ticket);
        createTicketNotifications(
            recipientSet(saved.getRequesterEmail(), saved.getAssignedTechnicianEmail()),
            NotificationType.TICKET_ASSIGNED,
            "Ticket assigned",
            "Ticket #" + saved.getId() + " has been assigned to " + saved.getAssignedTechnicianEmail() + ".",
            saved.getId()
        );
        return toTicketResponse(saved, true);
    }

    @Override
    public TicketResponse updateTicketStatus(Long id, TicketStatusUpdateRequest request) {
        Ticket ticket = findTicket(id);
        validateStatusTransition(ticket.getStatus(), request.getStatus());

        if (request.getStatus() == TicketStatus.RESOLVED) {
            if (request.getResolutionNotes() == null || request.getResolutionNotes().isBlank()) {
                throw new IllegalArgumentException("Resolution notes are required when resolving a ticket");
            }
            ticket.setResolutionNotes(request.getResolutionNotes().trim());
        }

        ticket.setStatus(request.getStatus());
        if (request.getStatus() != TicketStatus.REJECTED) {
            ticket.setRejectionReason(null);
        }

        Ticket saved = ticketRepository.save(ticket);
        createTicketNotifications(
            recipientSet(saved.getRequesterEmail(), saved.getAssignedTechnicianEmail()),
            NotificationType.TICKET_STATUS_UPDATED,
            "Ticket status updated",
            "Ticket #" + saved.getId() + " is now " + saved.getStatus() + ".",
            saved.getId()
        );
        return toTicketResponse(saved, true);
    }

    @Override
    public TicketResponse rejectTicket(Long id, TicketRejectRequest request) {
        Ticket ticket = findTicket(id);
        if (ticket.getStatus() == TicketStatus.CLOSED || ticket.getStatus() == TicketStatus.RESOLVED) {
            throw new IllegalArgumentException("Resolved or closed tickets cannot be rejected");
        }
        ticket.setStatus(TicketStatus.REJECTED);
        ticket.setRejectionReason(request.getReason().trim());

        Ticket saved = ticketRepository.save(ticket);
        createTicketNotifications(
            recipientSet(saved.getRequesterEmail(), saved.getAssignedTechnicianEmail()),
            NotificationType.TICKET_REJECTED,
            "Ticket rejected",
            "Ticket #" + saved.getId() + " was rejected: " + saved.getRejectionReason(),
            saved.getId()
        );
        return toTicketResponse(saved, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketCommentResponse> getComments(Long ticketId) {
        ensureTicketExists(ticketId);
        return ticketCommentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(this::toCommentResponse)
                .toList();
    }

    @Override
    public TicketCommentResponse addComment(Long ticketId, TicketCommentCreateRequest request) {
        Ticket ticket = findTicket(ticketId);
        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setAuthorEmail(request.getAuthorEmail().trim().toLowerCase(Locale.ROOT));
        comment.setContent(request.getContent().trim());

        TicketComment saved = ticketCommentRepository.save(comment);
        createTicketNotifications(
            recipientSet(ticket.getRequesterEmail(), ticket.getAssignedTechnicianEmail()),
            NotificationType.TICKET_COMMENT_ADDED,
            "New ticket comment",
            "Ticket #" + ticket.getId() + " has a new comment from " + saved.getAuthorEmail() + ".",
            ticket.getId()
        );
        return toCommentResponse(saved);
    }

    @Override
    public TicketCommentResponse updateComment(Long ticketId, Long commentId, TicketCommentUpdateRequest request) {
        TicketComment comment = findComment(commentId);
        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new TicketCommentNotFoundException("Comment not found for ticket id: " + ticketId);
        }
        validateCommentOwnership(comment, request.getActorEmail());
        comment.setContent(request.getContent().trim());
        return toCommentResponse(ticketCommentRepository.save(comment));
    }

    @Override
    public void deleteComment(Long ticketId, Long commentId, String actorEmail) {
        TicketComment comment = findComment(commentId);
        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new TicketCommentNotFoundException("Comment not found for ticket id: " + ticketId);
        }
        validateCommentOwnership(comment, actorEmail);
        ticketCommentRepository.delete(comment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketAttachmentResponse> getAttachments(Long ticketId) {
        ensureTicketExists(ticketId);
        return ticketAttachmentRepository.findByTicketIdOrderByCreatedAtDesc(ticketId)
                .stream()
                .map(this::toAttachmentResponse)
                .toList();
    }

    @Override
    public TicketAttachmentResponse uploadAttachment(Long ticketId, String uploadedBy, MultipartFile file) {
        Ticket ticket = findTicket(ticketId);
        validateAttachment(file, ticketId);

        String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "attachment" : file.getOriginalFilename());
        String extension = extractExtension(originalName);
        String storedName = UUID.randomUUID() + extension;

        Path targetPath = attachmentStoragePath.resolve(storedName).normalize();
        if (!targetPath.startsWith(attachmentStoragePath)) {
            throw new InvalidAttachmentException("Invalid attachment path");
        }

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new InvalidAttachmentException("Failed to store attachment file");
        }

        TicketAttachment attachment = new TicketAttachment();
        attachment.setTicket(ticket);
        attachment.setFileName(originalName);
        attachment.setStoredFileName(storedName);
        attachment.setContentType(file.getContentType());
        attachment.setFileSize(file.getSize());
        attachment.setUploadedBy(uploadedBy.trim().toLowerCase(Locale.ROOT));
        return toAttachmentResponse(ticketAttachmentRepository.save(attachment));
    }

    @Override
    public void deleteAttachment(Long ticketId, Long attachmentId) {
        TicketAttachment attachment = ticketAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new InvalidAttachmentException("Attachment not found for id: " + attachmentId));
        if (!attachment.getTicket().getId().equals(ticketId)) {
            throw new InvalidAttachmentException("Attachment does not belong to ticket id: " + ticketId);
        }

        // Physically delete file
        Path filePath = attachmentStoragePath.resolve(attachment.getStoredFileName()).normalize();
        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log error but continue to delete from DB
        }

        ticketAttachmentRepository.delete(attachment);
    }

    @Override
    public void deleteTicket(Long id) {
        Ticket ticket = findTicket(id);
        // Delete all physical attachments first
        List<TicketAttachment> attachments = ticketAttachmentRepository.findByTicketIdOrderByCreatedAtDesc(id);
        for (TicketAttachment att : attachments) {
            try {
                Files.deleteIfExists(attachmentStoragePath.resolve(att.getStoredFileName()).normalize());
            } catch (IOException ignored) {}
        }
        ticketRepository.delete(ticket);
    }

    private void validateAttachment(MultipartFile file, Long ticketId) {
        if (file == null || file.isEmpty()) {
            throw new InvalidAttachmentException("Attachment file is required");
        }
        long currentCount = ticketAttachmentRepository.countByTicketId(ticketId);
        if (currentCount >= MAX_ATTACHMENTS_PER_TICKET) {
            throw new TicketAttachmentLimitException("A ticket can have at most 3 attachments");
        }
        if (file.getSize() > MAX_ATTACHMENT_SIZE_BYTES) {
            throw new InvalidAttachmentException("Attachment exceeds maximum size of 5MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_ATTACHMENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new InvalidAttachmentException("Only image attachments are allowed (jpg, png, webp, gif)");
        }
        String originalName = file.getOriginalFilename();
        if (originalName != null && originalName.contains("..")) {
            throw new InvalidAttachmentException("Invalid attachment file name");
        }
    }

    private String extractExtension(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot < 0) {
            return "";
        }
        String ext = fileName.substring(dot).toLowerCase(Locale.ROOT);
        if (!ext.matches("\\.(jpg|jpeg|png|gif|webp)")) {
            throw new InvalidAttachmentException("Unsupported attachment extension");
        }
        return ext;
    }

    private void validateCommentOwnership(TicketComment comment, String actorEmail) {
        if (actorEmail == null || actorEmail.isBlank()) {
            throw new IllegalArgumentException("Actor email is required");
        }
        if (!comment.getAuthorEmail().equalsIgnoreCase(actorEmail.trim())) {
            throw new TicketCommentOwnershipException("Only the original comment author can edit or delete this comment");
        }
    }

    private void validateStatusTransition(TicketStatus current, TicketStatus next) {
        if (current == next) {
            return;
        }

        boolean valid = switch (current) {
            case OPEN -> next == TicketStatus.IN_PROGRESS;
            case IN_PROGRESS -> next == TicketStatus.RESOLVED;
            case RESOLVED -> next == TicketStatus.CLOSED;
            case CLOSED, REJECTED -> false;
        };

        if (!valid) {
            throw new IllegalArgumentException(
                    "Invalid ticket status transition from " + current + " to " + next
            );
        }
    }

    private Ticket findTicket(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found for id: " + id));
    }

    private TicketComment findComment(Long commentId) {
        return ticketCommentRepository.findById(commentId)
                .orElseThrow(() -> new TicketCommentNotFoundException("Comment not found for id: " + commentId));
    }

    private void ensureTicketExists(Long ticketId) {
        if (!ticketRepository.existsById(ticketId)) {
            throw new TicketNotFoundException("Ticket not found for id: " + ticketId);
        }
    }

    private TicketResponse toTicketResponse(Ticket ticket, boolean includeDetails) {
        TicketResponse response = new TicketResponse();
        response.setId(ticket.getId());
        response.setCategory(ticket.getCategory());
        response.setDescription(ticket.getDescription());
        response.setPriority(ticket.getPriority());
        response.setStatus(ticket.getStatus());
        response.setRequesterEmail(ticket.getRequesterEmail());
        response.setPreferredContact(ticket.getPreferredContact());
        response.setAssignedTechnicianEmail(ticket.getAssignedTechnicianEmail());
        response.setResolutionNotes(ticket.getResolutionNotes());
        response.setRejectionReason(ticket.getRejectionReason());
        response.setLocation(ticket.getLocation());
        response.setCreatedAt(ticket.getCreatedAt());
        response.setUpdatedAt(ticket.getUpdatedAt());
        response.setResolveBy(ticket.getResolveBy());

        if (ticket.getResource() != null) {
            response.setResourceId(ticket.getResource().getId());
            response.setResourceName(ticket.getResource().getName());
        }

        if (includeDetails) {
            response.setComments(getComments(ticket.getId()));
            response.setAttachments(getAttachments(ticket.getId()));
        }

        return response;
    }

    private TicketCommentResponse toCommentResponse(TicketComment comment) {
        TicketCommentResponse response = new TicketCommentResponse();
        response.setId(comment.getId());
        response.setTicketId(comment.getTicket().getId());
        response.setAuthorEmail(comment.getAuthorEmail());
        response.setContent(comment.getContent());
        response.setCreatedAt(comment.getCreatedAt());
        response.setUpdatedAt(comment.getUpdatedAt());
        return response;
    }

    private TicketAttachmentResponse toAttachmentResponse(TicketAttachment attachment) {
        TicketAttachmentResponse response = new TicketAttachmentResponse();
        response.setId(attachment.getId());
        response.setTicketId(attachment.getTicket().getId());
        response.setFileName(attachment.getFileName());
        response.setContentType(attachment.getContentType());
        response.setFileSize(attachment.getFileSize());
        response.setUploadedBy(attachment.getUploadedBy());
        response.setCreatedAt(attachment.getCreatedAt());
        return response;
    }

    private void createTicketNotifications(
            Set<String> recipients,
            NotificationType type,
            String title,
            String message,
            Long ticketId
    ) {
        if (notificationService == null || recipients == null || recipients.isEmpty()) {
            return;
        }

        recipients.stream()
                .filter(email -> email != null && !email.isBlank())
                .map(email -> email.trim().toLowerCase(Locale.ROOT))
                .distinct()
                .forEach(recipient -> notificationService.createNotification(
                        recipient,
                        type,
                        title,
                        message,
                        "TICKET",
                        ticketId
                ));
    }

    private Set<String> recipientSet(String... emails) {
        Set<String> recipients = new LinkedHashSet<>();
        if (emails == null) {
            return recipients;
        }
        for (String email : emails) {
            if (email != null && !email.isBlank()) {
                recipients.add(email);
            }
        }
        return recipients;
    }

    private Instant calculateResolveBy(com.smartcampus.operationshub.entity.TicketPriority priority) {
        Instant now = Instant.now();
        return switch (priority) {
            case CRITICAL -> now.plusSeconds(4 * 3600);
            case HIGH -> now.plusSeconds(24 * 3600);
            case MEDIUM -> now.plusSeconds(72 * 3600);
            case LOW -> now.plusSeconds(168 * 3600);
        };
    }
}