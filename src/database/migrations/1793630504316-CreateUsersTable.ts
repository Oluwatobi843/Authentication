import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1793630504316 implements MigrationInterface {
    name = 'CreateUsersTable1793630504316'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'ADMIN')`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "phoneNumber" character varying(20), "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER', "status" "public"."users_status_enum" NOT NULL DEFAULT 'PENDING', "emailVerified" boolean NOT NULL DEFAULT false, "emailVerificationToken" character varying(255), "emailVerificationExpiresAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users"  ("email") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
