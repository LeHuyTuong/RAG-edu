import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AccountsModule } from '../accounts/accounts.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { AdminAccountsController } from './admin-accounts.controller';
import { AdminSubjectsController } from './admin-subjects.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [AccountsModule, SubjectsModule, PrismaModule],
  controllers: [
    AdminAccountsController,
    AdminSubjectsController,
    AdminDashboardController,
  ],
  providers: [AdminService],
})
export class AdminModule {}
