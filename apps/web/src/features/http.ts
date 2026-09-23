export type Params = Record<string, string | number | undefined>;

export function cleanPayload<T extends Record<string, unknown>>(obj: T): T {
  const out = {} as T;
  for (const [k, v] of Object.entries(obj)) {
    if (v !== '' && v !== null && v !== undefined) out[k as keyof T] = v as T[keyof T];
  }
  return out;
}
