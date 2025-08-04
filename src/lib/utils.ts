import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState, useEffect } from 'react';
import type { RawBytes } from './idb';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
export const Result = Object.freeze({
  Ok<T, E>(value: T): Result<T, E> {
    return { ok: true, value };
  },
  Err<T, E>(error: E): Result<T, E> {
    return { ok: false, error };
  },
} as const);


export const doTry = <T>(promise: Promise<T>): Promise<Result<T, unknown>> =>
  promise.then(value => Result.Ok(value)).catch(err => Result.Err(err));

export async function getUserId() {
  return 'jmnuf';
}

export function useUserId() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(undefined as undefined | string);

  useEffect(() => {
    let challenged = false;
    setLoading(true);

    getUserId()
      .then(userId => {
        if (challenged) return;
        setUserId(userId);
        setLoading(false);
      });

    return () => {
      challenged = true;
    };
  });

  return { loading, userId } as { loading: true } | { loading: false; userId: string };
}

export type EncryptionHelper = { decrypt: (bytes: RawBytes) => RawBytes; encrypt: (bytes: RawBytes) => RawBytes; };
export function get_encryption_helpers(): EncryptionHelper | undefined {
  return undefined;
}
