package com.smartcampus.operationshub.controller;

import com.smartcampus.operationshub.dto.TicketAssignRequest;
import com.smartcampus.operationshub.dto.TicketAttachmentResponse;
import com.smartcampus.operationshub.dto.TicketCommentCreateRequest;
import com.smartcampus.operationshub.dto.TicketCommentResponse;
import com.smartcampus.operationshub.dto.TicketCommentUpdateRequest;
import com.smartcampus.operationshub.dto.TicketCreateRequest;
import com.smartcampus.operationshub.dto.TicketRejectRequest;
import com.smartcampus.operationshub.dto.TicketResponse;
import com.smartcampus.operationshub.dto.TicketStatusUpdateRequest;
import com.smartcampus.operationshub.service.TicketService;
import com.smartcampus.operationshub.validation.TicketFilter;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<TicketResponse> create(@Valid @RequestBody TicketCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.createTicket(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @GetMapping
    public ResponseEntity<List<TicketResponse>> getAll(@Valid @ModelAttribute TicketFilter filter) {
        return ResponseEntity.ok(ticketService.getTickets(filter));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TicketResponse> assign(@PathVariable Long id, @Valid @RequestBody TicketAssignRequest request) {
        return ResponseEntity.ok(ticketService.assignTechnician(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<TicketResponse> updateStatus(@PathVariable Long id,
            @Valid @RequestBody TicketStatusUpdateRequest request) {
        return ResponseEntity.ok(ticketService.updateTicketStatus(id, request));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TicketResponse> reject(@PathVariable Long id, @Valid @RequestBody TicketRejectRequest request) {
        return ResponseEntity.ok(ticketService.rejectTicket(id, request));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<TicketCommentResponse>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getComments(id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<TicketCommentResponse> addComment(@PathVariable Long id,
            @Valid @RequestBody TicketCommentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.addComment(id, request));
    }

    @PutMapping("/{id}/comments/{commentId}")
    public ResponseEntity<TicketCommentResponse> updateComment(
            @PathVariable Long id,
            @PathVariable Long commentId,
            @Valid @RequestBody TicketCommentUpdateRequest request
    ) {
        return ResponseEntity.ok(ticketService.updateComment(id, commentId, request));
    }

    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long id,
            @PathVariable Long commentId,
            @RequestParam String actorEmail
    ) {
        ticketService.deleteComment(id, commentId, actorEmail);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/attachments")
    public ResponseEntity<List<TicketAttachmentResponse>> getAttachments(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getAttachments(id));
    }

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TicketAttachmentResponse> uploadAttachment(
            @PathVariable Long id,
            @RequestParam String uploadedBy,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.uploadAttachment(id, uploadedBy, file));
    }

    @DeleteMapping("/{id}/attachments/{attachmentId}")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long id, @PathVariable Long attachmentId) {
        ticketService.deleteAttachment(id, attachmentId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        ticketService.deleteTicket(id);
        return ResponseEntity.noContent().build();
    }
}