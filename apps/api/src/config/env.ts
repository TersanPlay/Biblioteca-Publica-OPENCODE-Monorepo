import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[fatal] ${name} ausente — defina no arquivo .env`);
  }
  return value;
}

export const env = {
  get DATABASE_URL(): string {
    return process.env.DATABASE_URL || 'file:./dev.db';
  },
  get JWT_SECRET(): string {
    return required('JWT_SECRET');
  },
  get READER_JWT_SECRET(): string {
    return process.env.READER_JWT_SECRET || `${required('JWT_SECRET')}#reader`;
  },
  get JWT_EXPIRES(): string {
    return process.env.JWT_EXPIRES || '8h';
  },
  get CORS_ORIGIN(): string[] {
    return (process.env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  },
  get PORT(): number {
    return Number(process.env.PORT || 3333);
  },
  get NODE_ENV(): string {
    return process.env.NODE_ENV || 'development';
  },
};

export function jwtSecret(): string {
  return env.JWT_SECRET;
}
