# C4 Container Diagram — Mini Jira MVP

```mermaid
C4Container
    title Container Diagram — Mini Jira MVP

    Person(user, "Team Member", "Creates and manages tickets; navigates the Kanban board")
    Person(admin, "Admin", "Reverts tickets, manages users, views archived tickets")

    System_Ext(idp, "Corporate Identity Provider", "Validates domain credentials and issues identity tokens via OIDC / OAuth 2.0")

    System_Boundary(miniJira, "Mini Jira") {

        Container(spa, "Web Application", "SPA — e.g. React", "Renders Kanban board, ticket forms, filters, and role-aware UI controls. Runs in the browser.")

        Container(api, "API Server", "REST API — e.g. FastAPI / Node.js", "Enforces business rules: ticket lifecycle, role-based access control, optimistic concurrency check, and audit trail recording.")

        Container(db, "Relational Database", "PostgreSQL", "Persists users, tickets, state-transition history, audit log, and closed timestamps.")

        Container(sessionStore, "Session Store", "Redis", "Holds session tokens with 8-hour TTL. Supports immediate invalidation when an account is deactivated.")

    }

    Rel(user, spa, "Uses", "HTTPS")
    Rel(admin, spa, "Uses", "HTTPS")

    Rel(spa, idp, "Redirects for login", "HTTPS / OIDC")
    Rel(idp, spa, "Returns identity token", "HTTPS / OIDC")

    Rel(spa, api, "API calls", "HTTPS / JSON")

    Rel(api, idp, "Validates token and corporate domain", "HTTPS / OIDC")
    Rel(api, db, "Reads and writes", "SQL over TLS")
    Rel(api, sessionStore, "Creates, validates, and revokes sessions", "Redis protocol over TLS")
```

## Key Architectural Decisions

| Requirement | Container decision |
|---|---|
| Corporate domain auth (HU-01) | External IdP — domain check delegated, not home-grown |
| 8-hour session expiry (HU-01) | Redis TTL — avoids polling the DB on every request |
| Immediate invalidation on deactivation (HU-01) | Redis key deletion by the API on account deactivation event |
| Audit trail + timestamps (HU-02) | Persisted in PostgreSQL alongside state-transition rows |
| Optimistic concurrency (HU-02) | Version/ETag check enforced at the API layer before any write |
| Archived ticket filter (HU-03) | `is_archived` flag in DB; API filters by default unless admin requests otherwise |
