import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmotions1782868595768 implements MigrationInterface {
  name = 'AddEmotions1782868595768';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "emotions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "emotion" character varying NOT NULL, "emotions" jsonb NOT NULL, "imageUrl" character varying NOT NULL, "comment" text, "confidence" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0cfeb943349b02abbe434bf6980" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_42a279ba9819904c00c80cd77e" ON "emotions" ("userId", "createdAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_42a279ba9819904c00c80cd77e"`,
    );
    await queryRunner.query(`DROP TABLE "emotions"`);
  }
}
