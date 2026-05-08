# Nextgen Ticketing System Wireframes

## Desktop Command Center

```text
+----------------------+---------------------------------------------------------------+
| Nextgen              | Top bar: title, service desk context, search, New Ticket    |
| Technology Limited   +---------------------------------------------------------------+
|                      | Metric cards: Active | Urgent SLA | Overdue | Resolved      |
| Command Center       +---------------------------------------------------------------+
| Tickets              | Service health: Hosting | Mail Security | Fiber / VSAT       |
| Clients              +---------------------------------------------------------------+
| Services             | Service queue summary by category                            |
| Teams                | Domain Hosting | Email | ISP/VSAT | CCTV | Docs | Software    |
| Settings             +---------------------------------------------------------------+
|                      | Ticket queue table                                           |
| 24/7 Support Desk    | Ticket | Client | Service | SLA | Priority | Status | Actions   |
| support@...          |                                                               |
| +675 325 2023        |                                                               |
+----------------------+------------------------------+--------------------------------+
                       | Create/Edit Ticket Form      | Ticket Detail + Activity       |
                       | title, client, service, SLA   | requester, service, SLA, notes |
                       +------------------------------+--------------------------------+
```

## Mobile Layout

```text
+------------------------------------------------+
| Nextgen Support Command Center                 |
| Search                                         |
| New Ticket                                     |
+------------------------------------------------+
| Active | Urgent | Overdue | Resolved           |
+------------------------------------------------+
| Service health rows                            |
+------------------------------------------------+
| Service category counters                      |
+------------------------------------------------+
| Horizontal ticket table / queue                |
+------------------------------------------------+
| Log Service Ticket form                        |
+------------------------------------------------+
| Selected ticket details and activity           |
+------------------------------------------------+
```

## Core Workflow

1. Support user searches or filters the queue by status and priority.
2. User selects a ticket to inspect service line, SLA, client contact, and activity.
3. User creates or edits a ticket using the service-aware form.
4. Status changes automatically add an activity event through the API.
5. User adds manual support updates to the ticket activity timeline.
