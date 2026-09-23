import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/http-error';
import { env, jwtSecret as centralJwtSecret } from '../config/env';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'ATTENDANT';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function jwtSecret(): string {
  return centralJwtSecret();
}

export function signToken(user: { id: number; role: string }): string {
  return jwt.sign({ sub: user.id, role: user.role, typ: 'staff' }, jwtSecret(), {
    expiresIn: env.JWT_EXPIRES as jwt.SignOptions['expiresIn'],
  });
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new HttpError(401, 'Não autenticado');
    let payload: { sub: number; typ?: string };
    try {
      payload = jwt.verify(token, jwtSecret()) as unknown as { sub: number; typ?: string };
    } catch {
      throw new HttpError(401, 'Sessão expirada');
    }
    // Tokens do portal do leitor usam secret próprio, mas o typ barra
    // qualquer reuso cruzado mesmo em colisão de IDs.
    if (payload.typ !== undefined && payload.typ !== 'staff') {
      throw new HttpError(401, 'Sessão inválida');
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'ACTIVE') throw new HttpError(401, 'Sessão inválida');
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'ADMIN' | 'ATTENDANT',
    };
    next();
  } catch (err) {
    next(err);
  }
};

export const requireRoles =
  (...roles: Array<'ADMIN' | 'ATTENDANT'>): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new HttpError(403, 'Sem permissão para esta operação'));
      return;
    }
    next();
  };