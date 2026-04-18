package com.smartcampus.operationshub.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.operationshub.dto.TicketAssignRequest;
import com.smartcampus.operationshub.dto.TicketCommentCreateRequest;
import com.smartcampus.operationshub.dto.TicketCommentUpdateRequest;
import com.smartcampus.operationshub.dto.TicketCreateRequest;
import com.smartcampus.operationshub.dto.TicketRejectRequest;
import com.smartcampus.operationshub.dto.TicketStatusUpdateRequest;
import com.smartcampus.operationshub.entity.TicketPriority;
import com.smartcampus.operationshub.entity.TicketStatus;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
class TicketControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createAssignResolveAndCloseTicket_shouldFollowWorkflow() throws Exception {
        long ticketId = createTicket();

        TicketAssignRequest assignRequest = new TicketAssignRequest();
        assignRequest.setTechnicianEmail("tech1@smartcampus.local");

        mockMvc.perform(patch("/api/v1/tickets/{id}/assign", ticketId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        TicketStatusUpdateRequest resolveRequest = new TicketStatusUpdateRequest();
        resolveRequest.setStatus(TicketStatus.RESOLVED);
        resolveRequest.setResolutionNotes("Cable replaced successfully");

        mockMvc.perform(patch("/api/v1/tickets/{id}/status", ticketId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resolveRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"));

        TicketStatusUpdateRequest closeRequest = new TicketStatusUpdateRequest();
        closeRequest.setStatus(TicketStatus.CLOSED);

        mockMvc.perform(patch("/api/v1/tickets/{id}/status", ticketId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(closeRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));
    }

    @Test
    void commentUpdateAndDelete_shouldEnforceOwnership() throws Exception {
        long ticketId = createTicket();

        TicketCommentCreateRequest createRequest = new TicketCommentCreateRequest();
        createRequest.setAuthorEmail("owner@smartcampus.local");
        createRequest.setContent("Initial comment");

        String commentJson = mockMvc.perform(post("/api/v1/tickets/{id}/comments", ticketId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        long commentId = objectMapper.readTree(commentJson).get("id").asLong();

        TicketCommentUpdateRequest forbiddenUpdate = new TicketCommentUpdateRequest();
        forbiddenUpdate.setActorEmail("other@smartcampus.local");
        forbiddenUpdate.setContent("Try to edit");

        mockMvc.perform(put("/api/v1/tickets/{id}/comments/{commentId}", ticketId, commentId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forbiddenUpdate)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/v1/tickets/{id}/comments/{commentId}", ticketId, commentId)
                        .param("actorEmail", "other@smartcampus.local"))
                .andExpect(status().isForbidden());
    }

    @Test
    void uploadAttachment_shouldRejectFourthImage() throws Exception {
        long ticketId = createTicket();

        for (int i = 1; i <= 3; i++) {
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "photo" + i + ".jpg",
                    "image/jpeg",
                    ("image-" + i).getBytes()
            );

            mockMvc.perform(multipart("/api/v1/tickets/{id}/attachments", ticketId)
                            .file(file)
                            .param("uploadedBy", "tech@smartcampus.local"))
                    .andExpect(status().isCreated());
        }

        MockMultipartFile fourth = new MockMultipartFile(
                "file",
                "photo4.jpg",
                "image/jpeg",
                "image-4".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/tickets/{id}/attachments", ticketId)
                        .file(fourth)
                        .param("uploadedBy", "tech@smartcampus.local"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void rejectTicket_shouldSetRejectedStatusAndReason() throws Exception {
        long ticketId = createTicket();

        TicketRejectRequest rejectRequest = new TicketRejectRequest();
        rejectRequest.setReason("Invalid duplicate report");

        mockMvc.perform(patch("/api/v1/tickets/{id}/reject", ticketId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionReason").value("Invalid duplicate report"));
    }

    private long createTicket() throws Exception {
        TicketCreateRequest request = new TicketCreateRequest();
        request.setCategory("PROJECTOR");
        request.setDescription("Projector not powering on");
        request.setPriority(TicketPriority.HIGH);
        request.setLocation("Block A - Lab 3");
        request.setRequesterEmail("student@smartcampus.local");
        request.setPreferredContact("student@smartcampus.local");

        String json = mockMvc.perform(post("/api/v1/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(json).get("id").asLong();
    }
}