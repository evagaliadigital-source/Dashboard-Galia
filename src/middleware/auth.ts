import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyToken } from '../lib/auth';
import { Bindings } from '../types/database';

export async function authMiddleware(c: Context<{ Bindings: Bindings }>, next: Next) {
  const token = getCookie(c, 'auth_token');
  
  if (!token) {
    return c.json({ error: 'No autorizado' }, 401);
  }

  const payload = verifyToken(token);
  if (!payload) {
    return c.json({ error: 'Token inválido o expirado' }, 401);
  }

  // Get user from database
  const user = await c.env.DB.prepare(
    'SELECT id, email, name, role, avatar_url, phone FROM users WHERE id = ? AND active = 1'
  ).bind(payload.userId).first();

  if (!user) {
    return c.json({ error: 'Usuario no encontrado' }, 401);
  }

  c.set('user', user);
  await next();
}

export function requireRole(...allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user || !allowedRoles.includes(user.role)) {
      return c.json({ error: 'Sin permisos suficientes' }, 403);
    }

    await next();
  };
}
