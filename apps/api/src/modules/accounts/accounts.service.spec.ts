import { Test, TestingModule } from '@nestjs/testing';
import { UserRole, UserStatus } from '@prisma/client';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountsService } from './accounts.service';

describe('AccountsService', () => {
  let service: AccountsService;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    jest.clearAllMocks();

    moduleRef = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: PrismaService,
          useValue: {
            accounts: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = moduleRef.get<AccountsService>(AccountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create stores hashed password and returns success message', async () => {
    const prisma: any = moduleRef.get(PrismaService as any);
    prisma.accounts.findUnique.mockResolvedValue(null);
    prisma.accounts.create.mockResolvedValue({ id: 'acc-1' });
    const res = await service.create({
      email: 'admin@example.com',
      name: 'Admin User',
      password: 'Password123!',
      role: 'ADMIN' as any,
    });

    const createArgs = prisma.accounts.create.mock.calls[0][0];
    expect(createArgs.data.email).toBe('admin@example.com');
    expect(createArgs.data.name).toBe('Admin User');
    expect(createArgs.data.role).toBe('ADMIN');
    expect(createArgs.data.status).toBe(UserStatus.UNVERIFIED);
    expect(createArgs.data.password).not.toBe('Password123!');
    expect(res).toEqual({ message: 'Account created successfully' });
  });

  it('createModerator forces moderator role and active status', async () => {
    const prisma: any = moduleRef.get(PrismaService as any);
    prisma.accounts.findUnique.mockResolvedValue(null);
    prisma.accounts.create.mockResolvedValue({ id: 'acc-1' });

    await service.createModerator({
      email: 'moderator@example.com',
      name: 'Moderator User',
      password: 'Password123!',
      role: UserRole.ADMIN,
      status: UserStatus.BANNED,
    });

    const createArgs = prisma.accounts.create.mock.calls[0][0];
    expect(createArgs.data.role).toBe(UserRole.MODERATOR);
    expect(createArgs.data.status).toBe(UserStatus.ACTIVE);
  });

  it('throws ConflictException when email already exists', async () => {
    const prisma: any = moduleRef.get(PrismaService as any);
    prisma.accounts.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      service.create({
        email: 'existing@example.com',
        name: 'Existing',
        password: 'Password123!',
      } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('findAll calls prisma findMany with admin-safe filters and newest ordering', async () => {
    const prisma: any = moduleRef.get(PrismaService as any);
    prisma.accounts.findMany.mockResolvedValue([{ id: 1 }]);
    const res = await service.findAll();
    expect(res).toEqual([{ id: 1 }]);
    expect(prisma.accounts.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { not: UserStatus.DELETED },
          role: { not: UserRole.ADMIN },
        }),
        orderBy: { createdAt: 'desc' },
        select: expect.objectContaining({
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          status: true,
        }),
      }),
    );
  });

  it('findAll applies created date range filters', async () => {
    const prisma: any = moduleRef.get(PrismaService as any);
    prisma.accounts.findMany.mockResolvedValue([]);

    await service.findAll({
      createdFrom: '2026-06-01',
      createdTo: '2026-06-10',
    });

    expect(prisma.accounts.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: {
            gte: new Date('2026-06-01'),
            lt: new Date('2026-06-11'),
          },
        }),
      }),
    );
  });

  it('ban updates account status to banned', async () => {
    const prisma: any = moduleRef.get(PrismaService as any);
    prisma.accounts.findUnique.mockResolvedValue({
      id: 'acc-1',
      status: UserStatus.ACTIVE,
    });
    prisma.accounts.update.mockResolvedValue({ id: 'acc-1' });

    await service.ban('acc-1');

    expect(prisma.accounts.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'acc-1' },
        data: { status: UserStatus.BANNED },
      }),
    );
  });

  it('ban returns already banned message when account is already banned', async () => {
    const prisma: any = moduleRef.get(PrismaService as any);
    prisma.accounts.findUnique.mockResolvedValue({
      id: 'acc-2',
      status: UserStatus.BANNED,
    });

    const res = await service.ban('acc-2');
    expect(res).toEqual({ message: 'Account is already banned' });
  });

  it('ban throws ConflictException for admin accounts', async () => {
    const prisma: any = moduleRef.get(PrismaService as any);
    prisma.accounts.findUnique.mockResolvedValue({
      id: 'admin-1',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });

    await expect(service.ban('admin-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.accounts.update).not.toHaveBeenCalled();
  });

  it('ban throws NotFoundException when account does not exist', async () => {
    const prisma: any = moduleRef.get(PrismaService as any);
    prisma.accounts.findUnique.mockResolvedValue(null);

    await expect(service.ban('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('findOne returns account when found', async () => {
    const prisma: any = moduleRef.get(PrismaService as any);
    const account = { id: 'acc-1', email: 'a@example.com' };
    prisma.accounts.findUnique.mockResolvedValue(account);

    const res = await service.findOne('acc-1');
    expect(res).toEqual(account);
    expect(prisma.accounts.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'acc-1',
        }),
      }),
    );
  });

  it('findOne throws NotFoundException when not found', async () => {
    const prisma: any = moduleRef.get(PrismaService as any);
    prisma.accounts.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('findMe returns the authenticated account profile', async () => {
    const prisma: any = moduleRef.get(PrismaService as any);
    const account = {
      id: 'acc-1',
      email: 'a@example.com',
      name: 'Student',
      avatarUrl: '',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    };
    prisma.accounts.findUnique.mockResolvedValue(account);

    const res = await service.findMe('acc-1');

    expect(res).toEqual(account);
    expect(prisma.accounts.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'acc-1',
          status: { not: UserStatus.DELETED },
        },
        select: expect.objectContaining({
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          status: true,
        }),
      }),
    );
  });

  it('findMe throws NotFoundException when the authenticated account is missing', async () => {
    const prisma: any = moduleRef.get(PrismaService as any);
    prisma.accounts.findUnique.mockResolvedValue(null);

    await expect(service.findMe('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update returns updated account when exists', async () => {
    const prisma: any = moduleRef.get(PrismaService as any);
    prisma.accounts.findUnique.mockResolvedValue({ id: 'acc-1' });
    const updated = {
      id: 'acc-1',
      email: 'a@example.com',
      name: 'New',
      avatarUrl: 'u',
    };
    prisma.accounts.update.mockResolvedValue(updated);

    const res = await service.update(
      'acc-1',
      {
        name: 'New',
        avatarUrl: 'u',
      } as any,
      'acc-1',
    );
    expect(res).toEqual(updated);
    expect(prisma.accounts.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'acc-1' },
        data: { name: 'New', avatarUrl: 'u' },
        select: expect.objectContaining({
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        }),
      }),
    );
  });

  it('remove sets status to DELETED and returns message', async () => {
    const prisma: any = moduleRef.get(PrismaService as any);
    prisma.accounts.findUnique.mockResolvedValue({ id: 'acc-1' });
    prisma.accounts.update.mockResolvedValue({ id: 'acc-1' });

    const res = await service.remove('acc-1', 'acc-1');
    expect(prisma.accounts.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'acc-1' },
        data: { status: UserStatus.DELETED },
      }),
    );
    expect(res).toEqual({ message: 'Account deleted successfully' });
  });
});
