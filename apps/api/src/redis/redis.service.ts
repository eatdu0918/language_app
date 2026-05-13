import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private client: Redis | null = null

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get('REDIS_HOST', 'localhost')
    const port = this.config.get<number>('REDIS_PORT', 6379)
    this.client = new Redis({ host, port, lazyConnect: true })
    this.client.on('error', (err: Error) => {
      this.logger.warn(`Redis unavailable: ${err.message}`)
    })
    this.client.connect().catch(() => {
      this.logger.warn('Redis connection failed — caching disabled')
    })
  }

  async onModuleDestroy() {
    await this.client?.quit().catch(() => undefined)
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null
    try {
      const val = await this.client.get(key)
      return val ? (JSON.parse(val) as T) : null
    } catch {
      return null
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.client) return
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds)
    } catch {
      // cache write failure is non-fatal
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return
    try {
      await this.client.del(key)
    } catch {
      // cache delete failure is non-fatal
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.client) return
    try {
      const keys = await this.client.keys(pattern)
      if (keys.length > 0) await this.client.del(...keys)
    } catch {
      // cache delete failure is non-fatal
    }
  }
}
