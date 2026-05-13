import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule } from '@nestjs/throttler'
import { RedisModule } from './redis/redis.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { VocabularyModule } from './vocabulary/vocabulary.module'
import { DocumentsModule } from './documents/documents.module'
import { ConversationModule } from './conversation/conversation.module'
import { AiModule } from './ai/ai.module'
import { SpeechModule } from './speech/speech.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'language_app'),
        password: config.get('DB_PASSWORD', 'language_app_password'),
        database: config.get('DB_DATABASE', 'language_app'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: config.get('NODE_ENV') === 'development',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),

    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    RedisModule,
    AuthModule,
    UsersModule,
    VocabularyModule,
    DocumentsModule,
    ConversationModule,
    AiModule,
    SpeechModule,
  ],
})
export class AppModule {}
