// src/lib/redis.ts
import Redis from 'ioredis';

class RedisClient {
  private client: Redis | null = null;
  private isHealthy = true;
  private fallbackStore = new Map<string, { value: string; expiry: number }>();
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times) => {
          if (times > 5) {
            this.isHealthy = false;
            console.warn('⚠️ Redis connection failed, using fallback store');
            return null;
          }
          return Math.min(times * 100, 1000);
        },
        maxRetriesPerRequest: 3,
      });

      this.client.on('error', (error) => {
        this.isHealthy = false;
        console.error('❌ Redis error:', error.message);
        this.scheduleReconnect();
      });

      this.client.on('connect', () => {
        this.isHealthy = true;
        console.log('✅ Redis connected');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      });

      this.client.on('close', () => {
        this.isHealthy = false;
        console.warn('⚠️ Redis connection closed');
        this.scheduleReconnect();
      });

    } catch (error) {
      this.isHealthy = false;
      console.error('❌ Redis initialization error:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      console.log('🔄 Attempting Redis reconnection...');
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  async get(key: string): Promise<string | null> {
    if (this.isHealthy && this.client) {
      try {
        return await this.client.get(key);
      } catch (error) {
        console.warn('⚠️ Redis get failed, using fallback:', error);
        this.isHealthy = false;
      }
    }
    // Fallback: in-memory store
    const item = this.fallbackStore.get(key);
    if (item && item.expiry > Date.now()) {
      return item.value;
    }
    this.fallbackStore.delete(key);
    return null;
  }

  async set(key: string, value: string, mode: 'EX', ttl: number): Promise<void> {
    if (this.isHealthy && this.client) {
      try {
        await this.client.set(key, value, mode, ttl);
        return;
      } catch (error) {
        console.warn('⚠️ Redis set failed, using fallback:', error);
        this.isHealthy = false;
      }
    }
    // Fallback: in-memory store
    this.fallbackStore.set(key, {
      value,
      expiry: Date.now() + ttl * 1000,
    });
  }

  async del(key: string): Promise<void> {
    if (this.isHealthy && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (error) {
        console.warn('⚠️ Redis del failed, using fallback:', error);
        this.isHealthy = false;
      }
    }
    this.fallbackStore.delete(key);
  }

  async ping(): Promise<boolean> {
    if (this.isHealthy && this.client) {
      try {
        const result = await this.client.ping();
        return result === 'PONG';
      } catch {
        return false;
      }
    }
    return false;
  }

  isConnected(): boolean {
    return this.isHealthy;
  }
}

// Export singleton instance
export default new RedisClient();