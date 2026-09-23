import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import prisma from './prisma';
import { HttpError } from './http-error';
import { env } from '../config/env';

export interface ReaderSession {
  id: number;
  name: string;
  email: string | null;
}

declare global {
  namespace Express {
    interface Request {
      reader?: ReaderSession;
    }
  }
}

function readerSecret(): string {
  return env.READER_JWT_SECRET;
}

/** Token isolado do portal do leitor — secret distinto do staff. */
export function signReaderToken(reader: { id: number }): string {
  return jwt.sign({ sub: reader.id, typ: 'reader' }, readerSecret(), {
    expiresIn: env.JWT_EXPIRES as jwt.SignOptions['expiresIn'],
  });
}

export const requireReader: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new HttpError(401, 'Não autenticado');
    let payload: { sub: number; typ: string };
    try {
      payload = jwt.verify(token, readerSecret()) as unknown as { sub: number; typ: string };
    } catch {
      throw new HttpError(401, 'Sessão expirada');
    }
    if (payload.typ !== 'reader') throw new HttpError(401, 'Sessão inválida');
    const reader = await prisma.reader.findUnique({ where: { id: payload.sub } });
    if (!reader || reader.deletedAt || reader.status !== 'ACTIVE') {
      throw new HttpError(401, 'Sessão inválida');
    }
    req.reader = { id: reader.id, name: reader.name, email: reader.email };
    next();
  } catch (err) {
    next(err);
  }
};

/** Resposta pública do leitor: nunca expõe passwordHash. */
export function publicReader<T extends { passwordHash?: string | null }>(r: T): Omit<T, 'passwordHash'> {
  const { passwordHash: _omit, ...rest } = r;
  return rest;
}
