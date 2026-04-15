package com.smartcampus.operationshub.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        ApiErrorResponse error = ApiErrorResponse.of(
                HttpStatus.NOT_FOUND.value(),
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

        @ExceptionHandler(BookingNotFoundException.class)
        public ResponseEntity<ApiErrorResponse> handleBookingNotFound(BookingNotFoundException ex, HttpServletRequest request) {
                ApiErrorResponse error = ApiErrorResponse.of(
                                HttpStatus.NOT_FOUND.value(),
                                HttpStatus.NOT_FOUND.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI()
                );
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        @ExceptionHandler(TicketNotFoundException.class)
        public ResponseEntity<ApiErrorResponse> handleTicketNotFound(TicketNotFoundException ex, HttpServletRequest request) {
                ApiErrorResponse error = ApiErrorResponse.of(
                                HttpStatus.NOT_FOUND.value(),
                                HttpStatus.NOT_FOUND.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI()
                );
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        @ExceptionHandler(TicketCommentNotFoundException.class)
        public ResponseEntity<ApiErrorResponse> handleCommentNotFound(TicketCommentNotFoundException ex, HttpServletRequest request) {
                ApiErrorResponse error = ApiErrorResponse.of(
                                HttpStatus.NOT_FOUND.value(),
                                HttpStatus.NOT_FOUND.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI()
                );
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        @ExceptionHandler(NotificationNotFoundException.class)
        public ResponseEntity<ApiErrorResponse> handleNotificationNotFound(NotificationNotFoundException ex,
                        HttpServletRequest request) {
                ApiErrorResponse error = ApiErrorResponse.of(
                                HttpStatus.NOT_FOUND.value(),
                                HttpStatus.NOT_FOUND.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI()
                );
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        @ExceptionHandler(BookingConflictException.class)
        public ResponseEntity<ApiErrorResponse> handleConflict(BookingConflictException ex, HttpServletRequest request) {
                ApiErrorResponse error = ApiErrorResponse.of(
                                HttpStatus.CONFLICT.value(),
                                HttpStatus.CONFLICT.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI()
                );
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }

        @ExceptionHandler(TicketAttachmentLimitException.class)
        public ResponseEntity<ApiErrorResponse> handleAttachmentLimit(TicketAttachmentLimitException ex,
                        HttpServletRequest request) {
                ApiErrorResponse error = ApiErrorResponse.of(
                                HttpStatus.CONFLICT.value(),
                                HttpStatus.CONFLICT.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI()
                );
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }

        @ExceptionHandler(BookingStateException.class)
        public ResponseEntity<ApiErrorResponse> handleState(BookingStateException ex, HttpServletRequest request) {
                ApiErrorResponse error = ApiErrorResponse.of(
                                HttpStatus.BAD_REQUEST.value(),
                                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI()
                );
                return ResponseEntity.badRequest().body(error);
        }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        ApiErrorResponse error = ApiErrorResponse.withValidation(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "Validation failed",
                request.getRequestURI(),
                fieldErrors
        );
        return ResponseEntity.badRequest().body(error);
    }

        @ExceptionHandler(InvalidAttachmentException.class)
        public ResponseEntity<ApiErrorResponse> handleInvalidAttachment(InvalidAttachmentException ex,
                        HttpServletRequest request) {
                ApiErrorResponse error = ApiErrorResponse.of(
                                HttpStatus.BAD_REQUEST.value(),
                                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI()
                );
                return ResponseEntity.badRequest().body(error);
        }

        @ExceptionHandler(TicketCommentOwnershipException.class)
        public ResponseEntity<ApiErrorResponse> handleCommentOwnership(TicketCommentOwnershipException ex,
                        HttpServletRequest request) {
                ApiErrorResponse error = ApiErrorResponse.of(
                                HttpStatus.FORBIDDEN.value(),
                                HttpStatus.FORBIDDEN.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI()
                );
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex,
            HttpServletRequest request
    ) {
        Map<String, String> violations = new LinkedHashMap<>();
        ex.getConstraintViolations().forEach(violation -> violations.put(
                violation.getPropertyPath().toString(),
                violation.getMessage()
        ));

        ApiErrorResponse error = ApiErrorResponse.withValidation(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                "Constraint validation failed",
                request.getRequestURI(),
                violations
        );
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler({IllegalArgumentException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiErrorResponse> handleBadRequest(Exception ex, HttpServletRequest request) {
        ApiErrorResponse error = ApiErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.badRequest().body(error);
    }

        @ExceptionHandler(UserAlreadyExistsException.class)
        public ResponseEntity<ApiErrorResponse> handleUserAlreadyExists(UserAlreadyExistsException ex,
                        HttpServletRequest request) {
                ApiErrorResponse error = ApiErrorResponse.of(
                                HttpStatus.CONFLICT.value(),
                                HttpStatus.CONFLICT.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI()
                );
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }

        @ExceptionHandler(InvalidCredentialsException.class)
        public ResponseEntity<ApiErrorResponse> handleInvalidCredentials(InvalidCredentialsException ex,
                        HttpServletRequest request) {
                ApiErrorResponse error = ApiErrorResponse.of(
                                HttpStatus.UNAUTHORIZED.value(),
                                HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI()
                );
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        ApiErrorResponse error = ApiErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                "Unexpected server error",
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}