package com.smartcampus.operationshub.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.smartcampus.operationshub.dto.NotificationResponse;
import com.smartcampus.operationshub.entity.Notification;
import com.smartcampus.operationshub.entity.NotificationType;
import com.smartcampus.operationshub.repository.NotificationRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationServiceImpl(notificationRepository);
    }

    @Test
    void createNotification_shouldNormalizeEmail() {
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification arg = invocation.getArgument(0);
            arg.setId(1L);
            return arg;
        });

        NotificationResponse response = notificationService.createNotification(
                " Student1@SmartCampus.Local ",
                NotificationType.BOOKING_CREATED,
                "Booking request submitted",
                "Your booking is pending review.",
                "BOOKING",
                10L
        );

        assertEquals("student1@smartcampus.local", response.getRecipientEmail());
        assertEquals(NotificationType.BOOKING_CREATED, response.getType());
    }

    @Test
    void markAsRead_shouldSetReadFlags() {
        Notification notification = sampleNotification(2L);
        notification.setRead(false);

        when(notificationRepository.findByIdAndRecipientEmail(2L, "student1@smartcampus.local"))
                .thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationResponse response = notificationService.markAsRead(2L, "student1@smartcampus.local");

        assertTrue(response.isRead());
        assertNotNull(response.getReadAt());
    }

    @Test
    void getNotifications_shouldReturnUnreadOnlyWhenRequested() {
        Notification notification = sampleNotification(3L);
        notification.setRead(false);

        when(notificationRepository.findByRecipientEmailAndIsReadFalseOrderByCreatedAtDesc("student1@smartcampus.local"))
                .thenReturn(List.of(notification));

        List<NotificationResponse> responses = notificationService.getNotifications("student1@smartcampus.local", true);

        assertEquals(1, responses.size());
        assertEquals(3L, responses.get(0).getId());
    }

    private Notification sampleNotification(Long id) {
        Notification notification = new Notification();
        notification.setId(id);
        notification.setRecipientEmail("student1@smartcampus.local");
        notification.setType(NotificationType.TICKET_CREATED);
        notification.setTitle("Ticket created");
        notification.setMessage("Ticket #100 has been opened.");
        notification.setReferenceType("TICKET");
        notification.setReferenceId(100L);
        notification.setRead(false);
        notification.setReadAt(null);
        return notification;
    }
}