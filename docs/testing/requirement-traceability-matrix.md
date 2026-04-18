# Requirement Traceability Matrix

Track requirement-to-implementation and requirement-to-test links so evaluators can verify completeness quickly.

| Requirement ID | Requirement Summary | Workstream | Endpoint or UI | Test Type | Test Reference | Result |
|---|---|---|---|---|---|---|
| A-01 | Add and manage resources | WS1 | /api/v1/resources, CataloguePage | Unit + Integration | ResourceServiceTest, ResourceControllerIntegrationTest | Pass (Backend) |
| A-02 | Search and filter resources | WS1 | GET /api/v1/resources with query params | Integration + UI | ResourceControllerIntegrationTest | Pass (Backend API) |
| A-03 | Get, update, and delete resource by id | WS1 | GET/PUT/DELETE /api/v1/resources/{id} | Integration | ResourceControllerIntegrationTest.resourceCrudLifecycle_shouldSupportGetUpdateDeleteById | Pass (Backend API) |
| A-04 | Reject invalid capacity range filters | WS1 | GET /api/v1/resources?minCapacity=&maxCapacity= | Integration | ResourceControllerIntegrationTest.getResources_shouldReturnBadRequestWhenCapacityRangeInvalid | Pass (Backend API) |
| B-01 | Create booking request | WS2 | POST /api/v1/bookings | Unit + Integration | BookingServiceTest, BookingControllerIntegrationTest | Pass (Backend) |
| B-02 | Prevent overlapping bookings | WS2 | Booking conflict validation service | Unit + Integration | BookingServiceTest, BookingControllerIntegrationTest | Pass (Backend) |
| B-03 | Approve or reject bookings | WS2 | PATCH approve/reject endpoints | Integration + UI | BookingControllerIntegrationTest | Pass (Backend API) |
| C-01 | Create and track tickets | WS3 | /api/v1/tickets, TicketsPage | Unit + Integration | TicketServiceTest, TicketControllerIntegrationTest | Pass (Backend + Frontend) |
| C-02 | Attachment limit max 3 images | WS3 | attachments endpoint validation | Unit + Integration | TicketServiceTest, TicketControllerIntegrationTest | Pass (Backend + Frontend API) |
| C-03 | Comment ownership rules | WS3 | comment edit/delete authorization | Unit + Integration | TicketServiceTest, TicketControllerIntegrationTest | Pass (Backend + Frontend) |
| D-01 | Notify booking and ticket changes | WS4 | /api/v1/notifications, NotificationsPage | Unit + Integration + UI | NotificationServiceTest, NotificationControllerIntegrationTest | Pass (Backend + Frontend) |
| E-01 | OAuth2 login and role control | WS4 | /api/v1/auth/me, AppLayout role-aware profile card | Integration + UI | NotificationControllerIntegrationTest (auth profile endpoint) | Pass (Backend + Frontend) |

## Usage

1. Add exact test class, test name, or Postman request path in Test Reference.
2. Update Result as Pass or Fail.
3. Keep this matrix in sync with docs/api/endpoint-ownership-matrix.md.