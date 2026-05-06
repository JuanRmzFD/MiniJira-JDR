'use strict';

const { eq, asc } = require('drizzle-orm');
const { randomUUID } = require('crypto');
const { db } = require('../db/client');
const { comments, users, tickets } = require('../db/schema');

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function toUserJson(row) {
  return {
    id:          row.id,
    displayName: row.displayName,
    email:       row.email,
    role:        row.role === 'usuario' ? 'user' : row.role,
    isActive:    row.isActive,
    createdAt:   row.createdAt,
  };
}

function toCommentJson(comment, author) {
  return {
    id:        comment.id,
    ticketId:  comment.ticketId,
    content:   comment.content,
    author:    toUserJson(author),
    createdAt: comment.createdAt,
  };
}

async function listComments(ticketId) {
  const [ticket] = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);
  if (!ticket) throw httpError(404, 'Ticket no encontrado.');

  const rows = await db
    .select({ comment: comments, author: users })
    .from(comments)
    .leftJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.ticketId, ticketId))
    .orderBy(asc(comments.createdAt));

  return rows.map(r => toCommentJson(r.comment, r.author));
}

async function createComment(ticketId, data, sessionUser) {
  const [ticket] = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);
  if (!ticket) throw httpError(404, 'Ticket no encontrado.');

  const content = (data.content ?? '').trim();
  if (!content) throw httpError(400, 'El contenido del comentario no puede estar vacío.');

  const id  = randomUUID();
  const now = new Date().toISOString();

  await db.insert(comments).values({
    id,
    ticketId,
    authorId:  sessionUser.id,
    content,
    createdAt: now,
  });

  const [row] = await db
    .select({ comment: comments, author: users })
    .from(comments)
    .leftJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.id, id))
    .limit(1);

  return toCommentJson(row.comment, row.author);
}

module.exports = { listComments, createComment };
