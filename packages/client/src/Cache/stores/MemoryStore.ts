import type { CacheStore } from "./CacheStore.interface";

type StoreData<T = any> = {
  timestamp: number;
  value: T;
};

export class MemoryStore implements CacheStore {
  private data: {
    [key: string]: StoreData;
  } = {};

  async get(key: string, sinceTimestamp?: number) {
    const cached = this.data[key];

    if (sinceTimestamp) {
      if (cached.timestamp >= sinceTimestamp) {
        return cached.value;
      }
    } else {
      return cached.value;
    }
  }

  async set(key: string, value: any) {
    this.data[key] = {
      timestamp: Date.now(),
      value: value,
    };
  }

  async clear(key: string) {
    delete this.data[key];
  }
}
