# Endpoint Ownership Matrix

Use this file to demonstrate exactly who implemented each endpoint and UI integration area. For solo implementation, keep owner as the same person and keep workstream split visible.

| Workstream | Module | Endpoint | Method | Purpose | UI Component/Page | Status |
|---|---|---|---|---|---|---|
| WS1 | A | /api/v1/resources | POST | Create resource | CataloguePage resource form | Implemented (Backend + Frontend) |
| WS1 | A | /api/v1/resources | GET | List resources with filters | CataloguePage resource table | Implemented (Backend + Frontend) |
| WS1 | A | /api/v1/resources/{id} | GET | Get resource by id | CataloguePage resource table item details | Implemented (Backend + Frontend) |
| WS1 | A | /api/v1/resources/{id} | PUT | Update resource | CataloguePage edit modal | Implemented (Backend + Frontend) |
| WS1 | A | /api/v1/resources/{id} | DELETE | Delete resource | CataloguePage delete action | Implemented (Backend + Frontend) |
| WS2 | B | /api/v1/bookings | POST | Create booking request | BookingsPage request form | Implemented (Backend + Frontend) |
| WS2 | B | /api/v1/bookings/my | GET | View own bookings | BookingsPage user list | Implemented (Backend + Frontend) |
| WS2 | B | /api/v1/bookings/{id}/approve | PATCH | Approve booking | BookingsPage admin actions | Implemented (Backend + Frontend) |
| WS2 | B | /api/v1/bookings/{id}/reject | PATCH | Reject booking | BookingsPage admin actions | Implemented (Backend + Frontend) |
| WS2 | B | /api/v1/bookings/{id}/cancel | PATCH | Cancel approved booking | BookingsPage booking details | Implemented (Backend + Frontend) |
| WS3 | C | /api/v1/tickets | POST | Create incident ticket | TicketsPage report form | Implemented (Backend + Frontend) |
| WS3 | C | /api/v1/tickets/{id}/assign | PATCH | Assign technician | TicketsPage admin panel | Implemented (Backend + Frontend) |
| WS3 | C | /api/v1/tickets/{id}/status | PATCH | Update ticket status | TicketsPage status actions | Implemented (Backend + Frontend) |
| WS3 | C | /api/v1/tickets/{id}/comments | POST | Add comment | TicketsPage comments section | Implemented (Backend + Frontend) |
| WS3 | C | /api/v1/tickets/{id}/attachments | POST | Upload evidence images | TicketsPage attachment uploader | Implemented (Backend + Frontend) |
| WS4 | D | /api/v1/notifications | GET | List user notifications | NotificationsPage list | Implemented (Backend + Frontend) |
| WS4 | D | /api/v1/notifications/summary | GET | Fetch unread summary count | NotificationsPage unread count | Implemented (Backend + Frontend) |
| WS4 | D | /api/v1/notifications/{id}/read | PATCH | Mark notification as read | NotificationsPage item action | Implemented (Backend + Frontend) |
| WS4 | E | /api/v1/auth/me | GET | Current user profile and roles | AppLayout role-aware profile card | Implemented (Backend + Frontend) |

## Update Rule

When work is implemented:

1. Change Status from Planned to Implemented.
2. Add implementation reference in PR description.
3. Add test evidence reference in docs/testing/requirement-traceability-matrix.md.