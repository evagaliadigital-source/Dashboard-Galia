import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import { Bindings } from '../types/database';
import { createToken, verifyPassword } from '../lib/auth';

const auth = new Hono<{ Bindings: Bindings }>();

// Login
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: 'Email y contraseña requeridos' }, 400);
  }

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ? AND active = 1'
  ).bind(email).first();

  if (!user) {
    return c.json({ error: 'Credenciales inválidas' }, 401);
  }

  const isValid = await verifyPassword(password, user.password_hash as string);
  if (!isValid) {
    return c.json({ error: 'Credenciales inválidas' }, 401);
  }

  const token = createToken(user.id as number, user.role as string);
  
  // Detect if we're on HTTPS
  const isSecure = c.req.url.startsWith('https://');
  
  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'Lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar_url: user.avatar_url,
      phone: user.phone
    }
  });
});

// Logout
auth.post('/logout', (c) => {
  const isSecure = c.req.url.startsWith('https://');
  
  setCookie(c, 'auth_token', '', {
    httpOnly: true,
    secure: isSecure,
    maxAge: 0,
    path: '/'
  });

  return c.json({ message: 'Sesión cerrada exitosamente' });
});

// Check auth status
auth.get('/me', async (c) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'No autenticado' }, 401);
  }

  return c.json({ user });
});

export default auth;
