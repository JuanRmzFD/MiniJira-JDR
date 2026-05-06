# ER Diagram — Mini Jira

```mermaid
erDiagram

    %% ─── Tablas de referencia ───────────────────────────────────

    ticket_states {
        text         code        PK
        text         label
        integer      sort_order
    }

    allowed_transitions {
        text         from_state  PK,FK
        text         to_state    PK,FK
        integer      admin_only
    }

    %% ─── Usuarios ───────────────────────────────────────────────

    users {
        text         id           PK
        text         email        UK
        text         display_name
        text         role
        integer      is_active
        text         created_at
        text         updated_at
        text         password_hash
    }

    %% ─── Tickets ────────────────────────────────────────────────

    tickets {
        text         id           PK
        text         title
        text         description
        text         state        FK
        text         priority
        text         creator_id   FK
        text         assigned_to  FK
        integer      archived
        text         closed_at
        integer      version
        text         created_at
        text         updated_at
    }

    ticket_labels {
        text         ticket_id  PK,FK
        text         label      PK
    }

    %% ─── Audit trail ────────────────────────────────────────────

    state_transitions {
        text         id          PK
        text         ticket_id   FK
        text         from_state  FK
        text         to_state    FK
        text         changed_by  FK
        text         created_at
    }

    %% ─── Comentarios ────────────────────────────────────────────

    comments {
        text         id         PK
        text         ticket_id  FK
        text         author_id  FK
        text         content
        text         created_at
    }

    %% ─── Relaciones ─────────────────────────────────────────────

    ticket_states       ||--o{ allowed_transitions : "from_state"
    ticket_states       ||--o{ allowed_transitions : "to_state"

    ticket_states       ||--o{ tickets             : "state"

    users               ||--o{ tickets             : "crea (creator_id)"
    users               |o--o{ tickets             : "se asigna (assigned_to)"

    tickets             ||--o{ ticket_labels       : "tiene"
    tickets             ||--o{ state_transitions   : "registra historial"
    tickets             ||--o{ comments            : "recibe"

    ticket_states       ||--o{ state_transitions   : "from_state"
    ticket_states       ||--o{ state_transitions   : "to_state"

    users               ||--o{ state_transitions   : "changed_by"
    users               ||--o{ comments            : "author_id"
```

## Notas de diseño

| Decisión | Motivo |
|---|---|
| `ticket_states` como tabla, no enum | Permite agregar estados vía INSERT sin migrar el schema |
| `allowed_transitions` con `admin_only` | Fuente de verdad de la máquina de estados; el backend la consulta en vez de hardcodear la lógica |
| `from_state NULL` en `state_transitions` | Representa la creación inicial del ticket (sin estado previo) |
| `version INT` en `tickets` | Optimistic locking: el backend rechaza escrituras con versión desactualizada (409) |
| `closed_at` texto ISO 8601 | Garantiza coherencia: solo se asigna cuando `state = 'listo'`; se limpia si se regresa |
| Borrado lógico en tickets | Los tickets solo se archivan (`archived = 1`); no hay borrado físico |
| `ON DELETE CASCADE` en `ticket_labels` | Las etiquetas son datos derivados del ticket |
| Sesiones en MemoryStore | express-session con MemoryStore; solo para entorno de desarrollo |
| Tipos SQLite | Todos los UUIDs y timestamps se almacenan como `text`; booleanos como `integer` (0/1) |
| `password_hash` en `users` | Contraseña hasheada con bcrypt; nunca se expone en respuestas de API |
