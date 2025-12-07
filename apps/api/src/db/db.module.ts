import { Module, Global, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema';
import {
  UsersRepository,
  GroupsRepository,
  ExpensesRepository,
  SettlementsRepository,
  MagicLinksRepository,
} from './repositories';
import { DRIZZLE, POSTGRES_CLIENT } from './constants';

export { DRIZZLE };
export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: POSTGRES_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const connectionString = config.get<string>('DATABASE_URL');
        if (!connectionString) {
          throw new Error('DATABASE_URL is not defined');
        }

        // Connection pool configuration
        return postgres(connectionString, {
          prepare: false,
          // Connection pool settings
          max: config.get<number>('DB_POOL_MAX', 20), // Maximum connections in pool
          idle_timeout: config.get<number>('DB_IDLE_TIMEOUT', 20), // Seconds before idle connection is closed
          connect_timeout: config.get<number>('DB_CONNECT_TIMEOUT', 10), // Seconds to wait for connection
        });
      },
    },
    {
      provide: DRIZZLE,
      inject: [POSTGRES_CLIENT],
      useFactory: (client: Sql) => {
        return drizzle(client, { schema });
      },
    },
    UsersRepository,
    GroupsRepository,
    ExpensesRepository,
    SettlementsRepository,
    MagicLinksRepository,
  ],
  exports: [
    DRIZZLE,
    UsersRepository,
    GroupsRepository,
    ExpensesRepository,
    SettlementsRepository,
    MagicLinksRepository,
  ],
})
export class DbModule implements OnModuleDestroy {
  constructor(@Inject(POSTGRES_CLIENT) private readonly client: Sql) {}

  async onModuleDestroy() {
    await this.client.end();
  }
}
