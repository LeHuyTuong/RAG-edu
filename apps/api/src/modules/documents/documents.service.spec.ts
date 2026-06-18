import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SubjectsService } from '../subjects';
import { DocumentStatus, UserRole, UserStatus } from '@prisma/client';
import { JwtTokenType } from '../../common/enums/jwt.enum';
import { TokenPayload } from '../../common/interfaces/auth.interface';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-jti'),
}));

const createTokenPayload = (
  overrides: Partial<TokenPayload> = {},
): TokenPayload => ({
  sub: 'owner-1',
  role: UserRole.USER,
  status: UserStatus.ACTIVE,
  type: JwtTokenType.AccessToken,
  deviceId: 'device-1',
  ...overrides,
});

describe('DocumentsService', () => {
  let service: DocumentsService;

  const prismaMock: any = {
    documents: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const subjectsServiceMock = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.CLOUDINARY_CLOUD_NAME = 'demo';
    process.env.CLOUDINARY_API_KEY = 'key';
    process.env.CLOUDINARY_API_SECRET = 'secret';
    global.fetch = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: SubjectsService, useValue: subjectsServiceMock },
      ],
    }).compile();

    service = module.get(DocumentsService);
  });

  it('create returns expected response when subject exists', async () => {
    const dto = {
      title: 'T',
      subjectId: '507f1f77bcf86cd799439011',
      isPublic: false,
    } as any;
    const authorId = 'u1';
    subjectsServiceMock.findOne.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
    });
    const created = { id: '507f1f77bcf86cd799439011', title: 'T', authorId };
    prismaMock.documents.create.mockResolvedValue(created);

    const res = await service.create(dto, authorId);

    expect(prismaMock.documents.create).toHaveBeenCalled();
    expect(res).toEqual({
      message: 'Document created successfully',
      data: created,
    });
  });

  it('create throws BadRequest when subjectId provided but not found', async () => {
    const dto = {
      title: 'T',
      subjectId: '507f1f77bcf86cd799439011',
      isPublic: false,
    } as any;
    const authorId = 'u1';
    subjectsServiceMock.findOne.mockResolvedValue(null);

    await expect(service.create(dto, authorId)).rejects.toThrow();
  });

  it('create sets status to PENDING when isPublic true', async () => {
    const dto = { title: 'T', isPublic: true } as any;
    const authorId = 'u1';
    subjectsServiceMock.findOne.mockResolvedValue(null);
    const created = {
      id: '507f1f77bcf86cd799439011',
      title: 'T',
      authorId,
      status: 'PENDING',
    };
    prismaMock.documents.create.mockResolvedValue(created);

    const res = await service.create(dto, authorId);
    expect(res.data).toEqual(created);
  });

  it('findAll accepts authorId and subjectId filters without bypassing visibility', async () => {
    const docs = [{ id: '507f1f77bcf86cd799439011' }];
    prismaMock.documents.findMany.mockResolvedValue(docs);
    prismaMock.documents.count.mockResolvedValue(1);

    const res = await service.findAll({
      authorId: 'u1',
      subjectId: '507f1f77bcf86cd799439011',
      page: 2,
      limit: 5,
    } as any);

    expect(prismaMock.documents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          authorId: 'u1',
          subjectId: '507f1f77bcf86cd799439011',
          status: { not: DocumentStatus.DELETED },
          OR: [
            {
              status: DocumentStatus.ACTIVE,
              isPublic: true,
            },
          ],
        }),
      }),
    );
    expect(res.data.pagination.page).toBe(2);
  });

  it('findAll returns paginated documents response for guest', async () => {
    const docs = [{ id: '507f1f77bcf86cd799439011' }];
    prismaMock.documents.findMany.mockResolvedValue(docs);
    prismaMock.documents.count.mockResolvedValue(1);

    const res = await service.findAll({} as any);

    expect(prismaMock.documents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { not: DocumentStatus.DELETED },
          OR: [
            {
              status: DocumentStatus.ACTIVE,
              isPublic: true,
            },
          ],
        }),
        select: expect.objectContaining({
          status: true,
          isPublic: true,
          updatedAt: true,
          rejectionReason: true,
        }),
      }),
    );
    expect(prismaMock.documents.count).toHaveBeenCalled();
    expect(res.message).toBe('Documents fetched successfully');
    expect(res.data.documents).toEqual(docs);
    expect(res.data.pagination.total).toBe(1);
  });

  it('findAll uses default pagination values when page and limit are not provided', async () => {
    // Purpose: verify guest/default listing falls back to page=1 and limit=10.
    // Expected: prisma query uses skip=0 and take=10 with createdAt desc ordering.
    prismaMock.documents.findMany.mockResolvedValue([]);
    prismaMock.documents.count.mockResolvedValue(0);

    await service.findAll({} as any);

    expect(prismaMock.documents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  it('findAll keeps visibility OR constraints when combining authorId subjectId and status filters', async () => {
    // Purpose: ensure explicit filters (author/subject/status) do not bypass visibility rules.
    // Expected: where clause still includes OR visibility entries for public and owner-visible docs.
    prismaMock.documents.findMany.mockResolvedValue([]);
    prismaMock.documents.count.mockResolvedValue(0);

    await service.findAll(
      {
        authorId: 'owner-1',
        subjectId: '507f1f77bcf86cd799439011',
        status: DocumentStatus.PENDING,
      } as any,
      createTokenPayload(),
    );

    expect(prismaMock.documents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          authorId: 'owner-1',
          subjectId: '507f1f77bcf86cd799439011',
          status: {
            equals: DocumentStatus.PENDING,
            not: DocumentStatus.DELETED,
          },
          OR: expect.arrayContaining([
            { status: DocumentStatus.ACTIVE, isPublic: true },
            {
              status: DocumentStatus.PENDING,
              authorId: 'owner-1',
            },
          ]),
        }),
      }),
    );
  });

  it('findAll includes own non-deleted visible documents for logged-in user', async () => {
    prismaMock.documents.findMany.mockResolvedValue([]);
    prismaMock.documents.count.mockResolvedValue(0);

    await service.findAll({} as any, createTokenPayload());

    expect(prismaMock.documents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { not: DocumentStatus.DELETED },
          OR: expect.arrayContaining([
            {
              status: DocumentStatus.ACTIVE,
              isPublic: true,
            },
            {
              status: DocumentStatus.ACTIVE,
              isPublic: false,
              authorId: 'owner-1',
            },
            {
              status: DocumentStatus.PENDING,
              authorId: 'owner-1',
            },
            {
              status: DocumentStatus.REJECTED,
              authorId: 'owner-1',
            },
          ]),
        }),
      }),
    );
  });

  it('findAll includes all pending and rejected documents for moderator', async () => {
    prismaMock.documents.findMany.mockResolvedValue([]);
    prismaMock.documents.count.mockResolvedValue(0);

    await service.findAll(
      {} as any,
      createTokenPayload({
        sub: 'moderator-1',
        role: UserRole.MODERATOR,
      }),
    );

    expect(prismaMock.documents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { status: DocumentStatus.PENDING },
            { status: DocumentStatus.REJECTED },
          ]),
        }),
      }),
    );
  });

  it('findAll combines status filter with visibility', async () => {
    prismaMock.documents.findMany.mockResolvedValue([]);
    prismaMock.documents.count.mockResolvedValue(0);

    await service.findAll({
      status: DocumentStatus.PENDING,
      subjectId: '507f1f77bcf86cd799439011',
    } as any);

    expect(prismaMock.documents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          subjectId: '507f1f77bcf86cd799439011',
          status: {
            equals: DocumentStatus.PENDING,
            not: DocumentStatus.DELETED,
          },
          OR: [
            {
              status: DocumentStatus.ACTIVE,
              isPublic: true,
            },
          ],
        }),
      }),
    );
  });

  it('findAll keeps deleted hidden when status filter is DELETED', async () => {
    prismaMock.documents.findMany.mockResolvedValue([]);
    prismaMock.documents.count.mockResolvedValue(0);

    await service.findAll({ status: DocumentStatus.DELETED } as any);

    expect(prismaMock.documents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: {
            equals: DocumentStatus.DELETED,
            not: DocumentStatus.DELETED,
          },
        }),
      }),
    );
  });

  it('findMine returns current user non-deleted documents and ignores authorId query', async () => {
    const docs = [{ id: '507f1f77bcf86cd799439011' }];
    prismaMock.documents.findMany.mockResolvedValue(docs);
    prismaMock.documents.count.mockResolvedValue(1);

    const res = await service.findMine(
      {
        authorId: 'other-user',
        subjectId: '507f1f77bcf86cd799439011',
        status: DocumentStatus.REJECTED,
        page: 2,
        limit: 5,
      } as any,
      'owner-1',
    );

    expect(prismaMock.documents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          authorId: 'owner-1',
          subjectId: '507f1f77bcf86cd799439011',
          status: {
            equals: DocumentStatus.REJECTED,
            not: DocumentStatus.DELETED,
          },
        },
        skip: 5,
        take: 5,
        select: expect.objectContaining({
          status: true,
          isPublic: true,
          updatedAt: true,
          rejectionReason: true,
        }),
      }),
    );
    expect(res.data.documents).toEqual(docs);
    expect(res.data.pagination.page).toBe(2);
  });

  it('findMine keeps deleted hidden when status filter is DELETED', async () => {
    prismaMock.documents.findMany.mockResolvedValue([]);
    prismaMock.documents.count.mockResolvedValue(0);

    await service.findMine(
      { status: DocumentStatus.DELETED } as any,
      'owner-1',
    );

    expect(prismaMock.documents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          authorId: 'owner-1',
          status: {
            equals: DocumentStatus.DELETED,
            not: DocumentStatus.DELETED,
          },
        },
      }),
    );
  });

  it('findOne returns active public document for guest', async () => {
    // Purpose: assert document detail payload uses the expected public-detail field projection.
    // Expected: service returns success response and prisma select includes author/subject detail fields.
    const doc = { id: '507f1f77bcf86cd799439011', title: 'T' };
    prismaMock.documents.findFirst.mockResolvedValue(doc);

    const res = await service.findOne('507f1f77bcf86cd799439011');

    expect(prismaMock.documents.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: '507f1f77bcf86cd799439011',
          status: { not: DocumentStatus.DELETED },
          OR: [
            {
              status: DocumentStatus.ACTIVE,
              isPublic: true,
            },
          ],
        }),
      }),
    );
    expect(res).toEqual({
      message: 'Document fetched successfully',
      data: doc,
    });

    expect(prismaMock.documents.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          id: true,
          title: true,
          description: true,
          fileUrl: true,
          publicId: true,
          format: true,
          sizeInBytes: true,
          createdAt: true,
          author: expect.objectContaining({
            select: expect.objectContaining({
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            }),
          }),
          subject: expect.objectContaining({
            select: expect.objectContaining({
              id: true,
              name: true,
              code: true,
            }),
          }),
        }),
      }),
    );
  });

  it('findOne hides active private document from guest', async () => {
    // Purpose: prevent guest users from seeing private document details.
    // Expected: a NotFound-style response path with the document-not-found message.
    prismaMock.documents.findFirst.mockResolvedValue(null);

    await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow();
    await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(
      'Document with ID 507f1f77bcf86cd799439011 not found',
    );
  });

  it('findOne allows owner to view active private document', async () => {
    const doc = { id: '507f1f77bcf86cd799439011', title: 'Private' };
    prismaMock.documents.findFirst.mockResolvedValue(doc);

    const res = await service.findOne(
      '507f1f77bcf86cd799439011',
      createTokenPayload(),
    );

    expect(prismaMock.documents.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            {
              status: DocumentStatus.ACTIVE,
              isPublic: false,
              authorId: 'owner-1',
            },
          ]),
        }),
      }),
    );
    expect(res.data).toEqual(doc);
  });

  it('findOne hides active private document from unrelated logged-in user', async () => {
    prismaMock.documents.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne('507f1f77bcf86cd799439011', {
        ...createTokenPayload({
          sub: 'other-user',
        }),
      }),
    ).rejects.toThrow();
  });

  it('findOne allows owner to view pending document', async () => {
    const doc = {
      id: '507f1f77bcf86cd799439011',
      status: DocumentStatus.PENDING,
    };
    prismaMock.documents.findFirst.mockResolvedValue(doc);

    const res = await service.findOne(
      '507f1f77bcf86cd799439011',
      createTokenPayload(),
    );

    expect(prismaMock.documents.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            {
              status: DocumentStatus.PENDING,
              authorId: 'owner-1',
            },
          ]),
        }),
      }),
    );
    expect(res.data).toEqual(doc);
  });

  it('findOne allows moderator to view any pending document', async () => {
    const doc = {
      id: '507f1f77bcf86cd799439011',
      status: DocumentStatus.PENDING,
    };
    prismaMock.documents.findFirst.mockResolvedValue(doc);

    const res = await service.findOne(
      '507f1f77bcf86cd799439011',
      createTokenPayload({
        sub: 'moderator-1',
        role: UserRole.MODERATOR,
      }),
    );

    expect(prismaMock.documents.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([{ status: DocumentStatus.PENDING }]),
        }),
      }),
    );
    expect(res.data).toEqual(doc);
  });

  it('findOne hides pending document from unrelated logged-in user', async () => {
    prismaMock.documents.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne('507f1f77bcf86cd799439011', {
        ...createTokenPayload({
          sub: 'other-user',
        }),
      }),
    ).rejects.toThrow();
  });

  it('findOne allows owner to view rejected document', async () => {
    const doc = {
      id: '507f1f77bcf86cd799439011',
      status: DocumentStatus.REJECTED,
    };
    prismaMock.documents.findFirst.mockResolvedValue(doc);

    const res = await service.findOne(
      '507f1f77bcf86cd799439011',
      createTokenPayload(),
    );

    expect(prismaMock.documents.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            {
              status: DocumentStatus.REJECTED,
              authorId: 'owner-1',
            },
          ]),
        }),
      }),
    );
    expect(res.data).toEqual(doc);
  });

  it('findOne allows moderator to view rejected document', async () => {
    const doc = {
      id: '507f1f77bcf86cd799439011',
      status: DocumentStatus.REJECTED,
    };
    prismaMock.documents.findFirst.mockResolvedValue(doc);

    const res = await service.findOne(
      '507f1f77bcf86cd799439011',
      createTokenPayload({
        sub: 'moderator-1',
        role: UserRole.MODERATOR,
      }),
    );

    expect(prismaMock.documents.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([{ status: DocumentStatus.REJECTED }]),
        }),
      }),
    );
    expect(res.data).toEqual(doc);
  });

  it('findOne hides rejected document from guest', async () => {
    prismaMock.documents.findFirst.mockResolvedValue(null);

    await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow();
  });

  it('findOne hides deleted document from everyone', async () => {
    prismaMock.documents.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne('507f1f77bcf86cd799439011', {
        ...createTokenPayload({
          sub: 'moderator-1',
          role: UserRole.MODERATOR,
        }),
      }),
    ).rejects.toThrow();
    expect(prismaMock.documents.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { not: DocumentStatus.DELETED },
        }),
      }),
    );
  });

  it('update returns updated document when author matches', async () => {
    const existing = {
      id: '507f1f77bcf86cd799439011',
      authorId: 'u1',
      status: DocumentStatus.ACTIVE,
      isPublic: false,
    };
    const updated = { id: '507f1f77bcf86cd799439011', title: 'Updated' };
    prismaMock.documents.findUnique.mockResolvedValueOnce(existing);
    prismaMock.documents.update.mockResolvedValue(updated);

    const res = await service.update(
      '507f1f77bcf86cd799439011',
      { title: 'Updated' } as any,
      'u1',
    );

    expect(prismaMock.documents.findUnique).toHaveBeenCalled();
    expect(prismaMock.documents.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: 'Updated' },
      }),
    );
    expect(res).toEqual({
      message: 'Document updated successfully',
      data: updated,
    });
  });

  it('update sets status to PENDING when author publishes a private document', async () => {
    const existing = {
      id: '507f1f77bcf86cd799439011',
      authorId: 'u1',
      status: DocumentStatus.ACTIVE,
      isPublic: false,
    };
    const updated = {
      id: '507f1f77bcf86cd799439011',
      isPublic: true,
      status: DocumentStatus.PENDING,
    };
    prismaMock.documents.findUnique.mockResolvedValueOnce(existing);
    prismaMock.documents.update.mockResolvedValue(updated);

    await service.update(
      '507f1f77bcf86cd799439011',
      { isPublic: true } as any,
      'u1',
    );

    expect(prismaMock.documents.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          isPublic: true,
          status: DocumentStatus.PENDING,
        },
      }),
    );
  });

  it('update preserves status when isPublic does not change from private to public', async () => {
    const existing = {
      id: '507f1f77bcf86cd799439011',
      authorId: 'u1',
      status: DocumentStatus.PENDING,
      isPublic: true,
    };
    const updated = { id: '507f1f77bcf86cd799439011', title: 'Updated' };
    prismaMock.documents.findUnique.mockResolvedValueOnce(existing);
    prismaMock.documents.update.mockResolvedValue(updated);

    await service.update(
      '507f1f77bcf86cd799439011',
      { title: 'Updated', isPublic: true } as any,
      'u1',
    );

    expect(prismaMock.documents.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: 'Updated', isPublic: true },
      }),
    );
  });

  it('update resets pending review to active when author makes a pending public document private', async () => {
    const existing = {
      id: '507f1f77bcf86cd799439011',
      authorId: 'u1',
      status: DocumentStatus.PENDING,
      isPublic: true,
    };
    const updated = {
      id: '507f1f77bcf86cd799439011',
      isPublic: false,
      status: DocumentStatus.ACTIVE,
    };
    prismaMock.documents.findUnique.mockResolvedValueOnce(existing);
    prismaMock.documents.update.mockResolvedValue(updated);

    await service.update(
      '507f1f77bcf86cd799439011',
      { isPublic: false } as any,
      'u1',
    );

    expect(prismaMock.documents.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          isPublic: false,
          status: DocumentStatus.ACTIVE,
        },
      }),
    );
  });

  it('approve activates a pending document and persists reviewer metadata', async () => {
    const existing = {
      id: '507f1f77bcf86cd799439011',
      authorId: 'u1',
      status: DocumentStatus.PENDING,
      isPublic: true,
    };
    const approved = {
      id: '507f1f77bcf86cd799439011',
      status: DocumentStatus.ACTIVE,
      reviewedById: 'moderator-1',
    };
    prismaMock.documents.findUnique.mockResolvedValueOnce(existing);
    prismaMock.documents.update.mockResolvedValue(approved);

    const res = await service.approve(
      '507f1f77bcf86cd799439011',
      'moderator-1',
    );

    expect(prismaMock.documents.findUnique).toHaveBeenCalledWith({
      where: {
        id: '507f1f77bcf86cd799439011',
        status: { not: DocumentStatus.DELETED },
      },
    });
    expect(prismaMock.documents.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '507f1f77bcf86cd799439011' },
        data: expect.objectContaining({
          status: DocumentStatus.ACTIVE,
          reviewedById: 'moderator-1',
          reviewedAt: expect.any(Date),
          rejectionReason: null,
        }),
      }),
    );
    expect(res).toEqual({
      message: 'Document approved successfully',
      data: approved,
    });
  });

  it('reject marks a pending document rejected and stores rejection reason', async () => {
    const existing = {
      id: '507f1f77bcf86cd799439011',
      authorId: 'u1',
      status: DocumentStatus.PENDING,
      isPublic: true,
    };
    const rejected = {
      id: '507f1f77bcf86cd799439011',
      status: DocumentStatus.REJECTED,
      reviewedById: 'moderator-1',
      rejectionReason: 'Thiếu mô tả rõ ràng.',
    };
    prismaMock.documents.findUnique.mockResolvedValueOnce(existing);
    prismaMock.documents.update.mockResolvedValue(rejected);

    const res = await service.reject(
      '507f1f77bcf86cd799439011',
      { rejectionReason: 'Thiếu mô tả rõ ràng.' },
      'moderator-1',
    );

    expect(prismaMock.documents.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '507f1f77bcf86cd799439011' },
        data: expect.objectContaining({
          status: DocumentStatus.REJECTED,
          reviewedById: 'moderator-1',
          reviewedAt: expect.any(Date),
          rejectionReason: 'Thiếu mô tả rõ ràng.',
        }),
      }),
    );
    expect(res).toEqual({
      message: 'Document rejected successfully',
      data: rejected,
    });
  });

  it('approve throws NotFoundException when document is missing or deleted', async () => {
    prismaMock.documents.findUnique.mockResolvedValue(null);

    await expect(
      service.approve('507f1f77bcf86cd799439011', 'moderator-1'),
    ).rejects.toThrow();

    expect(prismaMock.documents.update).not.toHaveBeenCalled();
  });

  it('reject throws NotFoundException when document is missing or deleted', async () => {
    prismaMock.documents.findUnique.mockResolvedValue(null);

    await expect(
      service.reject(
        '507f1f77bcf86cd799439011',
        { rejectionReason: 'Không hợp lệ.' },
        'moderator-1',
      ),
    ).rejects.toThrow();

    expect(prismaMock.documents.update).not.toHaveBeenCalled();
  });

  it('approve throws BadRequestException when document is not pending', async () => {
    prismaMock.documents.findUnique.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      status: DocumentStatus.ACTIVE,
    });

    await expect(
      service.approve('507f1f77bcf86cd799439011', 'moderator-1'),
    ).rejects.toThrow();

    expect(prismaMock.documents.update).not.toHaveBeenCalled();
  });

  it('reject throws BadRequestException when document is not pending', async () => {
    prismaMock.documents.findUnique.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      status: DocumentStatus.REJECTED,
    });

    await expect(
      service.reject(
        '507f1f77bcf86cd799439011',
        { rejectionReason: 'Không hợp lệ.' },
        'moderator-1',
      ),
    ).rejects.toThrow();

    expect(prismaMock.documents.update).not.toHaveBeenCalled();
  });

  it('delete returns success message when author matches', async () => {
    const existing = {
      id: '507f1f77bcf86cd799439011',
      authorId: 'u1',
      publicId: 'docs/sample',
      resourceType: 'image',
      status: DocumentStatus.ACTIVE,
    };
    prismaMock.documents.findUnique.mockResolvedValue(existing);
    prismaMock.documents.delete.mockResolvedValue({});
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'ok' }),
    });

    const res = await service.delete('507f1f77bcf86cd799439011', 'u1');

    expect(prismaMock.documents.findUnique).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalled();
    expect(prismaMock.documents.delete).toHaveBeenCalled();
    expect(res).toEqual({ message: 'Document deleted successfully' });
  });

  it('findOne throws BadRequestException for invalid id', async () => {
    await expect(service.findOne('bad-id')).rejects.toThrow();
  });

  it('update throws NotFoundException when document missing', async () => {
    prismaMock.documents.findUnique.mockResolvedValue(null);

    await expect(
      service.update('507f1f77bcf86cd799439011', { title: 'X' } as any, 'u1'),
    ).rejects.toThrow();
  });

  it('update throws ForbiddenException when non-author', async () => {
    const existing = {
      id: '507f1f77bcf86cd799439011',
      authorId: 'other',
      publicId: 'docs/sample',
      resourceType: 'image',
      status: DocumentStatus.ACTIVE,
    };
    prismaMock.documents.findUnique.mockResolvedValueOnce(existing);

    await expect(
      service.update('507f1f77bcf86cd799439011', { title: 'X' } as any, 'u1'),
    ).rejects.toThrow();
  });

  it('delete throws NotFoundException when document missing', async () => {
    prismaMock.documents.findUnique.mockResolvedValue(null);

    await expect(
      service.delete('507f1f77bcf86cd799439011', 'u1'),
    ).rejects.toThrow();
  });

  it('delete throws ForbiddenException when non-author', async () => {
    const existing = {
      id: '507f1f77bcf86cd799439011',
      authorId: 'other',
      status: DocumentStatus.ACTIVE,
    };
    prismaMock.documents.findUnique.mockResolvedValue(existing);

    await expect(
      service.delete('507f1f77bcf86cd799439011', 'u1'),
    ).rejects.toThrow();
  });

  it('update throws BadRequest when subjectId provided but subject missing', async () => {
    // subjectsService returns null -> should throw BadRequest before fetching document
    const dto = { subjectId: '507f1f77bcf86cd799439012' } as any;
    subjectsServiceMock.findOne.mockResolvedValue(null);

    await expect(
      service.update('507f1f77bcf86cd799439011', dto, 'u1'),
    ).rejects.toThrow();
  });

  it('findAll handles zero total and calculates totalPages as 0', async () => {
    prismaMock.documents.findMany.mockResolvedValue([]);
    prismaMock.documents.count.mockResolvedValue(0);

    const res = await service.findAll({} as any);

    expect(res.data.pagination.total).toBe(0);
    expect(res.data.pagination.totalPages).toBe(0);
  });
});
