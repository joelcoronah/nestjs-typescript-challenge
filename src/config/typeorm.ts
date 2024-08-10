import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenvConfig({ path: '.env' });

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: `${process.env.DB_HOST}`,
  port: +process.env.DB_PORT,
  username: `${process.env.DB_USER}`,
  password: `${process.env.DB_PASS}`,
  database: `${process.env.DB_DATABASE}`,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
