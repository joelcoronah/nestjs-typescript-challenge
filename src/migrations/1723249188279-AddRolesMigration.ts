import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRolesMigration1723249188279 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'role',
        type: 'enum',
        enum: ['admin', 'agent', 'customer', 'guest'],
        default: "'guest'",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'role');
  }
}
