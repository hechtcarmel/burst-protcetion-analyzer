import * as vertica from "vertica";
import { z } from "zod";
import { createPool, Pool } from "generic-pool";

interface VerticaClient {
  query(
    sql: string,
    callback: (err: Error | null, result: QueryResult) => void
  ): void;
  disconnect(callback: (err: Error | null) => void): void;
}

interface QueryResult {
  fields: Array<{ name: string }>;
  rows: unknown[][];
  notices?: unknown[];
  status?: string;
}

const QUERY_TIMEOUT_MS = 120000;
const VALIDATION_TIMEOUT_MS = 10000;

const EnvSchema = z.object({
  VERTICA_HOST: z.string().min(1),
  VERTICA_PORT: z.preprocess(
    (val) => val ?? "5433",
    z.string().regex(/^\d+$/).transform(Number)
  ),
  VERTICA_DATABASE: z.string().min(1),
  VERTICA_USER: z.string().min(1),
  VERTICA_PASSWORD: z.string().min(1),
  VERTICA_CONNECTION_TIMEOUT: z.preprocess(
    (val) => val ?? "10000",
    z.string().regex(/^\d+$/).transform(Number)
  ),
});

type EnvConfig = z.infer<typeof EnvSchema>;

declare global {
  var __verticaPoolInstance: VerticaConnectionPool | undefined;
}

class VerticaConnectionPool {
  private static instance: VerticaConnectionPool;
  private pool: Pool<VerticaClient>;
  private config: EnvConfig;

  private constructor() {
    this.config = EnvSchema.parse({
      VERTICA_HOST: process.env.VERTICA_HOST,
      VERTICA_PORT: process.env.VERTICA_PORT || "5433",
      VERTICA_DATABASE: process.env.VERTICA_DATABASE,
      VERTICA_USER: process.env.VERTICA_USER,
      VERTICA_PASSWORD: process.env.VERTICA_PASSWORD,
      VERTICA_CONNECTION_TIMEOUT:
        process.env.VERTICA_CONNECTION_TIMEOUT || "10000",
    });

    this.pool = createPool(
      {
        create: async () => {
          return new Promise<VerticaClient>((resolve, reject) => {
            const connSettings = {
              host: this.config.VERTICA_HOST,
              port: this.config.VERTICA_PORT,
              database: this.config.VERTICA_DATABASE,
              user: this.config.VERTICA_USER,
              password: this.config.VERTICA_PASSWORD,
              timeout: 60000,
            };

            vertica.connect(connSettings, (err: Error | null, connection: VerticaClient) => {
              if (err) {
                console.error("Vertica connection error:", err);
                reject(err);
              } else {
                console.log("Vertica connection created in pool");
                resolve(connection);
              }
            });
          });
        },
        destroy: async (client: VerticaClient) => {
          return new Promise<void>((resolve, reject) => {
            client.disconnect((err: Error | null) => {
              if (err) {
                console.error("Error disconnecting Vertica client:", err);
                reject(err);
              } else {
                console.log("Vertica connection destroyed from pool");
                resolve();
              }
            });
          });
        },
        validate: async (client: VerticaClient) => {
          return new Promise<boolean>((resolve) => {
            const timeout = setTimeout(() => {
              console.warn("Vertica connection validation timeout");
              resolve(false);
            }, VALIDATION_TIMEOUT_MS);

            try {
              client.query(
                "SELECT 1 as test",
                (err: Error | null, result: QueryResult) => {
                  clearTimeout(timeout);
                  if (
                    err ||
                    !result ||
                    !result.rows ||
                    result.rows.length === 0
                  ) {
                    console.warn(
                      "Vertica connection validation failed:",
                      err?.message
                    );
                    resolve(false);
                  } else {
                    resolve(true);
                  }
                }
              );
            } catch (error) {
              clearTimeout(timeout);
              console.error("Vertica connection validation error:", error);
              resolve(false);
            }
          });
        },
      },
      {
        min: 1,
        max: 10,
        acquireTimeoutMillis: 10000,
        idleTimeoutMillis: 300000,
        evictionRunIntervalMillis: 60000,
        testOnBorrow: false,
        softIdleTimeoutMillis: 120000,
        numTestsPerEvictionRun: 3,
      }
    );

    const poolConfig = this.pool;
    console.log(
      `Vertica connection pool initialized (min: ${poolConfig.min}, max: ${poolConfig.max})`
    );
  }

  public static getInstance(): VerticaConnectionPool {
    if (process.env.NODE_ENV === "development") {
      if (!global.__verticaPoolInstance) {
        console.log("[HMR] Creating new Vertica connection pool");
        global.__verticaPoolInstance = new VerticaConnectionPool();
      } else {
        console.log("[HMR] Reusing existing Vertica connection pool");
      }
      return global.__verticaPoolInstance;
    }

    if (!VerticaConnectionPool.instance) {
      VerticaConnectionPool.instance = new VerticaConnectionPool();
    }
    return VerticaConnectionPool.instance;
  }

  public async query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
    const startTime = Date.now();
    let client: VerticaClient | null = null;
    let clientAcquired = false;

    try {
      console.log("Pool stats before acquire:", this.getPoolStats());
      client = await this.pool.acquire();
      clientAcquired = true;
      const acquireTime = Date.now() - startTime;
      console.log(`Connection acquired in ${acquireTime}ms`);

      return await new Promise((resolve, reject) => {
        const queryTimeout = setTimeout(() => {
          const error = new Error(`Query timeout after ${QUERY_TIMEOUT_MS}ms`);
          console.error("Query timeout:", error);
          reject(error);
        }, QUERY_TIMEOUT_MS);

        try {
          client!.query(sql, (err: Error | null, result: QueryResult) => {
            clearTimeout(queryTimeout);
            const queryTime = Date.now() - startTime;

            if (err) {
              console.error(`Query error after ${queryTime}ms:`, err.message);
              reject(err);
            } else {
              if (!result || !result.rows) {
                console.log(`Query completed in ${queryTime}ms with no rows`);
                resolve([]);
                return;
              }

              const fieldNames = result.fields.map((f) => f.name);
              const objects = result.rows.map((row) => {
                const obj: Record<string, unknown> = {};
                fieldNames.forEach((name: string, index: number) => {
                  obj[name] = row[index];
                });
                return obj as T;
              });

              console.log(
                `Query completed in ${queryTime}ms, returned ${objects.length} rows`
              );
              resolve(objects);
            }
          });
        } catch (error) {
          clearTimeout(queryTimeout);
          console.error("Query execution error:", error);
          reject(error);
        }
      });
    } catch (error) {
      console.error("Failed to acquire connection:", error);
      throw error;
    } finally {
      if (clientAcquired && client) {
        try {
          await this.pool.release(client);
          console.log("Connection released, pool stats:", this.getPoolStats());
        } catch (releaseError) {
          console.error("Error releasing connection:", releaseError);
        }
      }
    }
  }

  public async queryWithRetry<T = Record<string, unknown>>(
    sql: string,
    maxRetries: number = 3
  ): Promise<T[]> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.query<T>(sql);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Query attempt ${attempt + 1} failed:`, error);

        if (attempt < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  public async close(): Promise<void> {
    await this.pool.drain();
    await this.pool.clear();
    console.log("Vertica connection pool closed");
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query<{ result: number }>("SELECT 1 as result");
      return result.length > 0 && result[0].result === 1;
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  }

  public getPoolStats() {
    const stats = {
      size: this.pool.size,
      available: this.pool.available,
      pending: this.pool.pending,
      borrowed: this.pool.size - this.pool.available,
      min: this.pool.min,
      max: this.pool.max,
      spareResourceCapacity: this.pool.spareResourceCapacity,
    };
    return stats;
  }

  public async drainPool(): Promise<void> {
    console.log("Draining connection pool...");
    await this.pool.drain();
    console.log("Connection pool drained");
  }
}

export const db = VerticaConnectionPool.getInstance();

export async function executeQuery<T = Record<string, unknown>>(
  sql: string
): Promise<T[]> {
  return db.queryWithRetry<T>(sql);
}

export function getPoolStats() {
  return db.getPoolStats();
}

// Graceful shutdown handler
if (typeof process !== "undefined") {
  const shutdownHandler = async (signal: string) => {
    console.log(`\n${signal} received. Closing Vertica connection pool...`);
    try {
      await db.close();
      console.log("Vertica connection pool closed successfully");
      process.exit(0);
    } catch (error) {
      console.error("Error closing Vertica connection pool:", error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => shutdownHandler("SIGTERM"));
  process.on("SIGINT", () => shutdownHandler("SIGINT"));
}
