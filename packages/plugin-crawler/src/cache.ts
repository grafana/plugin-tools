import { createCache } from 'cache-manager';
import KeyvSqlite from '@keyv/sqlite';
import { getConfig } from './config.js';

const { cachePath, cacheTtl } = getConfig();
const keyv = new KeyvSqlite(`sqlite://${cachePath}`);
// @ts-ignore
const cache = createCache({ ttl: cacheTtl, stores: [keyv] });

export async function cacheGet(key: string) {
  try {
    const cached = await cache.get(key);

    if (cached) {
      // @ts-ignore
      return JSON.parse(cached);
    }

    return undefined;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function cacheSet(key: string, value: unknown) {
  try {
    await cache.set(key, JSON.stringify(value));
  } catch (error) {
    console.error(error);
  }
}

export async function cacheDel(key: string) {
  try {
    await cache.del(key);
  } catch (error) {
    console.error(error);
  }
}
