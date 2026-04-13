package com.smartcampus.operationshub.dto;

import com.smartcampus.operationshub.entity.TicketPriority;
import com.smartcampus.operationshub.entity.TicketStatus;
import java.time.Instant;
import java.util.List;

public class TicketResponse {

    private Long id;
    private String category;
    private String description;
    private TicketPriority priority;
    private TicketStatus status;
    private Long resourceId;
    private String resourceName;
    private String location;
    private String requesterEmail;
    private String preferredContact;
    private String assignedTechnicianEmail;
    private String resolutionNotes;
    private String rejectionReason;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant resolveBy;
    private List<TicketCommentResponse> comments;
    private List<TicketAttachmentResponse> attachments;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public TicketPriority getPriority() {
        return priority;
    }

    public void setPriority(TicketPriority priority) {
        this.priority = priority;
    }

    public TicketStatus getStatus() {
        return status;
    }

    public void setStatus(TicketStatus status) {
        this.status = status;
    }

    public Long getResourceId() {
        return resourceId;
    }

    public void setResourceId(Long resourceId) {
        this.resourceId = resourceId;
    }

    public String getResourceName() {
        return resourceName;
    }

    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getRequesterEmail() {
        return requesterEmail;
    }

    public void setRequesterEmail(String requesterEmail) {
        this.requesterEmail = requesterEmail;
    }

    public String getPreferredContact() {
        return preferredContact;
    }

    public void setPreferredContact(String preferredContact) {
        this.preferredContact = preferredContact;
    }

    public String getAssignedTechnicianEmail() {
        return assignedTechnicianEmail;
    }

    public void setAssignedTechnicianEmail(String assignedTechnicianEmail) {
        this.assignedTechnicianEmail = assignedTechnicianEmail;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Instant getResolveBy() {
        return resolveBy;
    }

    public void setResolveBy(Instant resolveBy) {
        this.resolveBy = resolveBy;
    }

    public List<TicketCommentResponse> getComments() {
        return comments;
    }

    public void setComments(List<TicketCommentResponse> comments) {
        this.comments = comments;
    }

    public List<TicketAttachmentResponse> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<TicketAttachmentResponse> attachments) {
        this.attachments = attachments;
    }
}