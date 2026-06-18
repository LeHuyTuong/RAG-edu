import { Injectable } from '@nestjs/common';
import { DocumentStatus, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prismaService: PrismaService) {}

  async getDashboardStats() {
    const [
      totalAccounts,
      activeAccounts,
      bannedAccounts,
      unverifiedAccounts,
      totalSubjects,
      totalDocuments,
      activeDocuments,
      pendingDocuments,
      rejectedDocuments,
    ] = await Promise.all([
      this.prismaService.accounts.count({
        where: {
          role: { not: UserRole.ADMIN },
          status: { not: UserStatus.DELETED },
        },
      }),
      this.prismaService.accounts.count({
        where: {
          role: { not: UserRole.ADMIN },
          status: UserStatus.ACTIVE,
        },
      }),
      this.prismaService.accounts.count({
        where: {
          role: { not: UserRole.ADMIN },
          status: UserStatus.BANNED,
        },
      }),
      this.prismaService.accounts.count({
        where: {
          role: { not: UserRole.ADMIN },
          status: UserStatus.UNVERIFIED,
        },
      }),
      this.prismaService.subjects.count(),
      this.prismaService.documents.count({
        where: { status: { not: DocumentStatus.DELETED } },
      }),
      this.prismaService.documents.count({
        where: { status: DocumentStatus.ACTIVE },
      }),
      this.prismaService.documents.count({
        where: { status: DocumentStatus.PENDING },
      }),
      this.prismaService.documents.count({
        where: { status: DocumentStatus.REJECTED },
      }),
    ]);

    return {
      message: 'Admin dashboard stats fetched successfully',
      data: {
        accounts: {
          total: totalAccounts,
          active: activeAccounts,
          banned: bannedAccounts,
          unverified: unverifiedAccounts,
        },
        subjects: {
          total: totalSubjects,
        },
        documents: {
          total: totalDocuments,
          active: activeDocuments,
          pending: pendingDocuments,
          rejected: rejectedDocuments,
        },
      },
    };
  }
}
