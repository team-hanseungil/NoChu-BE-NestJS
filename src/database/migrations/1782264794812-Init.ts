import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1782264794812 implements MigrationInterface {
  name = 'Init1782264794812';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_preferences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "data" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b6202d1cacc63a0b9c8dac2abd4" UNIQUE ("userId"), CONSTRAINT "REL_b6202d1cacc63a0b9c8dac2abd" UNIQUE ("userId"), CONSTRAINT "PK_e8cfb5b31af61cd363a6b6d7c25" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "spotifyId" character varying NOT NULL, "email" character varying, "displayName" character varying NOT NULL, "profileImageUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_69f5d772fb38e0d5617130d1049" UNIQUE ("spotifyId"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "playlists" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "emotionLabel" character varying, "faceConfidence" double precision, "textInput" text, "textEmotion" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a4597f4189a75d20507f3f7ef0d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "playlist_songs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "playlistId" uuid NOT NULL, "songId" uuid NOT NULL, "rank" integer NOT NULL, CONSTRAINT "PK_bd99fdcd269be0f3ad345340eb4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "songs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "spotifyTrackId" character varying NOT NULL, "title" character varying NOT NULL, "artist" character varying NOT NULL, "albumName" character varying NOT NULL, "albumImageUrl" character varying, "previewUrl" character varying, "durationMs" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_10cdaf862ab10216611ca7c562b" UNIQUE ("spotifyTrackId"), CONSTRAINT "PK_e504ce8ad2e291d3a1d8f1ea2f4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_preferences" ADD CONSTRAINT "FK_b6202d1cacc63a0b9c8dac2abd4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "playlists" ADD CONSTRAINT "FK_708a919e9aa49019000d9e9b68e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "playlist_songs" ADD CONSTRAINT "FK_b417e94c5022d641c977ef85d8b" FOREIGN KEY ("playlistId") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "playlist_songs" ADD CONSTRAINT "FK_d6a09d42a96563d9d139b5f7fdf" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "playlist_songs" DROP CONSTRAINT "FK_d6a09d42a96563d9d139b5f7fdf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "playlist_songs" DROP CONSTRAINT "FK_b417e94c5022d641c977ef85d8b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "playlists" DROP CONSTRAINT "FK_708a919e9aa49019000d9e9b68e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_preferences" DROP CONSTRAINT "FK_b6202d1cacc63a0b9c8dac2abd4"`,
    );
    await queryRunner.query(`DROP TABLE "songs"`);
    await queryRunner.query(`DROP TABLE "playlist_songs"`);
    await queryRunner.query(`DROP TABLE "playlists"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "user_preferences"`);
  }
}
