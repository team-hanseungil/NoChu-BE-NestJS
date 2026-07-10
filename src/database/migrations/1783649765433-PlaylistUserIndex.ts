import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlaylistUserIndex1783649765433 implements MigrationInterface {
  name = 'PlaylistUserIndex1783649765433';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_c298a5f2f65603b1a8519e3e26" ON "playlists" ("userId", "createdAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_c298a5f2f65603b1a8519e3e26"`);
  }
}
