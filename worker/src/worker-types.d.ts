interface D1Result<T = Record<string, unknown>> {
  results: T[];
}

interface D1BoundStatement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  first<T = Record<string, unknown>>(...args: any[]): Promise<T | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  all<T = Record<string, unknown>>(...args: any[]): Promise<D1Result<T>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run(...args: any[]): Promise<unknown>;
}

interface D1PreparedStatement extends D1BoundStatement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bind(...values: any[]): D1BoundStatement;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: unknown[]): Promise<unknown[]>;
}

interface ScheduledEvent {
  cron: string;
  scheduledTime: number;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}
