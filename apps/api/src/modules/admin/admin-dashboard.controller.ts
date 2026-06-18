import { Controller, Get, UseGuards, Version } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminService } from './admin.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminDashboardController {
  constructor(private readonly adminService: AdminService) {}

  @Roles(UserRole.ADMIN)
  @Version('1')
  @Get('dashboard')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }
}
