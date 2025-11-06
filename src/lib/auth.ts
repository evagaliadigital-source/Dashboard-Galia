import { Context } from 'hono';
import { Bindings } from '../types/database';

// Simple JWT-like encoding (for demo purposes)
// In production, use proper JWT library
export function createToken(userId: number, role: string): string {
  const payload = { userId, role, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }; // 7 days
  return btoa(JSON.stringify(payload));
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hashSync(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compareSync(password, hash);
}

export function getAuthUser(c: Context) {
  return c.get('user');
}
