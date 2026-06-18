import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { accounts, Prisma, UserRole, UserStatus } from '@prisma/client';
import { CreateAccountDto } from './dto/create-account.dto';
import { ListAccountsQueryDto } from './dto/list-accounts-query.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { PrismaService } from '../../prisma/prisma.service';
import argon2 from 'argon2';

@Injectable()
export class AccountsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createAccountDto: CreateAccountDto) {
    const existing = await this.prismaService.accounts.findUnique({
      where: { email: createAccountDto.email },
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await argon2.hash(createAccountDto.password);

    await this.prismaService.accounts.create({
      data: {
        email: createAccountDto.email,
        name: createAccountDto.name,
        password: hashedPassword,
        avatarUrl: createAccountDto.avatarUrl ?? '',
        role: createAccountDto.role ?? UserRole.USER,
        status: createAccountDto.status ?? UserStatus.UNVERIFIED,
      },
    });

    return { message: 'Account created successfully' };
  }

  async createModerator(createAccountDto: CreateAccountDto) {
    return this.create({
      ...createAccountDto,
      role: UserRole.MODERATOR,
      status: UserStatus.ACTIVE,
    });
  }

  async findAll(query: ListAccountsQueryDto = {}) {
    const where: Prisma.accountsWhereInput = {
      status: { not: UserStatus.DELETED },
      role: { not: UserRole.ADMIN },
    };

    const createdAt: Prisma.DateTimeFilter = {};

    if (query.createdFrom) {
      createdAt.gte = new Date(query.createdFrom);
    }

    if (query.createdTo) {
      const createdTo = new Date(query.createdTo);

      if (/^\d{4}-\d{2}-\d{2}$/.test(query.createdTo)) {
        createdTo.setUTCDate(createdTo.getUTCDate() + 1);
        createdAt.lt = createdTo;
      } else {
        createdAt.lte = createdTo;
      }
    }

    if (createdAt.gte || createdAt.lte || createdAt.lt) {
      where.createdAt = createdAt;
    }

    return await this.prismaService.accounts.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const account = await this.prismaService.accounts.findUnique({
      where: {
        id,
        status: { not: UserStatus.DELETED },
      },
      omit: {
        password: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async findMe(id: string) {
    const account = await this.prismaService.accounts.findUnique({
      where: {
        id,
        status: { not: UserStatus.DELETED },
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async findAccountByEmail(email: string): Promise<accounts | null> {
    return await this.prismaService.accounts.findUnique({
      where: {
        email,
        status: { not: UserStatus.DELETED },
      },
    });
  }

  async ban(accountId: string) {
    const account = await this.prismaService.accounts.findUnique({
      where: {
        id: accountId,
        status: { not: UserStatus.DELETED },
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.role === UserRole.ADMIN) {
      throw new ConflictException('Admin accounts cannot be banned');
    }

    if (account.status === UserStatus.BANNED) {
      return { message: 'Account is already banned' };
    }

    await this.prismaService.accounts.update({
      where: { id: accountId },
      data: {
        status: UserStatus.BANNED,
      },
    });

    return { message: `Account banned successfully` };
  }

  async update(id: string, updateAccountDto: UpdateAccountDto, userId: string) {
    const account = await this.prismaService.accounts.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.id !== userId) {
      throw new ConflictException(
        'You have no permission to update this account',
      );
    }

    const updatedAccount = await this.prismaService.accounts.update({
      where: { id: account.id },
      data: {
        name: updateAccountDto.name,
        avatarUrl: updateAccountDto.avatarUrl,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    });

    return updatedAccount;
  }

  async remove(id: string, userId: string) {
    const account = await this.prismaService.accounts.findUnique({
      where: {
        id,
        status: { not: UserStatus.DELETED },
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.id !== userId) {
      throw new ConflictException(
        'You have no permission to delete this account',
      );
    }

    await this.prismaService.accounts.update({
      where: { id: account.id },
      data: {
        status: UserStatus.DELETED,
      },
    });

    return { message: `Account deleted successfully` };
  }
}
