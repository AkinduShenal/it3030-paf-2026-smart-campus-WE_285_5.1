package com.smartcampus.operationshub.service;

import java.util.List;

import com.smartcampus.operationshub.dto.NotificationResponse;
import com.smartcampus.operationshub.entity.NotificationType;

public interface NotificationService {

    NotificationResponse createNotification(
            String recipientEmail,
            NotificationType type,
            String title,
            String message,
            String referenceType,
            Long referenceId
    );

    List<NotificationResponse> getNotifications(String recipientEmail, boolean unreadOnly);

    NotificationResponse markAsRead(Long id, String recipientEmail);

    NotificationResponse markAsUnread(Long id, String recipientEmail);

    void deleteNotification(Long id, String recipientEmail);

    long getUnreadCount(String recipientEmail);
}