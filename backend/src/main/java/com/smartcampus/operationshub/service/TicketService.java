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
import com.smartcampus.operationshub.validation.TicketFilter;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface TicketService {

    TicketResponse createTicket(TicketCreateRequest request);

    TicketResponse getTicketById(Long id);

    List<TicketResponse> getTickets(TicketFilter filter);

    TicketResponse assignTechnician(Long id, TicketAssignRequest request);

    TicketResponse updateTicketStatus(Long id, TicketStatusUpdateRequest request);

    TicketResponse rejectTicket(Long id, TicketRejectRequest request);

    List<TicketCommentResponse> getComments(Long ticketId);

    TicketCommentResponse addComment(Long ticketId, TicketCommentCreateRequest request);

    TicketCommentResponse updateComment(Long ticketId, Long commentId, TicketCommentUpdateRequest request);

    void deleteComment(Long ticketId, Long commentId, String actorEmail);

    List<TicketAttachmentResponse> getAttachments(Long ticketId);

    TicketAttachmentResponse uploadAttachment(Long ticketId, String uploadedBy, MultipartFile file);

    void deleteAttachment(Long ticketId, Long attachmentId);

    void deleteTicket(Long id);
}