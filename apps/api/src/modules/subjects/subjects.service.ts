import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { validateMongoDbId } from '../../common/utils/mongodb.utils';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  ListSubjectsQueryDto,
} from './dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createSubjectDto: CreateSubjectDto) {
    const existingSubject = await this.prismaService.subjects.findUnique({
      where: { code: createSubjectDto.code },
    });

    if (existingSubject) {
      throw new ConflictException(
        `Subject with code ${createSubjectDto.code} already exists`,
      );
    }

    // For mvp we will hardcode the schoolId to the default school
    const hardCodedSchoolId = await this.prismaService.schools.findFirst({
      where: { code: process.env.DEFAULT_SCHOOL_CODE || 'FPTU' },
      select: { id: true },
    });

    if (!hardCodedSchoolId) {
      throw new NotFoundException(
        `Default school with code ${process.env.DEFAULT_SCHOOL_CODE || 'FPTU'} not found`,
      );
    }

    const subject = await this.prismaService.subjects.create({
      data: {
        ...createSubjectDto,
        schoolId: hardCodedSchoolId!.id,
      },
    });

    return {
      message: 'Subject created successfully',
      data: subject,
    };
  }

  async findAll(query: ListSubjectsQueryDto) {
    const { page = 1, limit = 10, schoolId, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [subjects, total] = await Promise.all([
      this.prismaService.subjects.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.subjects.count({ where }),
    ]);

    return {
      message: 'Subjects fetched successfully',
      data: {
        subjects,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async findOne(id: string) {
    validateMongoDbId(id, 'Subject ID');

    const subject = await this.prismaService.subjects.findUnique({
      where: { id },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    return {
      message: 'Subject fetched successfully',
      data: subject,
    };
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto) {
    validateMongoDbId(id, 'Subject ID');

    const existingSubject = await this.prismaService.subjects.findUnique({
      where: { id },
    });

    if (!existingSubject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    if (
      updateSubjectDto.code &&
      updateSubjectDto.code !== existingSubject.code
    ) {
      const duplicateCode = await this.prismaService.subjects.findUnique({
        where: { code: updateSubjectDto.code },
      });

      if (duplicateCode) {
        throw new ConflictException(
          `Subject with code ${updateSubjectDto.code} already exists`,
        );
      }
    }

    const subject = await this.prismaService.subjects.update({
      where: { id },
      data: updateSubjectDto,
    });

    return {
      message: 'Subject updated successfully',
      data: subject,
    };
  }

  async delete(id: string) {
    validateMongoDbId(id, 'Subject ID');

    const existingSubject = await this.prismaService.subjects.findUnique({
      where: { id },
    });

    if (!existingSubject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    await this.prismaService.subjects.delete({
      where: { id },
    });

    return {
      message: 'Subject deleted successfully',
    };
  }
}
