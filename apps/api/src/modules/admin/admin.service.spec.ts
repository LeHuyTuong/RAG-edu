import { DocumentStatus, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;

  const prismaMock = {
    accounts: {
      count: jest.fn(),
    },
    subjects: {
      count: jest.fn(),
    },
    documents: {
      count: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminService(prismaMock as unknown as PrismaService);
  });

  it('aggregates dashboard counts from current models', async () => {
    prismaMock.accounts.count
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3);
    prismaMock.subjects.count.mockResolvedValueOnce(5);
    prismaMock.documents.count
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(14)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);

    await expect(service.getDashboardStats()).resolves.toEqual({
      message: 'Admin dashboard stats fetched successfully',
      data: {
        accounts: {
          total: 12,
          active: 7,
          banned: 2,
          unverified: 3,
        },
        subjects: {
          total: 5,
        },
        documents: {
          total: 20,
          active: 14,
          pending: 4,
          rejected: 2,
        },
      },
    });

    expect(prismaMock.accounts.count).toHaveBeenNthCalledWith(1, {
      where: {
        role: { not: UserRole.ADMIN },
        status: { not: UserStatus.DELETED },
      },
    });
    expect(prismaMock.accounts.count).toHaveBeenNthCalledWith(2, {
      where: {
        role: { not: UserRole.ADMIN },
        status: UserStatus.ACTIVE,
      },
    });
    expect(prismaMock.accounts.count).toHaveBeenNthCalledWith(3, {
      where: {
        role: { not: UserRole.ADMIN },
        status: UserStatus.BANNED,
      },
    });
    expect(prismaMock.accounts.count).toHaveBeenNthCalledWith(4, {
      where: {
        role: { not: UserRole.ADMIN },
        status: UserStatus.UNVERIFIED,
      },
    });
    expect(prismaMock.subjects.count).toHaveBeenCalledWith();
    expect(prismaMock.documents.count).toHaveBeenNthCalledWith(1, {
      where: { status: { not: DocumentStatus.DELETED } },
    });
    expect(prismaMock.documents.count).toHaveBeenNthCalledWith(2, {
      where: { status: DocumentStatus.ACTIVE },
    });
    expect(prismaMock.documents.count).toHaveBeenNthCalledWith(3, {
      where: { status: DocumentStatus.PENDING },
    });
    expect(prismaMock.documents.count).toHaveBeenNthCalledWith(4, {
      where: { status: DocumentStatus.REJECTED },
    });
  });
});
