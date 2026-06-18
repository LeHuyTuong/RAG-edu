import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name, { timestamp: true });

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected with database');
    } catch (error) {
      this.logger.error('Database connection failled: ' + String(error));
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
