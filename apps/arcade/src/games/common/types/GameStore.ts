export interface GameStore {
  save<T>(key: string, data: T): Promise<void>;
  load<T>(key: string): Promise<T | null>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
  sync(): Promise<void>;
}
