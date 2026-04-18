package com.smartcampus.operationshub.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.operationshub.dto.NotificationResponse;
import com.smartcampus.operationshub.service.NotificationService;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @RequestParam String recipientEmail,
            @RequestParam(defaultValue = "false") boolean unreadOnly
    ) {
        return ResponseEntity.ok(notificationService.getNotifications(recipientEmail, unreadOnly));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Long>> getSummary(@RequestParam String recipientEmail) {
        return ResponseEntity.ok(Map.of("unreadCount", notificationService.getUnreadCount(recipientEmail)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable Long id,
            @RequestParam String recipientEmail
    ) {
        return ResponseEntity.ok(notificationService.markAsRead(id, recipientEmail));
    }

    @PatchMapping("/{id}/unread")
    public ResponseEntity<NotificationResponse> markAsUnread(
            @PathVariable Long id,
            @RequestParam String recipientEmail
    ) {
        return ResponseEntity.ok(notificationService.markAsUnread(id, recipientEmail));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id,
            @RequestParam String recipientEmail
    ) {
        notificationService.deleteNotification(id, recipientEmail);
        return ResponseEntity.noContent().build();
    }
}