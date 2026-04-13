package com.smartcampus.operationshub.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartcampus.operationshub.dto.TicketCommentUpdateRequest;
import com.smartcampus.operationshub.dto.TicketCreateRequest;
import com.smartcampus.operationshub.dto.TicketResponse;
import com.smartcampus.operationshub.dto.TicketStatusUpdateRequest;
import com.smartcampus.operationshub.entity.Ticket;
import com.smartcampus.operationshub.entity.TicketComment;
import com.smartcampus.operationshub.entity.TicketPriority;
import com.smartcampus.operationshub.entity.TicketStatus;
import com.smartcampus.operationshub.exception.TicketAttachmentLimitException;
import com.smartcampus.operationshub.exception.TicketCommentOwnershipException;
import com.smartcampus.operationshub.repository.ResourceRepository;
import com.smartcampus.operationshub.repository.TicketAttachmentRepository;
import com.smartcampus.operationshub.repository.TicketCommentRepository;
import com.smartcampus.operationshub.repository.TicketRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private TicketCommentRepository ticketCommentRepository;

    @Mock
    private TicketAttachmentRepository ticketAttachmentRepository;

    @Mock
    private ResourceRepository resourceRepository;

    private TicketService ticketService;

    @BeforeEach
    void setUp() {
        ticketService = new TicketServiceImpl(
                ticketRepository,
                ticketCommentRepository,
                ticketAttachmentRepository,
                resourceRepository,
                System.getProperty("java.io.tmpdir") + "/smart-campus-test-attachments"
        );
    }

    @Test
    void createTicket_shouldCalculateSLA() {
        TicketCreateRequest request = new TicketCreateRequest();
        request.setCategory("NETWORK");
        request.setDescription("No internet in lab");
        request.setPriority(TicketPriority.CRITICAL);
        request.setRequesterEmail("stu@smart.local");
        request.setPreferredContact("Email");

        when(ticketRepository.save(any(Ticket.class))).thenAnswer(i -> {
            Ticket t = i.getArgument(0);
            t.setId(10L);
            return t;
        });

        TicketResponse response = ticketService.createTicket(request);

        assertNotNull(response.getResolveBy());
        
        ArgumentCaptor<Ticket> ticketCaptor = ArgumentCaptor.forClass(Ticket.class);
        verify(ticketRepository).save(ticketCaptor.capture());
        Ticket savedTicket = ticketCaptor.getValue();
        
        // Critical should be 4 hours
        Instant expected = savedTicket.getCreatedAt() != null ? savedTicket.getCreatedAt() : Instant.now();
        long diffHours = ChronoUnit.HOURS.between(expected, savedTicket.getResolveBy());
        assertEquals(4, diffHours);
    }

    @Test
    void updateTicketStatus_shouldRejectInvalidTransition() {
        Ticket ticket = sampleTicket(1L, TicketStatus.OPEN);
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));

        TicketStatusUpdateRequest request = new TicketStatusUpdateRequest();
        request.setStatus(TicketStatus.CLOSED);

        assertThrows(IllegalArgumentException.class, () -> ticketService.updateTicketStatus(1L, request));
    }

    @Test
    void updateComment_shouldRejectNonOwner() {
        TicketComment comment = new TicketComment();
        comment.setId(100L);
        comment.setTicket(sampleTicket(1L, TicketStatus.OPEN));
        comment.setAuthorEmail("owner@smartcampus.local");
        comment.setContent("Initial comment");

        when(ticketCommentRepository.findById(100L)).thenReturn(Optional.of(comment));

        TicketCommentUpdateRequest request = new TicketCommentUpdateRequest();
        request.setActorEmail("other@smartcampus.local");
        request.setContent("Updated text");

        assertThrows(
                TicketCommentOwnershipException.class,
                () -> ticketService.updateComment(1L, 100L, request)
        );
    }

    @Test
    void uploadAttachment_shouldRejectWhenLimitReached() {
        Ticket ticket = sampleTicket(1L, TicketStatus.OPEN);
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketAttachmentRepository.countByTicketId(1L)).thenReturn(3L);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "damage.jpg",
                "image/jpeg",
                "image-data".getBytes()
        );

        assertThrows(
                TicketAttachmentLimitException.class,
                () -> ticketService.uploadAttachment(1L, "tech@smartcampus.local", file)
        );
    }

    private Ticket sampleTicket(Long id, TicketStatus status) {
        Ticket ticket = new Ticket();
        ticket.setId(id);
        ticket.setCategory("PROJECTOR");
        ticket.setDescription("Projector flickering");
        ticket.setPriority(TicketPriority.HIGH);
        ticket.setStatus(status);
        ticket.setRequesterEmail("student@smartcampus.local");
        ticket.setPreferredContact("student@smartcampus.local");
        ticket.setLocation("Block A");
        return ticket;
    }
}