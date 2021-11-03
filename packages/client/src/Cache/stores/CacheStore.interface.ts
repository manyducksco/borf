export interface CacheStore {
  get(key: string, sinceTimestamp?: number): Promise<any | undefined>;
  set(key: string, value: any): Promise<void>;
  clear(key: string): Promise<void>;
}
