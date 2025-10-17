declare module 'vertica' {
  export interface ConnectionOptions {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    timeout?: number;
  }

  export interface QueryResult {
    rows: unknown[][];
    fields: Array<{ name: string; dataTypeID?: number }>;
    notices?: unknown[];
    status?: string;
  }

  export interface Connection {
    query(sql: string, callback: (error: Error | null, result: QueryResult) => void): void;
    query(sql: string, params: unknown[], callback: (error: Error | null, result: QueryResult) => void): void;
    disconnect(callback: (error: Error | null) => void): void;
  }

  export function connect(options: ConnectionOptions, callback: (error: Error | null, connection: Connection) => void): Connection;
}
