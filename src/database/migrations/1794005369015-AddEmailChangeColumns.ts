import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailChangeColumns1794005369015 implements MigrationInterface {
    name = 'AddEmailChangeColumns1794005369015'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "pendingEmail" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "emailChangeOtpHash" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "emailChangeOtpExpiresAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailChangeOtpExpiresAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailChangeOtpHash"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "pendingEmail"`);
    }

}
