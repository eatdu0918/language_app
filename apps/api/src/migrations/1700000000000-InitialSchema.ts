import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"                  uuid              NOT NULL DEFAULT gen_random_uuid(),
        "email"               character varying NOT NULL,
        "name"                character varying NOT NULL,
        "password_hash"       character varying NOT NULL,
        "subscription_tier"   character varying NOT NULL DEFAULT 'free',
        "target_languages"    character varying NOT NULL DEFAULT 'en',
        "levels"              jsonb             NOT NULL DEFAULT '{"en":"beginner","ja":"beginner"}',
        "stripe_customer_id"  character varying,
        "created_at"          TIMESTAMP         NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "vocabulary_words" (
        "id"                  uuid              NOT NULL DEFAULT gen_random_uuid(),
        "word"                character varying NOT NULL,
        "reading"             character varying,
        "meaning"             character varying NOT NULL,
        "example_sentence"    text              NOT NULL,
        "example_translation" text              NOT NULL,
        "language"            character varying NOT NULL,
        "level"               character varying NOT NULL DEFAULT 'beginner',
        "tags"                character varying NOT NULL DEFAULT '',
        "created_at"          TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vocabulary_words" PRIMARY KEY ("id")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "vocabulary_progress" (
        "id"               uuid      NOT NULL DEFAULT gen_random_uuid(),
        "user_id"          uuid      NOT NULL,
        "word_id"          uuid      NOT NULL,
        "interval"         integer   NOT NULL DEFAULT 1,
        "ease_factor"      real      NOT NULL DEFAULT 2.5,
        "repetitions"      integer   NOT NULL DEFAULT 0,
        "due_date"         TIMESTAMP NOT NULL,
        "last_reviewed_at" TIMESTAMP,
        CONSTRAINT "PK_vocabulary_progress" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vp_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_vp_word" FOREIGN KEY ("word_id") REFERENCES "vocabulary_words"("id") ON DELETE CASCADE
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "documents" (
        "id"                         uuid              NOT NULL DEFAULT gen_random_uuid(),
        "title"                      character varying NOT NULL,
        "content"                    text              NOT NULL,
        "language"                   character varying NOT NULL,
        "level"                      character varying NOT NULL DEFAULT 'beginner',
        "estimated_reading_minutes"  integer           NOT NULL DEFAULT 5,
        "tags"                       character varying NOT NULL DEFAULT '',
        "created_at"                 TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_documents" PRIMARY KEY ("id")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "conversation_sessions" (
        "id"         uuid              NOT NULL DEFAULT gen_random_uuid(),
        "user_id"    uuid              NOT NULL,
        "language"   character varying NOT NULL,
        "scenario"   character varying NOT NULL DEFAULT 'free',
        "started_at" TIMESTAMP         NOT NULL DEFAULT now(),
        "ended_at"   TIMESTAMP,
        CONSTRAINT "PK_conversation_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "conversation_messages" (
        "id"          uuid              NOT NULL DEFAULT gen_random_uuid(),
        "session_id"  uuid              NOT NULL,
        "role"        character varying NOT NULL,
        "content"     text              NOT NULL,
        "corrections" jsonb,
        "timestamp"   TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversation_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cm_session" FOREIGN KEY ("session_id") REFERENCES "conversation_sessions"("id") ON DELETE CASCADE
      )
    `)

    // 인덱스
    await queryRunner.query(`CREATE INDEX "IDX_vp_user_due" ON "vocabulary_progress" ("user_id", "due_date")`)
    await queryRunner.query(`CREATE INDEX "IDX_vp_word" ON "vocabulary_progress" ("word_id")`)
    await queryRunner.query(`CREATE INDEX "IDX_docs_lang_level" ON "documents" ("language", "level")`)
    await queryRunner.query(`CREATE INDEX "IDX_cm_session" ON "conversation_messages" ("session_id")`)
    await queryRunner.query(`CREATE INDEX "IDX_vw_lang_level" ON "vocabulary_words" ("language", "level")`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "conversation_messages"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "conversation_sessions"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "vocabulary_progress"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "documents"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "vocabulary_words"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`)
  }
}
