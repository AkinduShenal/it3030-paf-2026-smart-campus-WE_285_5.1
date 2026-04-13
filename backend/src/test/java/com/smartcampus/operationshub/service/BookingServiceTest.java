package com.smartcampus.operationshub.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.smartcampus.operationshub.dto.BookingCancelRequest;
import com.smartcampus.operationshub.dto.BookingCreateRequest;
import com.smartcampus.operationshub.dto.BookingResponse;
import com.smartcampus.operationshub.entity.Booking;
import com.smartcampus.operationshub.entity.BookingStatus;
import com.smartcampus.operationshub.entity.Resource;
import com.smartcampus.operationshub.entity.ResourceStatus;
import com.smartcampus.operationshub.entity.ResourceType;
import com.smartcampus.operationshub.exception.BookingConflictException;
import com.smartcampus.operationshub.exception.BookingStateException;
import com.smartcampus.operationshub.repository.BookingRepository;
import com.smartcampus.operationshub.repository.ResourceRepository;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ResourceRepository resourceRepository;

    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        bookingService = new BookingServiceImpl(bookingRepository, resourceRepository);
    }

    @Test
    void createBooking_shouldThrowConflictWhenOverlapExists() {
        Resource resource = activeResource();
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(resource));
        when(bookingRepository.existsByResourceIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
                any(Long.class),
                ArgumentMatchers.<Collection<BookingStatus>>any(),
                any(LocalDateTime.class),
                any(LocalDateTime.class)
        )).thenReturn(true);

        BookingCreateRequest request = new BookingCreateRequest();
        request.setResourceId(1L);
        request.setRequesterEmail("user1@smartcampus.local");
        request.setStartTime(LocalDateTime.now().plusDays(1));
        request.setEndTime(LocalDateTime.now().plusDays(1).plusHours(2));
        request.setPurpose("Seminar");
        request.setExpectedAttendees(40);

        assertThrows(BookingConflictException.class, () -> bookingService.createBooking(request));
    }

    @Test
    void approveBooking_shouldSetApprovedWhenPendingAndNoConflict() {
        Booking booking = pendingBooking();
        when(bookingRepository.findById(10L)).thenReturn(Optional.of(booking));
        when(bookingRepository.existsByIdNotAndResourceIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
                any(Long.class),
                any(Long.class),
                ArgumentMatchers.<Collection<BookingStatus>>any(),
                any(LocalDateTime.class),
                any(LocalDateTime.class)
        )).thenReturn(false);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BookingResponse response = bookingService.approveBooking(10L);

        assertEquals(BookingStatus.APPROVED, response.getStatus());
    }

    @Test
    void cancelBooking_shouldFailForNotOwner() {
        Booking booking = pendingBooking();
        booking.setStatus(BookingStatus.APPROVED);

        when(bookingRepository.findById(10L)).thenReturn(Optional.of(booking));

        BookingCancelRequest request = new BookingCancelRequest();
        request.setRequesterEmail("another.user@smartcampus.local");

        assertThrows(IllegalArgumentException.class, () -> bookingService.cancelBooking(10L, request));
    }

    @Test
    void rejectBooking_shouldFailWhenAlreadyApproved() {
        Booking booking = pendingBooking();
        booking.setStatus(BookingStatus.APPROVED);
        when(bookingRepository.findById(10L)).thenReturn(Optional.of(booking));

        com.smartcampus.operationshub.dto.BookingRejectRequest request = new com.smartcampus.operationshub.dto.BookingRejectRequest();
        request.setReason("Policy restriction");

        assertThrows(BookingStateException.class, () -> bookingService.rejectBooking(10L, request));
    }

    @Test
    void getBookings_shouldReturnMappedData() {
        Booking booking = pendingBooking();
        when(bookingRepository.findAll(ArgumentMatchers.<Specification<Booking>>any(), any(Sort.class)))
                .thenReturn(List.of(booking));

        List<BookingResponse> responses = bookingService.getBookings(new com.smartcampus.operationshub.validation.BookingFilter());

        assertEquals(1, responses.size());
        assertEquals("Resource A", responses.get(0).getResourceName());
    }

    private Resource activeResource() {
        Resource resource = new Resource();
        resource.setId(1L);
        resource.setName("Resource A");
        resource.setType(ResourceType.LAB);
        resource.setCapacity(60);
        resource.setLocation("Block A");
        resource.setStatus(ResourceStatus.ACTIVE);
        return resource;
    }

    private Booking pendingBooking() {
        Booking booking = new Booking();
        booking.setId(10L);
        booking.setResource(activeResource());
        booking.setRequesterEmail("owner@smartcampus.local");
        booking.setStartTime(LocalDateTime.now().plusDays(2));
        booking.setEndTime(LocalDateTime.now().plusDays(2).plusHours(1));
        booking.setPurpose("Lab session");
        booking.setExpectedAttendees(30);
        booking.setStatus(BookingStatus.PENDING);
        return booking;
    }
}