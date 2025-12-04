import { Inject } from '@nestjs/common';
import type { DrizzleDB } from '../db.module';
import { DRIZZLE } from '../constants';

export abstract class BaseRepository {
  constructor(@Inject(DRIZZLE) protected readonly db: DrizzleDB) {}
}
