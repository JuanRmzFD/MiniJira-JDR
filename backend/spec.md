# PRD — Mini Jira (Herramienta interna de gestión de tickets)

**Versión:** 0.3 — En desarrollo  
**Fecha:** 2026-05-04  
**Stakeholders:** Laura (PO), Marcos (Tech Lead), Sofía (Dev Junior), Roberto (PM)  
**Estado:** ⚠ Pendiente de firma por PO — ver sección "Decisiones abiertas"

---

## 1. Objetivo

Construir una herramienta web interna de gestión de tareas para un equipo de 10 personas. Debe permitir crear, seguir y cerrar tickets de trabajo con visibilidad compartida, reemplazando el uso informal de listas y mensajes directos. La primera versión debe estar en producción en tres semanas.

---

## 2. In-Scope

### 2.1 Autenticación y roles

| Capacidad | Detalle |
|-----------|---------|
| Login corporativo | Acceso únicamente con cuentas del dominio de empresa. Sin auto-registro. |
| Dos roles | **Admin** y **Usuario**. Un admin puede promover o degradar a cualquier otro usuario. El sistema garantiza al menos un admin activo en todo momento. |
| Gestión de cuentas | Solo un admin puede crear, desactivar o reactivar cuentas. No existe eliminación física de usuarios. |
| Sesiones | Expiración tras 8 horas de inactividad. Al desactivar un usuario, sus sesiones activas se invalidan inmediatamente. |

### 2.2 Tickets

| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| Título | Texto corto (máx. 150 caracteres) | Sí |
| Descripción | Texto largo (Markdown) | No |
| Estado | Enum: `Por hacer`, `En progreso`, `Listo` | Sí (default: `Por hacer`) |
| Prioridad | Enum: `Baja`, `Media`, `Alta` | No |
| Asignado a | Usuario del sistema | No |
| Etiquetas | Lista de strings libres | No |
| Creado por | Usuario en sesión (automático, inmutable) | Sí |
| Fecha de creación | Timestamp UTC (automático, inmutable) | Sí |
| Fecha de cierre | Timestamp UTC cuando pasa a `Listo` (automático) | Automático |

**Operaciones y quién puede ejecutarlas:**

| Operación | Usuario estándar | Usuario asignado | Admin |
|-----------|-----------------|-----------------|-------|
| Crear ticket | ✅ | — | ✅ |
| Editar título / descripción | Solo si es creador | ⚠ Decisión pendiente | ✅ |
| Cambiar estado | Solo si es creador | ✅ | ✅ |
| Reasignar | ❌ | ❌ | ✅ |
| Archivar ("Eliminar") | Solo si es creador | ❌ | ✅ |
| Restaurar archivado | ❌ | ❌ | ✅ |

**Flujo de estados permitido:**

```
Por hacer ──► En progreso ──► Listo
```

- Transiciones inversas (`Listo → En progreso`) solo permitidas para admins.
- Los tickets archivados no pueden cambiar de estado sin restaurarse primero.

**Nota sobre el botón "Eliminar":**  
La acción ejecuta un archivado lógico (`archived = true`). El registro persiste en base de datos. El texto del botón en UI es "Eliminar" por decisión de PO.

### 2.3 Tablero y filtros

- Vista de tablero Kanban con columnas por estado (3 columnas: `Por hacer`, `En progreso`, `Listo`). Soporta drag-and-drop entre columnas; las transiciones inversas requieren rol admin.
- Vista de lista como alternativa.
- Filtros disponibles: estado, prioridad, etiquetas, asignado a, fecha de creación (rango).
- Los tickets archivados están ocultos por defecto; visible solo mediante filtro explícito "Mostrar archivados" (visible solo para admins y creadores del ticket).

### 2.4 Comentarios

- Cualquier usuario autenticado puede comentar en cualquier ticket activo.
- Los comentarios son inmutables una vez publicados (sin edición ni borrado en v1).
- Los comentarios se conservan íntegros cuando un ticket es archivado.
- Se soporta mención de usuarios con `@nombre`.

### 2.5 Notificaciones por email

| Evento | Destinatario |
|--------|-------------|
| Te asignaron a un ticket | Usuario asignado |
| Alguien te mencionó en un comentario (`@nombre`) | Usuario mencionado |
| Un ticket que creaste cambió de estado | Creador del ticket |

- Las notificaciones se encolan; si el envío falla se reintenta hasta 3 veces con backoff exponencial.
- Si dos eventos ocurren en menos de 60 segundos sobre el mismo ticket para el mismo destinatario, se agrupan en un solo email.
- El email contiene: título del ticket, evento ocurrido y enlace directo al ticket. No incluye el cuerpo completo de la descripción.

### 2.6 Dashboard de métricas

- Accesible para todos los usuarios autenticados.
- Métricas en v1:
  - Tickets cerrados por mes (contados por `fecha_cierre`, no por fecha de creación).
  - Tickets abiertos actualmente por estado.
  - Tickets por usuario asignado (ranking).
- Los datos del dashboard se calculan sobre una vista materializada o caché que se refresca cada 15 minutos. No consultan la base de datos transaccional en tiempo real.
- Rango de tiempo visible: últimos 6 meses.

### 2.7 Exportación de métricas a CSV

#### Contexto y motivación
Dirección no lo solicitó explícitamente, pero el dashboard de métricas no tiene utilidad en reportes mensuales si los datos no pueden salir del sistema. Un export CSV es la extensión natural del dashboard con coste de implementación bajo.

#### Tipos de exportación

| Tipo | Descripción | Nombre de archivo |
|------|-------------|-------------------|
| **Resumen de métricas** | Datos agregados idénticos a los del dashboard: tickets cerrados por mes, tickets por estado, tickets por usuario asignado | `minijira_metricas_YYYY-MM-DD.csv` |
| **Detalle de tickets** | Un registro por ticket con todos sus campos — útil para análisis ad-hoc en Excel o Google Sheets | `minijira_tickets_YYYY-MM-DD.csv` |

#### Columnas por tipo

**Resumen de métricas:**
```
Mes, Tickets_Cerrados, Tickets_Creados, Tickets_En_Progreso, Tickets_Por_Hacer, Tickets_Bloqueados_Sin_Asignar
```

**Detalle de tickets:**
```
ID, Titulo, Estado, Prioridad, Creado_Por, Asignado_A, Fecha_Creacion, Fecha_Cierre, Etiquetas, Total_Comentarios
```

#### UX

- Botón **"Exportar CSV"** en la esquina superior derecha del dashboard.
- Al hacer clic, se abre un modal ligero con dos opciones:
  1. Tipo de exportación: `Resumen de métricas` / `Detalle de tickets`
  2. Rango de tiempo: selector de mes inicio → mes fin (máximo 12 meses hacia atrás, default: últimos 6 meses)
- El botón "Descargar" del modal dispara la descarga directa en el navegador. Sin pantalla de carga intermedia.
- Si el rango seleccionado no tiene datos, el sistema descarga un CSV con cabeceras vacías y muestra un `toast` informativo: *"No hay datos para el rango seleccionado."*

#### Contrato de la API

```
GET /api/exports/metrics
  ?type=summary|detail
  &from=YYYY-MM          (obligatorio)
  &to=YYYY-MM            (obligatorio)

Response:
  Content-Type: text/csv; charset=utf-8
  Content-Disposition: attachment; filename="minijira_metricas_2026-05.csv"
  Body: CSV plano, separador coma, primera fila = cabeceras
```

#### Permisos y reglas

- Disponible para **todos los usuarios autenticados** (misma regla que el dashboard).
- El export respeta las mismas reglas de visibilidad de tickets que el tablero: si en v1 la visibilidad es global, el CSV incluye todos los tickets activos y archivados en el rango.
- No existe ningún export de datos de usuarios (emails, nombres completos fuera del contexto de ticket). Los campos `Creado_Por` y `Asignado_A` muestran el nombre de display, no el email.

#### Implementación técnica

- La generación es **síncrona**: para un equipo de 10 personas el volumen máximo es trivial.  No requiere cola ni job asíncrono.
- El backend consulta directamente la base de datos transaccional para el export (no la caché del dashboard), garantizando que los datos descargados son exactos al momento de la descarga.
- La librería de serialización es `csv-stringify` (Node.js), sin dependencias adicionales en el frontend.
- El endpoint está protegido con el mismo middleware de autenticación que el resto de la API.

---

### 2.8 Concurrencia

- **Estrategia:** Optimistic locking mediante campo `updated_at` + número de versión (`version: int`) en cada ticket.
- **Comportamiento en conflicto:** Si un usuario intenta guardar un ticket cuya versión en base de datos es más nueva que la que cargó, el sistema rechaza la escritura y devuelve un error 409 con el mensaje: *"Otro usuario modificó este ticket mientras lo editabas. Recarga para ver los cambios."*
- El frontend bloquea el botón "Guardar" y muestra el error. No sobreescribe silenciosamente.
- Las transiciones de estado son operaciones atómicas a nivel de base de datos (`UPDATE ... WHERE version = ?`).

---

## 3. Out-of-Scope (v1)

| Funcionalidad | Motivo de exclusión |
|---------------|---------------------|
| Modo oscuro | Solicitado al final de la reunión sin tiempo de análisis. Backlog v2. |
| Estado "Review" y "Blocked" | PO rechazó más de 3 columnas en el tablero. Backlog v2. |
| Adjuntos / archivos en tickets | No mencionado. Complejidad de almacenamiento fuera del alcance de 3 semanas. |
| Edición de comentarios | Simplifica el modelo de datos y auditoría en v1. |
| Sprints / iteraciones / velocity | Fuera del alcance de una herramienta "ligera". |
| Integración con Slack, GitHub, CI/CD | No solicitado. |
| API pública / webhooks | No solicitado. |
| Multi-tenant / multi-equipo | El sistema es para un equipo fijo de 10 personas. |
| Tracking de tiempo (horas logueadas) | No mencionado por ningún stakeholder. |
| Notificaciones en tiempo real (WebSocket) | El email cubre la necesidad en v1. |
| Exportación a PDF | CSV está en scope (sección 2.7). PDF requiere layout de impresión y no aporta valor adicional en v1. |

---

## 4. Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | React (Vite) | Definido por el Tech Lead en reunión. |
| Estilos | Tailwind CSS + shadcn/ui | Cubre el requisito "Apple-like: blanco, limpio, sombras suaves" sin diseño desde cero. |
| Backend | Node.js + Express (o Fastify) | Definido por el Tech Lead en reunión. |
| Base de datos | PostgreSQL | Relacional confirmado por Tech Lead. Soporta `SELECT FOR UPDATE` para locking, migraciones versionadas y consistencia transaccional en cambios de estado. |
| ORM | Prisma | Facilita migraciones evolutivas si los estados cambian (preocupación explícita de Sofía). |
| Autenticación | OAuth 2.0 contra proveedor corporativo (Google Workspace / Azure AD) | Cubre el requisito de "cuentas de empresa" sin gestión propia de contraseñas. |
| Servicio de email | Resend (o SendGrid) | Bajo coste, fácil integración, soporta plantillas y reintentos. |
| Cola de notificaciones | BullMQ sobre Redis | Gestiona agrupación de eventos, reintentos y backoff sin bloquear el hilo principal. |
| Hosting | A definir por el equipo (Railway / Render / VPS interno) | Fuera del alcance de este documento. |
| Testing | Vitest (unit) + Playwright (e2e críticos) | Cobertura mínima para autenticación, cambio de estado y conflictos de concurrencia. |

---

## 5. Decisiones abiertas — Requieren firma de PO antes del Sprint 1

> Cada ítem bloqueado impide arrancar el desarrollo de su área. Laura debe responder antes del lunes.

| ID | Pregunta | Área bloqueada | Propuesta por defecto si no hay respuesta |
|----|----------|---------------|-------------------------------------------|
| D-01 | ¿La visibilidad de tickets es global (todos ven todo) o filtrada por proyecto/equipo? | Esquema de BD, endpoints de listado | Global (todos ven todos los tickets activos) |
| D-02 | ¿El usuario asignado puede editar el título del ticket? | Lógica de permisos en backend | No; solo el creador y el admin pueden editar el título |
| D-03 | ¿Se permiten transiciones de estado inversas (`Listo → En progreso`) para usuarios estándar? | Flujo Kanban, validación de backend | No; solo admins pueden hacer transiciones inversas |
| D-04 | ¿Cómo se crea el primer admin en el despliegue inicial? | Script de seed, proceso de onboarding | Seed manual en el primer despliegue vía variable de entorno |
| D-05 | ¿Los tickets asignados a un usuario desactivado quedan "Sin asignar" o se reasignan automáticamente a quien los creó? | Flujo de offboarding | Quedan "Sin asignar" para que el admin los redistribuya manualmente |
| D-06 | ¿Se notifica al equipo completo cuando un usuario es desactivado? | Plantilla de email, lógica de eventos | No; solo el admin que ejecuta la acción ve confirmación en pantalla |

---

## 6. Criterios de aceptación globales (Definition of Done)

- [ ] El sistema no permite acceso a ningún recurso sin sesión activa.
- [ ] Ninguna acción destructiva (archivar) se ejecuta sin confirmación explícita del usuario.
- [ ] Todo cambio de estado queda registrado en el historial del ticket con `usuario`, `estado_anterior`, `estado_nuevo` y `timestamp`.
- [ ] El conflicto de edición concurrente devuelve un error visible al usuario; nunca sobreescribe silenciosamente.
- [ ] Las notificaciones por email se encolan y no bloquean la respuesta HTTP al usuario.
- [ ] El dashboard muestra datos con una antigüedad máxima de 15 minutos, indicando la hora del último refresco.
- [ ] El CSV exportado contiene datos exactos al momento de la descarga (no datos de caché) y el archivo se descarga sin pantalla de carga intermedia.
- [ ] El endpoint `/api/exports/metrics` requiere sesión activa; devuelve 401 sin ella.

---

## 7. Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Alcance no congelado antes de arrancar desarrollo | Alta | Alto | Firmar las decisiones abiertas (sección 5) antes del lunes |
| Tres semanas insuficientes para notificaciones + dashboard + auth | Alta | Alto | Priorizar: auth + tickets + estados en semana 1; comentarios en semana 2; email + dashboard en semana 3 o mover a v1.1 |
| Cambio de estados después de empezar (Sofía lo anticipó) | Media | Medio | Usar Prisma con migraciones; no hardcodear estados en lógica de negocio, leerlos de tabla `ticket_states` |
| Conflictos de concurrencia no manejados en producción | Media | Alto | Implementar optimistic locking desde el primer endpoint de edición, no como mejora posterior |
