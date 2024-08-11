import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRolesMigration1723249188279 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'roles',
        type: 'varchar',
        isNullable: false,
        default: "'guest'",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'role');
  }
}
