import { MigrationInterface, QueryRunner } from 'typeorm';

export class SpotifyExport1783645046585 implements MigrationInterface {
  name = 'SpotifyExport1783645046585';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "playlists" ADD "spotifyPlaylistId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "playlists" ADD "spotifyPlaylistUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "spotifyRefreshToken" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "spotifyRefreshToken"`,
    );
    await queryRunner.query(
      `ALTER TABLE "playlists" DROP COLUMN "spotifyPlaylistUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "playlists" DROP COLUMN "spotifyPlaylistId"`,
    );
  }
}
