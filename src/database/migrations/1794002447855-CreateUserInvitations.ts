
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserInvitations1794002447855
  implements MigrationInterface
{
  name = 'CreateUserInvitations1794002447855';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create invitation role enum
    await queryRunner.query(`
      CREATE TYPE "public"."user_invitations_role_enum"
      AS ENUM('USER', 'ADMIN')
    `);

    // Create invitation status enum
    await queryRunner.query(`
      CREATE TYPE "public"."user_invitations_status_enum"
      AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')
    `);

    // Create user invitations table
    await queryRunner.query(`
      CREATE TABLE "user_invitations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "tokenHash" character varying(64) NOT NULL,
        "role" "public"."user_invitations_role_enum"
          NOT NULL DEFAULT 'USER',
        "status" "public"."user_invitations_status_enum"
          NOT NULL DEFAULT 'PENDING',
        "invitedById" uuid NOT NULL,
        "acceptedById" uuid,
        "expiresAt" TIMESTAMP NOT NULL,
        "acceptedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_c8005acb91c3ce9a7ae581eca8f"
          PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_dd74d7bb777140c893151d2da6"
      ON "user_invitations" ("email", "status")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_1bd83bea480593536e6549b666"
      ON "user_invitations" ("tokenHash")
    `);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "user_invitations"
      ADD CONSTRAINT "FK_f679e6eb5e1629f143a0d1cd3f9"
      FOREIGN KEY ("invitedById")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "user_invitations"
      ADD CONSTRAINT "FK_79c882525a7944374c0eca5ce7c"
      FOREIGN KEY ("acceptedById")
      REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign keys
    await queryRunner.query(`
      ALTER TABLE "user_invitations"
      DROP CONSTRAINT "FK_79c882525a7944374c0eca5ce7c"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_invitations"
      DROP CONSTRAINT "FK_f679e6eb5e1629f143a0d1cd3f9"
    `);

    // Remove indexes
    await queryRunner.query(`
      DROP INDEX "public"."IDX_1bd83bea480593536e6549b666"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_dd74d7bb777140c893151d2da6"
    `);

    // Remove table
    await queryRunner.query(`
      DROP TABLE "user_invitations"
    `);

    // Remove enum types
    await queryRunner.query(`
      DROP TYPE "public"."user_invitations_status_enum"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."user_invitations_role_enum"
    `);
  }
}
