'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { eq } = require('drizzle-orm');

const { db } = require('../src/db/client');
const {
  users,
  tickets,
  ticketLabels,
  stateTransitions,
  comments,
  ticketStates,
  allowedTransitions,
} = require('../src/db/schema');

const SALT_ROUNDS = 10;

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

async function seed() {
  console.log('Seeding database...\n');

  const adminHash = await bcrypt.hash('admin123', SALT_ROUNDS);
  const userHash  = await bcrypt.hash('user123',  SALT_ROUNDS);

  // ── Ticket states ─────────────────────────────────────────────────────────────
  await db.insert(ticketStates).values([
    { code: 'por_hacer',   label: 'Por hacer',   sortOrder: 1 },
    { code: 'en_progreso', label: 'En progreso', sortOrder: 2 },
    { code: 'listo',       label: 'Listo',       sortOrder: 3 },
  ]).onConflictDoNothing();
  console.log('✓ ticket_states');

  // ── Allowed transitions ───────────────────────────────────────────────────────
  await db.insert(allowedTransitions).values([
    { fromState: 'por_hacer',   toState: 'en_progreso', adminOnly: false },
    { fromState: 'en_progreso', toState: 'listo',       adminOnly: false },
    { fromState: 'listo',       toState: 'en_progreso', adminOnly: true  },
  ]).onConflictDoNothing();
  console.log('✓ allowed_transitions');

  // ── Users (upsert: insert or update password) ─────────────────────────────────
  const usersData = [
    {
      id:           'a0000000-0000-0000-0000-000000000001',
      email:        'laura.garcia@empresa.com',
      displayName:  'Laura García',
      role:         'admin',
      isActive:     true,
      passwordHash: adminHash,
      createdAt:    daysAgo(30),
      updatedAt:    daysAgo(30),
    },
    {
      id:           'a0000000-0000-0000-0000-000000000002',
      email:        'marcos.ruiz@empresa.com',
      displayName:  'Marcos Ruiz',
      role:         'admin',
      isActive:     true,
      passwordHash: adminHash,
      createdAt:    daysAgo(30),
      updatedAt:    daysAgo(30),
    },
    {
      id:           'a0000000-0000-0000-0000-000000000003',
      email:        'sofia.delgado@empresa.com',
      displayName:  'Sofía Delgado',
      role:         'usuario',
      isActive:     true,
      passwordHash: userHash,
      createdAt:    daysAgo(28),
      updatedAt:    daysAgo(28),
    },
  ];

  for (const u of usersData) {
    await db.insert(users).values(u).onConflictDoNothing();
    // Always update password (handles existing users without password_hash)
    await db.update(users).set({ passwordHash: u.passwordHash }).where(eq(users.id, u.id));
  }
  console.log('✓ users');

  // ── Tickets ───────────────────────────────────────────────────────────────────
  await db.insert(tickets).values([
    {
      id:          'b0000000-0000-0000-0000-000000000001',
      title:       'Implementar login con OAuth corporativo',
      description: 'Configurar flujo OAuth 2.0 contra Google Workspace.\n\n**Criterios de aceptación:**\n- Redirección correcta al proveedor corporativo\n- Creación de sesión con TTL de 8 h\n- Rechazo de cuentas fuera del dominio `empresa.com` con 403',
      state:       'listo',
      priority:    'alta',
      creatorId:   'a0000000-0000-0000-0000-000000000002',
      assignedTo:  'a0000000-0000-0000-0000-000000000002',
      archived:    false,
      closedAt:    daysAgo(5),
      version:     3,
      createdAt:   daysAgo(12),
      updatedAt:   daysAgo(5),
    },
    {
      id:          'b0000000-0000-0000-0000-000000000002',
      title:       'Diseñar tablero Kanban con columnas de estado',
      description: 'Implementar vista Kanban en React con tres columnas: **Por hacer**, **En progreso**, **Listo**.\n\nUsar `shadcn/ui Card` para cada ticket.',
      state:       'en_progreso',
      priority:    'alta',
      creatorId:   'a0000000-0000-0000-0000-000000000001',
      assignedTo:  'a0000000-0000-0000-0000-000000000003',
      archived:    false,
      closedAt:    null,
      version:     2,
      createdAt:   daysAgo(9),
      updatedAt:   daysAgo(3),
    },
    {
      id:          'b0000000-0000-0000-0000-000000000003',
      title:       'Configurar cola de notificaciones por email',
      description: 'Integrar una cola para gestionar el envío de emails.\n\n**Reglas:**\n- Máximo 3 reintentos con backoff exponencial\n- Agrupar eventos del mismo ticket + destinatario en ventana de 60 s',
      state:       'en_progreso',
      priority:    'media',
      creatorId:   'a0000000-0000-0000-0000-000000000002',
      assignedTo:  'a0000000-0000-0000-0000-000000000002',
      archived:    false,
      closedAt:    null,
      version:     2,
      createdAt:   daysAgo(7),
      updatedAt:   daysAgo(2),
    },
    {
      id:          'b0000000-0000-0000-0000-000000000004',
      title:       'Crear endpoint GET /tickets con filtros',
      description: 'Implementar listado de tickets con soporte para los filtros del spec:\n`estado`, `prioridad`, `etiquetas`, `asignado_a`, rango de `created_at`.',
      state:       'por_hacer',
      priority:    'media',
      creatorId:   'a0000000-0000-0000-0000-000000000003',
      assignedTo:  'a0000000-0000-0000-0000-000000000003',
      archived:    false,
      closedAt:    null,
      version:     1,
      createdAt:   daysAgo(4),
      updatedAt:   daysAgo(4),
    },
    {
      id:          'b0000000-0000-0000-0000-000000000005',
      title:       'Documentar contrato API de exportación CSV',
      description: 'Redactar la documentación del endpoint `GET /api/exports/metrics`:\n- Parámetros: `type`, `from`, `to`\n- Ejemplos de respuesta para `summary` y `detail`',
      state:       'por_hacer',
      priority:    'baja',
      creatorId:   'a0000000-0000-0000-0000-000000000001',
      assignedTo:  null,
      archived:    false,
      closedAt:    null,
      version:     1,
      createdAt:   daysAgo(2),
      updatedAt:   daysAgo(2),
    },
  ]).onConflictDoNothing();
  console.log('✓ tickets');

  // ── Ticket labels ─────────────────────────────────────────────────────────────
  await db.insert(ticketLabels).values([
    { ticketId: 'b0000000-0000-0000-0000-000000000001', label: 'auth' },
    { ticketId: 'b0000000-0000-0000-0000-000000000001', label: 'backend' },
    { ticketId: 'b0000000-0000-0000-0000-000000000001', label: 'semana-1' },
    { ticketId: 'b0000000-0000-0000-0000-000000000002', label: 'frontend' },
    { ticketId: 'b0000000-0000-0000-0000-000000000002', label: 'kanban' },
    { ticketId: 'b0000000-0000-0000-0000-000000000002', label: 'semana-1' },
    { ticketId: 'b0000000-0000-0000-0000-000000000003', label: 'backend' },
    { ticketId: 'b0000000-0000-0000-0000-000000000003', label: 'email' },
    { ticketId: 'b0000000-0000-0000-0000-000000000004', label: 'backend' },
    { ticketId: 'b0000000-0000-0000-0000-000000000004', label: 'api' },
    { ticketId: 'b0000000-0000-0000-0000-000000000005', label: 'api' },
    { ticketId: 'b0000000-0000-0000-0000-000000000005', label: 'docs' },
  ]).onConflictDoNothing();
  console.log('✓ ticket_labels');

  // ── State transitions ─────────────────────────────────────────────────────────
  await db.insert(stateTransitions).values([
    { id: 'c0000000-0000-0000-0000-000000000001', ticketId: 'b0000000-0000-0000-0000-000000000001', fromState: null,          toState: 'por_hacer',   changedBy: 'a0000000-0000-0000-0000-000000000002', createdAt: daysAgo(12) },
    { id: 'c0000000-0000-0000-0000-000000000002', ticketId: 'b0000000-0000-0000-0000-000000000001', fromState: 'por_hacer',   toState: 'en_progreso', changedBy: 'a0000000-0000-0000-0000-000000000002', createdAt: daysAgo(10) },
    { id: 'c0000000-0000-0000-0000-000000000003', ticketId: 'b0000000-0000-0000-0000-000000000001', fromState: 'en_progreso', toState: 'listo',       changedBy: 'a0000000-0000-0000-0000-000000000002', createdAt: daysAgo(5)  },
    { id: 'c0000000-0000-0000-0000-000000000004', ticketId: 'b0000000-0000-0000-0000-000000000002', fromState: null,          toState: 'por_hacer',   changedBy: 'a0000000-0000-0000-0000-000000000001', createdAt: daysAgo(9)  },
    { id: 'c0000000-0000-0000-0000-000000000005', ticketId: 'b0000000-0000-0000-0000-000000000002', fromState: 'por_hacer',   toState: 'en_progreso', changedBy: 'a0000000-0000-0000-0000-000000000003', createdAt: daysAgo(3)  },
    { id: 'c0000000-0000-0000-0000-000000000006', ticketId: 'b0000000-0000-0000-0000-000000000003', fromState: null,          toState: 'por_hacer',   changedBy: 'a0000000-0000-0000-0000-000000000002', createdAt: daysAgo(7)  },
    { id: 'c0000000-0000-0000-0000-000000000007', ticketId: 'b0000000-0000-0000-0000-000000000003', fromState: 'por_hacer',   toState: 'en_progreso', changedBy: 'a0000000-0000-0000-0000-000000000002', createdAt: daysAgo(2)  },
    { id: 'c0000000-0000-0000-0000-000000000008', ticketId: 'b0000000-0000-0000-0000-000000000004', fromState: null,          toState: 'por_hacer',   changedBy: 'a0000000-0000-0000-0000-000000000003', createdAt: daysAgo(4)  },
    { id: 'c0000000-0000-0000-0000-000000000009', ticketId: 'b0000000-0000-0000-0000-000000000005', fromState: null,          toState: 'por_hacer',   changedBy: 'a0000000-0000-0000-0000-000000000001', createdAt: daysAgo(2)  },
  ]).onConflictDoNothing();
  console.log('✓ state_transitions');

  // ── Comments ──────────────────────────────────────────────────────────────────
  await db.insert(comments).values([
    {
      id: 'd0000000-0000-0000-0000-000000000001',
      ticketId:  'b0000000-0000-0000-0000-000000000001',
      authorId:  'a0000000-0000-0000-0000-000000000001',
      content:   'Confirmado con IT: las credenciales del cliente están en el vault. @Marcos Ruiz puedes arrancar.',
      createdAt: daysAgo(11),
    },
    {
      id: 'd0000000-0000-0000-0000-000000000002',
      ticketId:  'b0000000-0000-0000-0000-000000000001',
      authorId:  'a0000000-0000-0000-0000-000000000002',
      content:   'Login funcionando en local. Sesión con TTL 8 h verificada. Subo a staging para QA.',
      createdAt: daysAgo(6),
    },
    {
      id: 'd0000000-0000-0000-0000-000000000003',
      ticketId:  'b0000000-0000-0000-0000-000000000001',
      authorId:  'a0000000-0000-0000-0000-000000000001',
      content:   'QA pasado. Marcando como Listo.',
      createdAt: daysAgo(5),
    },
    {
      id: 'd0000000-0000-0000-0000-000000000004',
      ticketId:  'b0000000-0000-0000-0000-000000000002',
      authorId:  'a0000000-0000-0000-0000-000000000003',
      content:   'Las tres columnas renderizan correctamente. Mañana agrego los filtros del panel lateral.',
      createdAt: daysAgo(3),
    },
    {
      id: 'd0000000-0000-0000-0000-000000000005',
      ticketId:  'b0000000-0000-0000-0000-000000000002',
      authorId:  'a0000000-0000-0000-0000-000000000001',
      content:   '@Sofía Delgado recuerda que el filtro "Mostrar archivados" solo debe aparecer para admins y para el creador del ticket.',
      createdAt: daysAgo(2),
    },
    {
      id: 'd0000000-0000-0000-0000-000000000006',
      ticketId:  'b0000000-0000-0000-0000-000000000003',
      authorId:  'a0000000-0000-0000-0000-000000000002',
      content:   'Cola conectada. El worker procesa jobs correctamente. Falta implementar la lógica de agrupación en ventana de 60 s.',
      createdAt: daysAgo(1),
    },
  ]).onConflictDoNothing();
  console.log('✓ comments');

  console.log('\n✓ Seed completo!\n');
  console.log('Credenciales de prueba:');
  console.log('  Admin: laura.garcia@empresa.com / admin123');
  console.log('  Admin: marcos.ruiz@empresa.com  / admin123');
  console.log('  User:  sofia.delgado@empresa.com / user123');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed fallido:', err);
    process.exit(1);
  });
