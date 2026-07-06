import { MigrationInterface, QueryRunner } from "typeorm";

export class MusicColumns1783297785052 implements MigrationInterface {
    name = 'MusicColumns1783297785052'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "songs" ADD "spotifyUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "playlists" ADD "title" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "playlists" ADD "imageUrl" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "playlists" DROP COLUMN "imageUrl"`);
        await queryRunner.query(`ALTER TABLE "playlists" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "spotifyUrl"`);
    }

}
