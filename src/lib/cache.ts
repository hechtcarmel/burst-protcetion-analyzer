import NodeCache from 'node-cache';

class CacheManager {
  private static instance: CacheManager;
  private cache: NodeCache;

  private constructor() {
    this.cache = new NodeCache({
      stdTTL: 300,
      checkperiod: 60,
      useClones: false,
      maxKeys: 100,
      deleteOnExpire: true,
    });

    console.log('Cache manager initialized (TTL: 300s, maxKeys: 100)');
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  public get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);
    if (value !== undefined) {
      console.log(`Cache HIT: ${key}`);
    } else {
      console.log(`Cache MISS: ${key}`);
    }
    return value;
  }

  public set<T>(key: string, value: T, ttl?: number): boolean {
    const success = this.cache.set(key, value, ttl || 300);
    if (success) {
      console.log(`Cache SET: ${key} (TTL: ${ttl || 300}s)`);
    }
    return success;
  }

  public del(key: string | string[]): number {
    const deleted = this.cache.del(key);
    console.log(`Cache DEL: ${Array.isArray(key) ? key.join(', ') : key} (${deleted} deleted)`);
    return deleted;
  }

  public flush(): void {
    this.cache.flushAll();
    console.log('Cache FLUSH: all keys cleared');
  }

  public getStats() {
    const stats = this.cache.getStats();
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      ksize: stats.ksize,
      vsize: stats.vsize,
    };
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }

  public keys(): string[] {
    return this.cache.keys();
  }
}

export const cacheManager = CacheManager.getInstance();

export function generateCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join(':');

  return sortedParams ? `${prefix}:${sortedParams}` : prefix;
}

export function clearCacheByPrefix(prefix: string): number {
  const keys = cacheManager.keys();
  const matchingKeys = keys.filter(key => key.startsWith(prefix));
  return cacheManager.del(matchingKeys);
}
