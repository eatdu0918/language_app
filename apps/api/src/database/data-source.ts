import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as path from 'path'

// 마이그레이션 CLI 실행 시 직접 환경변수를 읽음 (.env 파일은 CLI 실행 전 수동 로드)
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env['DB_HOST'] ?? 'localhost',
  port: Number(process.env['DB_PORT'] ?? 5432),
  username: process.env['DB_USERNAME'] ?? 'language_app',
  password: process.env['DB_PASSWORD'] ?? 'language_app_password',
  database: process.env['DB_DATABASE'] ?? 'language_app',
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../migrations/*{.ts,.js}')],
  synchronize: false,
  logging: true,
})
