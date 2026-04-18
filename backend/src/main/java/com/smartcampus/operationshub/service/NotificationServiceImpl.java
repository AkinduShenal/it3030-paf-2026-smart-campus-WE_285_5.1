package com.smartcampus.operationshub.service;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartcampus.operationshub.dto.NotificationResponse;
import com.smartcampus.operationshub.entity.Notification;
import com.smartcampus.operationshub.entity.NotificationType;
import com.smartcampus.operationshub.exception.NotificationNotFoundException;
import com.smartcampus.operationshub.repository.NotificationRepository;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    public NotificationResponse createNotification(
            String recipientEmail,
            NotificationType type,
            String title,
            String message,
            String referenceType,
            Long referenceId
    ) {
        Notification notification = new Notification();
        notification.setRecipientEmail(normalizeEmail(recipientEmail));
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setReferenceType(referenceType);
        notification.setReferenceId(referenceId);
        notification.setRead(false);

        return toResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(String recipientEmail, boolean unreadOnly) {
        String normalizedEmail = normalizeEmail(recipientEmail);
        List<Notification> notifications = unreadOnly
                ? notificationRepository.findByRecipientEmailAndIsReadFalseOrderByCreatedAtDesc(normalizedEmail)
                : notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(normalizedEmail);

        return notifications.stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public NotificationResponse markAsRead(Long id, String recipientEmail) {
        Notification notification = notificationRepository.findByIdAndRecipientEmail(id, normalizeEmail(recipientEmail))
                .orElseThrow(() -> new NotificationNotFoundException("Notification not found for id: " + id));

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
        }

        return toResponse(notificationRepository.save(notification));
    }

    @Override
    public NotificationResponse markAsUnread(Long id, String recipientEmail) {
        Notification notification = notificationRepository.findByIdAndRecipientEmail(id, normalizeEmail(recipientEmail))
                .orElseThrow(() -> new NotificationNotFoundException("Notification not found for id: " + id));

        if (notification.isRead()) {
            notification.setRead(false);
            notification.setReadAt(null);
        }

        return toResponse(notificationRepository.save(notification));
    }

    @Override
    public void deleteNotification(Long id, String recipientEmail) {
        Notification notification = notificationRepository.findByIdAndRecipientEmail(id, normalizeEmail(recipientEmail))
                .orElseThrow(() -> new NotificationNotFoundException("Notification not found for id: " + id));

        notificationRepository.delete(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(String recipientEmail) {
        return notificationRepository.countByRecipientEmailAndIsReadFalse(normalizeEmail(recipientEmail));
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Recipient email is required");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private NotificationResponse toResponse(Notification notification) {
        NotificationResponse response = new NotificationResponse();
        response.setId(notification.getId());
        response.setRecipientEmail(notification.getRecipientEmail());
        response.setType(notification.getType());
        response.setTitle(notification.getTitle());
        response.setMessage(notification.getMessage());
        response.setReferenceType(notification.getReferenceType());
        response.setReferenceId(notification.getReferenceId());
        response.setRead(notification.isRead());
        response.setReadAt(notification.getReadAt());
        response.setCreatedAt(notification.getCreatedAt());
        return response;
    }
}