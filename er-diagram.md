# ER Diagram — Mini Jira

```mermaid
erDiagram

    %% ─── Tablas de referencia ───────────────────────────────────

    ticket_states {
        varchar(20)  code        PK
        varchar(50)  label
        smallint     sort_order
    }

    allowed_transitions {
        varchar(20)  from_state  PK,FK
        varchar(20)  to_state    PK,FK
        boolean      admin_only
    }

    %% ─── Usuarios ───────────────────────────────────────────────

    users {
        uuid         id           PK
        varchar(255) email        UK
        varchar(100) display_name
        user_role    role
        boolean      is_active
        timestamptz  created_at
        timestamptz  updated_at
    }

    %% ─── Tickets ────────────────────────────────────────────────

    tickets {
        uuid              id           PK
        varchar(150)      title
        text              description
        varchar(20)       state        FK
        ticket_priority   priority
        uuid              creator_id   FK
        uuid              assigned_to  FK
        boolean           archived
        timestamptz       closed_at
        integer           version
        timestamptz       created_at
        timestamptz       updated_at
    }

    ticket_labels {
        uuid         ticket_id  PK,FK
        varchar(100) label      PK
    }

    %% ─── Audit trail ────────────────────────────────────────────

    state_transitions {
        uuid        id          PK
        uuid        ticket_id   FK
        varchar(20) from_state  FK
        varchar(20) to_state    FK
        uuid        changed_by  FK
        timestamptz created_at
    }

    %% ─── Comentarios ────────────────────────────────────────────

    comments {
        uuid        id         PK
        uuid        ticket_id  FK
        uuid        author_id  FK
        text        content
        timestamptz created_at
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
| `ticket_states` como tabla, no enum PG | Permite agregar estados vía INSERT sin migrar el schema (riesgo R-03 del spec) |
| `allowed_transitions` con `admin_only` | Fuente de verdad de la máquina de estados; el backend la consulta en vez de hardcodear la lógica |
| `from_state NULL` en `state_transitions` | Representa la creación inicial del ticket (sin estado previo) |
| `version INT` en `tickets` | Optimistic locking: el backend rechaza escrituras con versión desactualizada (409) |
| `closed_at` con CHECK constraint | Garantiza coherencia a nivel de fila: solo puede existir si `state = 'listo'` |
| `ON DELETE RESTRICT` en `state_transitions` y `comments` | Los tickets solo se archivan lógicamente (`archived = true`); no hay borrado físico |
| `ON DELETE CASCADE` en `ticket_labels` | Las etiquetas son datos derivados del ticket; se eliminan junto a él si se borrara físicamente |
| Sessions en Redis, no en PostgreSQL | Confirmado por el diagrama de secuencia: Redis actúa como session store |
