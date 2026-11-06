import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertEmailVerificationToOtp1793923200000
  implements MigrationInterface
{
  name = 'ConvertEmailVerificationToOtp1793923200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      RENAME COLUMN "emailVerificationToken"
      TO "emailVerificationOtpHash"
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "emailVerificationOtpHash" = NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "emailVerificationOtpHash"
      TYPE character varying(64)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "emailVerificationOtpHash"
      TYPE character varying(255)
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      RENAME COLUMN "emailVerificationOtpHash"
      TO "emailVerificationToken"
    `);
  }
}
