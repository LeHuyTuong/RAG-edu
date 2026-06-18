import { Test, TestingModule } from '@nestjs/testing';
import { SubjectsService } from './subjects.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SubjectsService', () => {
  let service: SubjectsService;

  const prismaMock: any = {
    subjects: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    schools: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(SubjectsService);
  });

  it('create returns created subject when code not duplicate', async () => {
    prismaMock.subjects.findUnique.mockResolvedValue(null);
    prismaMock.schools.findFirst.mockResolvedValue({ id: 'school-1' });
    const created = { id: '507f1f77bcf86cd799439011', code: 'MATH' };
    prismaMock.subjects.create.mockResolvedValue(created);

    const res = await service.create({ code: 'MATH', name: 'Math' } as any);

    expect(prismaMock.subjects.findUnique).toHaveBeenCalled();
    expect(prismaMock.schools.findFirst).toHaveBeenCalledWith({
      where: { code: process.env.DEFAULT_SCHOOL_CODE || 'FPTU' },
      select: { id: true },
    });
    expect(prismaMock.subjects.create).toHaveBeenCalledWith({
      data: {
        code: 'MATH',
        name: 'Math',
        schoolId: 'school-1',
      },
    });
    expect(res).toEqual({
      message: 'Subject created successfully',
      data: created,
    });
  });

  it('findAll returns paginated subjects', async () => {
    const subs = [{ id: '507f1f77bcf86cd799439011' }];
    prismaMock.subjects.findMany.mockResolvedValue(subs);
    prismaMock.subjects.count.mockResolvedValue(1);

    const res = await service.findAll({} as any);

    expect(prismaMock.subjects.findMany).toHaveBeenCalled();
    expect(prismaMock.subjects.count).toHaveBeenCalled();
    expect(res.message).toBe('Subjects fetched successfully');
    expect(res.data.subjects).toEqual(subs);
  });

  it('findAll filters by schoolId when provided', async () => {
    const subs = [{ id: '507f1f77bcf86cd799439011', schoolId: 'sch1' }];
    prismaMock.subjects.findMany.mockResolvedValue(subs);
    prismaMock.subjects.count.mockResolvedValue(1);

    const res = await service.findAll({
      schoolId: 'sch1',
      page: 1,
      limit: 10,
    } as any);
    expect(prismaMock.subjects.findMany).toHaveBeenCalled();
    expect(res.data.subjects).toEqual(subs);
  });

  it('findOne returns subject when exists', async () => {
    const sub = { id: '507f1f77bcf86cd799439011', code: 'MATH' };
    prismaMock.subjects.findUnique.mockResolvedValue(sub);

    const res = await service.findOne('507f1f77bcf86cd799439011');

    expect(prismaMock.subjects.findUnique).toHaveBeenCalled();
    expect(res).toEqual({ message: 'Subject fetched successfully', data: sub });
  });

  it('update returns updated subject when exists and code not duplicate', async () => {
    const existing = { id: '507f1f77bcf86cd799439011', code: 'OLD' };
    const updated = { id: '507f1f77bcf86cd799439011', code: 'NEW' };
    prismaMock.subjects.findUnique.mockResolvedValueOnce(existing);
    prismaMock.subjects.findUnique.mockResolvedValueOnce(null);
    prismaMock.subjects.update.mockResolvedValue(updated);

    const res = await service.update('507f1f77bcf86cd799439011', {
      code: 'NEW',
    } as any);

    expect(prismaMock.subjects.findUnique).toHaveBeenCalled();
    expect(prismaMock.subjects.update).toHaveBeenCalled();
    expect(res).toEqual({
      message: 'Subject updated successfully',
      data: updated,
    });
  });

  it('delete returns success message when exists', async () => {
    prismaMock.subjects.findUnique.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
    });
    prismaMock.subjects.delete.mockResolvedValue({});

    const res = await service.delete('507f1f77bcf86cd799439011');

    expect(prismaMock.subjects.findUnique).toHaveBeenCalled();
    expect(prismaMock.subjects.delete).toHaveBeenCalled();
    expect(res).toEqual({ message: 'Subject deleted successfully' });
  });

  it('findOne throws BadRequestException for invalid id', async () => {
    await expect(service.findOne('bad-id')).rejects.toThrow();
  });

  it('findOne throws NotFoundException when missing', async () => {
    prismaMock.subjects.findUnique.mockResolvedValue(null);
    await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow();
  });

  it('create throws ConflictException when code duplicate', async () => {
    prismaMock.subjects.findUnique.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
    });
    await expect(
      service.create({ code: 'MATH', name: 'Math' } as any),
    ).rejects.toThrow();
  });

  it('update throws ConflictException when duplicate code found', async () => {
    const existing = { id: '507f1f77bcf86cd799439011', code: 'OLD' };
    prismaMock.subjects.findUnique.mockResolvedValueOnce(existing);
    prismaMock.subjects.findUnique.mockResolvedValueOnce({ id: 'other' });

    await expect(
      service.update('507f1f77bcf86cd799439011', { code: 'NEW' } as any),
    ).rejects.toThrow();
  });

  it('delete throws NotFoundException when missing', async () => {
    prismaMock.subjects.findUnique.mockResolvedValue(null);
    await expect(service.delete('507f1f77bcf86cd799439011')).rejects.toThrow();
  });

  it('findAll returns totalPages 0 when no subjects', async () => {
    prismaMock.subjects.findMany.mockResolvedValue([]);
    prismaMock.subjects.count.mockResolvedValue(0);

    const res = await service.findAll({} as any);

    expect(res.data.pagination.total).toBe(0);
    expect(res.data.pagination.totalPages).toBe(0);
  });
});
