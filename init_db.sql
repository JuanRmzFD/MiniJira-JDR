-- ============================================================
-- init_db.sql — Mini Jira
-- PostgreSQL 15+
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. Enums
-- ============================================================

CREATE TYPE user_role       AS ENUM ('admin', 'usuario');
CREATE TYPE ticket_priority AS ENUM ('baja', 'media', 'alta');

-- ============================================================
-- 2. Tablas de referencia
-- ============================================================

-- Estados como tabla (no enum) para permitir agregar estados sin migrar el schema (riesgo R-03)
CREATE TABLE ticket_states (
    code       VARCHAR(20) PRIMARY KEY,
    label      VARCHAR(50) NOT NULL,
    sort_order SMALLINT    NOT NULL
);

INSERT INTO ticket_states (code, label, sort_order) VALUES
    ('por_hacer',   'Por hacer',   1),
    ('en_progreso', 'En progreso', 2),
    ('listo',       'Listo',       3);

-- Máquina de estados: fuente de verdad de transiciones permitidas
CREATE TABLE allowed_transitions (
    from_state VARCHAR(20) NOT NULL REFERENCES ticket_states(code),
    to_state   VARCHAR(20) NOT NULL REFERENCES ticket_states(code),
    admin_only BOOLEAN     NOT NULL DEFAULT false,
    PRIMARY KEY (from_state, to_state),
    CONSTRAINT no_self_transition CHECK (from_state <> to_state)
);

INSERT INTO allowed_transitions (from_state, to_state, admin_only) VALUES
    ('por_hacer',   'en_progreso', false),
    ('en_progreso', 'listo',       false),
    ('listo',       'en_progreso', true);   -- transición inversa: solo admin (D-03)

-- ============================================================
-- 3. Users
-- ============================================================

CREATE TABLE users (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email        VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    role         user_role    NOT NULL DEFAULT 'usuario',
    is_active    BOOLEAN      NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT email_not_empty        CHECK (TRIM(email) <> ''),
    CONSTRAINT display_name_not_empty CHECK (TRIM(display_name) <> '')
);

-- Trigger: updated_at automático en users
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Trigger: garantiza al menos un admin activo en todo momento (spec 2.1)
CREATE OR REPLACE FUNCTION fn_check_active_admin()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM users
        WHERE role = 'admin' AND is_active = true
    ) = 0 THEN
        RAISE EXCEPTION
            'El sistema debe tener al menos un admin activo. Promueve otro usuario antes de degradar este.';
    END IF;
    RETURN NEW;
END;
$$;

-- DEFERRABLE INITIALLY DEFERRED permite promover+degradar en la misma transacción
CREATE CONSTRAINT TRIGGER trg_enforce_active_admin
AFTER UPDATE ON users
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION fn_check_active_admin();

-- ============================================================
-- 4. Tickets
-- ============================================================

CREATE TABLE tickets (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(150)    NOT NULL,
    description TEXT,
    state       VARCHAR(20)     NOT NULL DEFAULT 'por_hacer' REFERENCES ticket_states(code),
    priority    ticket_priority,
    creator_id  UUID            NOT NULL REFERENCES users(id),
    assigned_to UUID            REFERENCES users(id),
    archived    BOOLEAN         NOT NULL DEFAULT false,
    closed_at   TIMESTAMPTZ,
    version     INTEGER         NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT title_not_empty CHECK (TRIM(title) <> ''),
    -- closed_at solo puede existir si el estado es 'listo'
    CONSTRAINT closed_at_requires_listo CHECK (
        (state = 'listo' AND closed_at IS NOT NULL)
        OR (state <> 'listo' AND closed_at IS NULL)
    )
);

-- Trigger: updated_at automático en tickets
CREATE TRIGGER trg_tickets_updated_at
BEFORE UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Trigger: gestiona closed_at según transición de estado (spec 2.2)
CREATE OR REPLACE FUNCTION fn_manage_closed_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.state = 'listo' AND OLD.state <> 'listo' THEN
        NEW.closed_at := NOW();
    ELSIF NEW.state <> 'listo' AND OLD.state = 'listo' THEN
        NEW.closed_at := NULL;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_manage_closed_at
BEFORE UPDATE OF state ON tickets
FOR EACH ROW EXECUTE FUNCTION fn_manage_closed_at();

-- ============================================================
-- 5. Etiquetas (lista de strings libres por ticket)
-- ============================================================

CREATE TABLE ticket_labels (
    ticket_id UUID        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    label     VARCHAR(100) NOT NULL,
    PRIMARY KEY (ticket_id, label),
    CONSTRAINT label_not_empty CHECK (TRIM(label) <> '')
);

-- ============================================================
-- 6. Historial de transiciones de estado (audit trail)
-- ============================================================

CREATE TABLE state_transitions (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id  UUID        NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
    from_state VARCHAR(20) REFERENCES ticket_states(code), -- NULL en creación inicial
    to_state   VARCHAR(20) NOT NULL REFERENCES ticket_states(code),
    changed_by UUID        NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. Comentarios
-- ============================================================

CREATE TABLE comments (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id  UUID        NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
    author_id  UUID        NOT NULL REFERENCES users(id),
    content    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- inmutable: sin updated_at

    CONSTRAINT content_not_empty CHECK (TRIM(content) <> '')
);

-- ============================================================
-- 8. Índices
-- ============================================================

-- users
CREATE INDEX idx_users_role_active ON users(role, is_active);

-- sessions se gestionan en Redis (ver spec stack); no tabla PostgreSQL

-- tickets: filtros principales del tablero (spec 2.3)
CREATE INDEX idx_tickets_state      ON tickets(state)       WHERE archived = false;
CREATE INDEX idx_tickets_creator    ON tickets(creator_id);
CREATE INDEX idx_tickets_assigned   ON tickets(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_tickets_created_at ON tickets(created_at)  WHERE archived = false;
CREATE INDEX idx_tickets_closed_at  ON tickets(closed_at)   WHERE closed_at IS NOT NULL;
CREATE INDEX idx_tickets_archived   ON tickets(archived);

-- state_transitions: historial por ticket
CREATE INDEX idx_state_transitions_ticket ON state_transitions(ticket_id, created_at);

-- comments: listado por ticket
CREATE INDEX idx_comments_ticket ON comments(ticket_id, created_at);

-- ticket_labels: búsqueda por etiqueta
CREATE INDEX idx_ticket_labels_label ON ticket_labels(label);

-- ============================================================
-- 9. Vista materializada — Dashboard de métricas (spec 2.6)
-- Refresco cada 15 minutos via job externo: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_metrics
-- ============================================================

CREATE MATERIALIZED VIEW mv_dashboard_metrics AS
SELECT
    DATE_TRUNC('month', COALESCE(t.closed_at, t.created_at))::DATE AS mes,
    COUNT(*)                                                         AS total_tickets,
    COUNT(*) FILTER (WHERE t.state = 'listo')                       AS tickets_cerrados,
    COUNT(*) FILTER (WHERE t.state = 'por_hacer')                   AS tickets_por_hacer,
    COUNT(*) FILTER (WHERE t.state = 'en_progreso')                 AS tickets_en_progreso,
    COUNT(*) FILTER (WHERE t.assigned_to IS NULL
                       AND t.state <> 'listo'
                       AND t.archived = false)                       AS tickets_sin_asignar
FROM tickets t
WHERE t.created_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', COALESCE(t.closed_at, t.created_at))
WITH DATA;

CREATE UNIQUE INDEX idx_mv_dashboard_metrics_mes ON mv_dashboard_metrics(mes);

-- ============================================================
-- 10. Seed — primer admin (D-04)
-- Ejecutar con: psql -v ADMIN_EMAIL='...' -v ADMIN_NAME='...' -f init_db.sql
-- ============================================================

-- INSERT INTO users (email, display_name, role)
-- VALUES (:'ADMIN_EMAIL', :'ADMIN_NAME', 'admin');

-- ============================================================
-- 11. Mock data — Entorno de desarrollo / QA
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- Usuarios
-- Laura: PO y admin | Marcos: Tech Lead y admin | Sofía: Dev Junior
-- ------------------------------------------------------------

INSERT INTO users (id, email, display_name, role, is_active, created_at, updated_at) VALUES
    (
        'a0000000-0000-0000-0000-000000000001',
        'laura.garcia@empresa.com',
        'Laura García',
        'admin',
        true,
        NOW() - INTERVAL '30 days',
        NOW() - INTERVAL '30 days'
    ),
    (
        'a0000000-0000-0000-0000-000000000002',
        'marcos.ruiz@empresa.com',
        'Marcos Ruiz',
        'admin',
        true,
        NOW() - INTERVAL '30 days',
        NOW() - INTERVAL '30 days'
    ),
    (
        'a0000000-0000-0000-0000-000000000003',
        'sofia.delgado@empresa.com',
        'Sofía Delgado',
        'usuario',
        true,
        NOW() - INTERVAL '28 days',
        NOW() - INTERVAL '28 days'
    );

-- ------------------------------------------------------------
-- Tickets
-- closed_at y version se setean manualmente aquí porque los
-- triggers solo actúan en UPDATE, no en INSERT de seed.
-- ------------------------------------------------------------

INSERT INTO tickets (
    id, title, description,
    state, priority,
    creator_id, assigned_to,
    archived, closed_at, version,
    created_at, updated_at
) VALUES
    -- #1 · Listo · Auth con OAuth (version=3: creación + 2 transiciones)
    (
        'b0000000-0000-0000-0000-000000000001',
        'Implementar login con OAuth corporativo',
        E'Configurar flujo OAuth 2.0 contra Google Workspace.\n\n'
        E'**Criterios de aceptación:**\n'
        E'- Redirección correcta al proveedor corporativo\n'
        E'- Creación de sesión en Redis con TTL de 8 h\n'
        E'- Rechazo de cuentas fuera del dominio `empresa.com` con 403',
        'listo',    'alta',
        'a0000000-0000-0000-0000-000000000002',   -- creador: Marcos
        'a0000000-0000-0000-0000-000000000002',   -- asignado: Marcos
        false,
        NOW() - INTERVAL '5 days',                -- closed_at manual para seed
        3,
        NOW() - INTERVAL '12 days',
        NOW() - INTERVAL '5 days'
    ),
    -- #2 · En progreso · Tablero Kanban (version=2: creación + 1 transición)
    (
        'b0000000-0000-0000-0000-000000000002',
        'Diseñar tablero Kanban con columnas de estado',
        E'Implementar vista Kanban en React con tres columnas: '
        E'**Por hacer**, **En progreso**, **Listo**.\n\n'
        E'Usar `shadcn/ui Card` para cada ticket. '
        E'Drag & drop queda fuera de v1.',
        'en_progreso', 'alta',
        'a0000000-0000-0000-0000-000000000001',   -- creadora: Laura
        'a0000000-0000-0000-0000-000000000003',   -- asignado: Sofía
        false, NULL, 2,
        NOW() - INTERVAL '9 days',
        NOW() - INTERVAL '3 days'
    ),
    -- #3 · En progreso · BullMQ (version=2: creación + 1 transición)
    (
        'b0000000-0000-0000-0000-000000000003',
        'Configurar BullMQ para cola de notificaciones por email',
        E'Integrar BullMQ sobre Redis para gestionar el envío de emails.\n\n'
        E'**Reglas:**\n'
        E'- Máximo 3 reintentos con backoff exponencial\n'
        E'- Agrupar eventos del mismo ticket + destinatario en ventana de 60 s',
        'en_progreso', 'media',
        'a0000000-0000-0000-0000-000000000002',   -- creador: Marcos
        'a0000000-0000-0000-0000-000000000002',   -- asignado: Marcos
        false, NULL, 2,
        NOW() - INTERVAL '7 days',
        NOW() - INTERVAL '2 days'
    ),
    -- #4 · Por hacer · Endpoint listado (version=1: sin transiciones)
    (
        'b0000000-0000-0000-0000-000000000004',
        'Crear endpoint GET /tickets con filtros',
        E'Implementar listado de tickets con soporte para los filtros del spec:\n'
        E'`estado`, `prioridad`, `etiquetas`, `asignado_a`, rango de `created_at`.\n\n'
        E'Paginar con cursor (no offset). Excluir archivados por defecto.',
        'por_hacer', 'media',
        'a0000000-0000-0000-0000-000000000003',   -- creadora: Sofía
        'a0000000-0000-0000-0000-000000000003',   -- asignado: Sofía
        false, NULL, 1,
        NOW() - INTERVAL '4 days',
        NOW() - INTERVAL '4 days'
    ),
    -- #5 · Por hacer · Documentación API export (version=1, sin asignar)
    (
        'b0000000-0000-0000-0000-000000000005',
        'Documentar contrato API de exportación CSV',
        E'Redactar la documentación del endpoint `GET /api/exports/metrics`:\n'
        E'- Parámetros: `type`, `from`, `to`\n'
        E'- Ejemplos de respuesta para `summary` y `detail`\n'
        E'- Errores: 401 (sin sesión), 400 (rango inválido), CSV vacío con toast',
        'por_hacer', 'baja',
        'a0000000-0000-0000-0000-000000000001',   -- creadora: Laura
        NULL,                                      -- sin asignar (D-05 referencia)
        false, NULL, 1,
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days'
    );

-- ------------------------------------------------------------
-- Etiquetas
-- ------------------------------------------------------------

INSERT INTO ticket_labels (ticket_id, label) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'auth'),
    ('b0000000-0000-0000-0000-000000000001', 'backend'),
    ('b0000000-0000-0000-0000-000000000001', 'semana-1'),
    ('b0000000-0000-0000-0000-000000000002', 'frontend'),
    ('b0000000-0000-0000-0000-000000000002', 'kanban'),
    ('b0000000-0000-0000-0000-000000000002', 'semana-1'),
    ('b0000000-0000-0000-0000-000000000003', 'backend'),
    ('b0000000-0000-0000-0000-000000000003', 'email'),
    ('b0000000-0000-0000-0000-000000000003', 'redis'),
    ('b0000000-0000-0000-0000-000000000004', 'backend'),
    ('b0000000-0000-0000-0000-000000000004', 'api'),
    ('b0000000-0000-0000-0000-000000000005', 'api'),
    ('b0000000-0000-0000-0000-000000000005', 'docs');

-- ------------------------------------------------------------
-- Historial de transiciones (audit trail — spec 2.2 + DoD)
-- from_state = NULL indica creación del ticket.
-- ------------------------------------------------------------

INSERT INTO state_transitions (id, ticket_id, from_state, to_state, changed_by, created_at) VALUES
    -- Ticket #1: creación → en_progreso → listo
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', NULL,          'por_hacer',   'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '12 days'),
    ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'por_hacer',   'en_progreso', 'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '10 days'),
    ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'en_progreso', 'listo',       'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '5 days'),
    -- Ticket #2: creación → en_progreso
    ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', NULL,          'por_hacer',   'a0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '9 days'),
    ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'por_hacer',   'en_progreso', 'a0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '3 days'),
    -- Ticket #3: creación → en_progreso
    ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', NULL,          'por_hacer',   'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '7 days'),
    ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000003', 'por_hacer',   'en_progreso', 'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '2 days'),
    -- Ticket #4: solo creación
    ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000004', NULL,          'por_hacer',   'a0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '4 days'),
    -- Ticket #5: solo creación
    ('c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000005', NULL,          'por_hacer',   'a0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 days');

-- ------------------------------------------------------------
-- Comentarios
-- ------------------------------------------------------------

INSERT INTO comments (id, ticket_id, author_id, content, created_at) VALUES
    -- Ticket #1 (listo) — conversación completa hasta cierre
    (
        'd0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'Confirmado con IT: el tenant de Google Workspace tiene habilitado OAuth. '
        'Las credenciales del cliente están en el vault. @marcos.ruiz puedes arrancar.',
        NOW() - INTERVAL '11 days'
    ),
    (
        'd0000000-0000-0000-0000-000000000002',
        'b0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000002',
        'Login funcionando en local. Sesión en Redis con TTL 8 h verificada con redis-cli. '
        'Subo a staging para QA.',
        NOW() - INTERVAL '6 days'
    ),
    (
        'd0000000-0000-0000-0000-000000000003',
        'b0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'QA pasado. Cuentas fuera del dominio reciben 403. Marcando como Listo.',
        NOW() - INTERVAL '5 days'
    ),
    -- Ticket #2 (en_progreso) — feedback de PO a Sofía
    (
        'd0000000-0000-0000-0000-000000000004',
        'b0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000003',
        'Las tres columnas renderizan correctamente. Los tickets se distribuyen por estado. '
        'Mañana agrego los filtros del panel lateral.',
        NOW() - INTERVAL '3 days'
    ),
    (
        'd0000000-0000-0000-0000-000000000005',
        'b0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        '@sofia.delgado recuerda que el filtro "Mostrar archivados" solo debe aparecer '
        'para admins y para el creador del ticket, no para todos los usuarios.',
        NOW() - INTERVAL '2 days'
    ),
    -- Ticket #3 (en_progreso) — nota técnica de Marcos
    (
        'd0000000-0000-0000-0000-000000000006',
        'b0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000002',
        'BullMQ conectado a Redis. El worker procesa jobs correctamente. '
        'Falta implementar la lógica de agrupación en ventana de 60 s por ticket + destinatario.',
        NOW() - INTERVAL '1 day'
    );

COMMIT;
