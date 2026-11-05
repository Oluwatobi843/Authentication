import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokenColumns1793669678696
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "refreshTokenHash" VARCHAR(255) NULL,
      ADD COLUMN "refreshTokenExpiresAt" TIMESTAMP NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "refreshTokenExpiresAt",
      DROP COLUMN "refreshTokenHash"
    `);
  }
}