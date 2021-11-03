import type { CacheStore } from "./CacheStore.interface";

/**
 * Cache store that persists data to localStorage.
 */
export class LocalStore implements CacheStore {
  private id: string;

  constructor(id: string) {
    this.id = id;
  }

  async get(key: string, sinceTimestamp?: number) {
    const cached = localStorage.getItem(this.getKey(key));

    if (cached) {
      const parsed = JSON.parse(cached);

      if (sinceTimestamp) {
        if (parsed.timestamp >= sinceTimestamp) {
          return parsed.value;
        }
      } else {
        return parsed.value;
      }
    }
  }

  async set(key: string, value: any) {
    localStorage.setItem(
      this.getKey(key),
      JSON.stringify({
        timestamp: Date.now(),
        value: value,
      })
    );
  }

  async clear(key: string) {
    localStorage.removeItem(key);
  }

  private getKey(key: string) {
    return "cache_" + this.id + "_" + key;
  }
}
