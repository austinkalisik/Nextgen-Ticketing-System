# Nextgens Ticketing System ERD

```mermaid
erDiagram
    USERS {
        uuid id PK
        string name
        string email UK
        timestamp email_verified_at
        string password
        timestamps timestamps
    }

    TICKETS {
        uuid id PK
        string ticket_number UK
        string title
        text description
        string requester_name
        string requester_email
        string assignee_name
        string department
        string category
        enum priority "low|medium|high|urgent"
        enum status "open|in_progress|waiting|resolved|closed"
        date due_date
        timestamp resolved_at
        timestamps timestamps
    }

    TICKET_COMMENTS {
        uuid id PK
        uuid ticket_id FK
        string author_name
        text body
        string event_type
        timestamps timestamps
    }

    TICKETS ||--o{ TICKET_COMMENTS : has
```

## Notes

- `tickets.category` represents Nextgen service lines: Domain Hosting, Email Support, ISP / VSAT, AI CCTV Security, Document Management, and Software Engineering.
- `tickets.department` is used as the client, branch, or department name.
- `ticket_comments.event_type` separates normal comments from system events such as ticket creation and status changes.
- Current authentication is scaffolded through Laravel users, but the ticket workflow is not yet role-restricted.
