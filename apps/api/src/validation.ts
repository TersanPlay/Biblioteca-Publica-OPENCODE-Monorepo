import { z } from 'zod';
import { HttpError } from './lib/http-error';

export function parse<S extends z.ZodTypeAny>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join('.') || 'campo'}: ${i.message}`)
      .join('; ');
    throw new HttpError(400, message);
  }
  return result.data;
}

export * from '@library/shared';
