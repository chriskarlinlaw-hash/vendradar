import { promises as fs } from 'fs';
import path from 'path';

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const CACHE_DIR = path.join(process.cwd(), '.cache', 'vendradar');

function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9-_:.]/g, '_');
}

function getFilePath(key: string): string {
  return path.join(CACHE_DIR, `${sanitizeKey(key)}.json`);
}

export async function getCached<T>(key: string): Promise<T | null> {
  const now = Date.now();
  const mem = memoryCache.get(key);
  if (mem && mem.expiresAt > now) {
    return mem.value as T;
  }

  try {
    const filePath = getFilePath(key);
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (parsed.expiresAt > now) {
      memoryCache.set(key, parsed as CacheEntry<unknown>);
      return parsed.value;
    }
  } catch {
    // cache miss
  }

  return null;
}

export async function setCached<T>(key: string, value: T, ttlMs: number): Promise<void> {
  const entry: CacheEntry<T> = {
    value,
    expiresAt: Date.now() + ttlMs,
  };

  memoryCache.set(key, entry as CacheEntry<unknown>);

  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(getFilePath(key), JSON.stringify(entry), 'utf-8');
  } catch {
    // non-fatal cache write failure
  }
}
