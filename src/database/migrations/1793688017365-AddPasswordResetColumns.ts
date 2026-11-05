import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetColumns1793688017365 implements MigrationInterface {
    name = 'AddPasswordResetColumns1793688017365'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "passwordResetToken" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "passwordResetExpiresAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordResetExpiresAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordResetToken"`);
    }

}
