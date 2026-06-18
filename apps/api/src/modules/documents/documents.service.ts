import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { DocumentStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  ListDocumentsQueryDto,
  RejectDocumentDto,
} from './dto';
import { SubjectsService } from '../subjects';
import { TokenPayload } from '../../common/interfaces/auth.interface';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly subjectsService: SubjectsService,
  ) {}

  private readonly cloudinaryCloudName =
    process.env.CLOUDINARY_CLOUD_NAME ?? '';
  private readonly cloudinaryApiKey = process.env.CLOUDINARY_API_KEY ?? '';
  private readonly cloudinaryApiSecret =
    process.env.CLOUDINARY_API_SECRET ?? '';

  private readonly listDocumentSelect = {
    id: true,
    title: true,
    publicId: true,
    status: true,
    isPublic: true,
    createdAt: true,
    updatedAt: true,
    rejectionReason: true,
    author: {
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
    },
    subject: {
      select: {
        id: true,
        name: true,
        code: true,
      },
    },
  } satisfies Prisma.documentsSelect;

  private buildVisibleDocumentFilters(user?: TokenPayload) {
    const visibilityFilters: Prisma.documentsWhereInput[] = [
      {
        status: DocumentStatus.ACTIVE,
        isPublic: true,
      },
    ];

    if (!user) {
      return visibilityFilters;
    }

    visibilityFilters.push(
      {
        status: DocumentStatus.ACTIVE,
        isPublic: false,
        authorId: user.sub,
      },
      {
        status: DocumentStatus.PENDING,
        authorId: user.sub,
      },
      {
        status: DocumentStatus.REJECTED,
        authorId: user.sub,
      },
    );

    if (user.role === UserRole.MODERATOR) {
      visibilityFilters.push(
        { status: DocumentStatus.PENDING },
        { status: DocumentStatus.REJECTED },
      );
    }

    return visibilityFilters;
  }

  private async findReviewableDocument(id: string) {
    const existingDocument = await this.prismaService.documents.findUnique({
      where: {
        id,
        status: {
          not: DocumentStatus.DELETED,
        },
      },
    });

    if (!existingDocument) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (existingDocument.status !== DocumentStatus.PENDING) {
      throw new BadRequestException('Only pending documents can be reviewed');
    }

    return existingDocument;
  }

  private async destroyCloudinaryAsset(document: {
    publicId: string;
    resourceType: string;
  }) {
    if (
      !this.cloudinaryCloudName ||
      !this.cloudinaryApiKey ||
      !this.cloudinaryApiSecret
    ) {
      this.logger.warn(
        `Skipping Cloudinary destroy for ${document.publicId}: missing server credentials`,
      );
      return;
    }

    const candidates = Array.from(
      new Set([document.resourceType, 'image', 'raw', 'video'].filter(Boolean)),
    );

    this.logger.log(
      `Starting Cloudinary destroy for document=${document.publicId}, resourceType=${document.resourceType}, candidates=${candidates.join(',')}`,
    );

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHash('sha1')
      .update(
        `public_id=${document.publicId}&timestamp=${timestamp}${this.cloudinaryApiSecret}`,
      )
      .digest('hex');

    const readResponseBody = async (response: Response) => {
      if (typeof response.text === 'function') {
        return response.text();
      }

      if (typeof response.json === 'function') {
        try {
          const data = await response.json();
          return JSON.stringify(data);
        } catch {
          return '';
        }
      }

      return '';
    };

    for (const resourceType of candidates) {
      const formData = new FormData();
      formData.append('public_id', document.publicId);
      formData.append('timestamp', timestamp);
      formData.append('api_key', this.cloudinaryApiKey);
      formData.append('signature', signature);

      const url = `https://api.cloudinary.com/v1_1/${this.cloudinaryCloudName}/${resourceType}/destroy`;
      this.logger.log(
        `Cloudinary destroy request: url=${url}, publicId=${document.publicId}, resourceType=${resourceType}`,
      );

      try {
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
        });

        const bodyText = await readResponseBody(response as Response);
        this.logger.log(
          `Cloudinary destroy response: status=${response.status}, ok=${response.ok}, resourceType=${resourceType}, body=${bodyText}`,
        );

        if (!response.ok) {
          continue;
        }

        let parsed: { result?: string } = {};
        try {
          parsed = bodyText
            ? (JSON.parse(bodyText) as { result?: string })
            : {};
        } catch {
          this.logger.warn(
            `Cloudinary destroy response was not JSON for publicId=${document.publicId}, resourceType=${resourceType}`,
          );
        }

        if (parsed.result === 'ok' || parsed.result === 'not found') {
          this.logger.log(
            `Cloudinary destroy completed for publicId=${document.publicId}, resourceType=${resourceType}, result=${parsed.result}`,
          );
          return;
        }

        this.logger.warn(
          `Cloudinary destroy returned unexpected result for publicId=${document.publicId}, resourceType=${resourceType}, result=${parsed.result ?? 'unknown'}`,
        );
      } catch (error) {
        this.logger.error(
          `Cloudinary destroy threw for publicId=${document.publicId}, resourceType=${resourceType}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    this.logger.warn(
      `Cloudinary destroy exhausted all candidates for publicId=${document.publicId}. The DB record will still be deleted.`,
    );
  }

  async create(createDocumentDto: CreateDocumentDto, authorId: string) {
    if (createDocumentDto.subjectId) {
      const subject = await this.subjectsService.findOne(
        createDocumentDto.subjectId,
      );
      if (!subject) {
        throw new BadRequestException(
          `Subject with ID ${createDocumentDto.subjectId} does not exist`,
        );
      }
    }

    const document = await this.prismaService.documents.create({
      data: {
        ...createDocumentDto,
        authorId,
        status: createDocumentDto.isPublic
          ? DocumentStatus.PENDING
          : DocumentStatus.ACTIVE,
      },
      include: {
        author: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      message: 'Document created successfully',
      data: document,
    };
  }

  async findAll(query: ListDocumentsQueryDto, user?: TokenPayload) {
    const { page = 1, limit = 10, authorId, subjectId, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.documentsWhereInput = {
      status: {
        not: DocumentStatus.DELETED,
      },
      OR: this.buildVisibleDocumentFilters(user),
    };

    if (authorId) {
      where.authorId = authorId;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (status) {
      where.status = {
        equals: status,
        not: DocumentStatus.DELETED,
      };
    }

    const [documents, total] = await Promise.all([
      this.prismaService.documents.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.listDocumentSelect,
      }),
      this.prismaService.documents.count({ where }),
    ]);

    return {
      message: 'Documents fetched successfully',
      data: {
        documents: documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async findMine(query: ListDocumentsQueryDto, userId: string) {
    const { page = 1, limit = 10, subjectId, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.documentsWhereInput = {
      authorId: userId,
      status: {
        not: DocumentStatus.DELETED,
      },
    };

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (status) {
      where.status = {
        equals: status,
        not: DocumentStatus.DELETED,
      };
    }

    const [documents, total] = await Promise.all([
      this.prismaService.documents.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.listDocumentSelect,
      }),
      this.prismaService.documents.count({ where }),
    ]);

    return {
      message: 'Documents fetched successfully',
      data: {
        documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async findOne(id: string, user?: TokenPayload) {
    const document = await this.prismaService.documents.findFirst({
      where: {
        id,
        status: {
          not: DocumentStatus.DELETED,
        },
        OR: this.buildVisibleDocumentFilters(user),
      },
      select: {
        id: true,
        title: true,
        description: true,
        fileUrl: true,
        publicId: true,
        format: true,
        sizeInBytes: true,
        status: true,
        isPublic: true,
        reviewedById: true,
        reviewedAt: true,
        rejectionReason: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return {
      message: 'Document fetched successfully',
      data: document,
    };
  }

  async update(
    id: string,
    updateDocumentDto: UpdateDocumentDto,
    userId: string,
  ) {
    if (updateDocumentDto.subjectId) {
      const subject = await this.subjectsService.findOne(
        updateDocumentDto.subjectId,
      );

      if (!subject) {
        throw new BadRequestException(
          `Subject with ID ${updateDocumentDto.subjectId} does not exist`,
        );
      }
    }
    const existingDocument = await this.prismaService.documents.findUnique({
      where: {
        id,
        status: {
          not: DocumentStatus.DELETED,
        },
      },
    });

    if (!existingDocument) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (existingDocument.authorId !== userId) {
      throw new ForbiddenException(
        'Only the document author can update this document',
      );
    }

    const shouldQueueForReview =
      existingDocument.isPublic === false &&
      updateDocumentDto.isPublic === true;
    const shouldCancelReview =
      existingDocument.status === DocumentStatus.PENDING &&
      existingDocument.isPublic === true &&
      updateDocumentDto.isPublic === false;

    const document = await this.prismaService.documents.update({
      where: { id },
      data: {
        ...updateDocumentDto,
        ...(shouldQueueForReview ? { status: DocumentStatus.PENDING } : {}),
        ...(shouldCancelReview ? { status: DocumentStatus.ACTIVE } : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        subject: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    return {
      message: 'Document updated successfully',
      data: document,
    };
  }

  async approve(id: string, reviewerId: string) {
    await this.findReviewableDocument(id);

    const document = await this.prismaService.documents.update({
      where: { id },
      data: {
        status: DocumentStatus.ACTIVE,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return {
      message: 'Document approved successfully',
      data: document,
    };
  }

  async reject(
    id: string,
    rejectDocumentDto: RejectDocumentDto,
    reviewerId: string,
  ) {
    await this.findReviewableDocument(id);

    const document = await this.prismaService.documents.update({
      where: { id },
      data: {
        status: DocumentStatus.REJECTED,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: rejectDocumentDto.rejectionReason,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return {
      message: 'Document rejected successfully',
      data: document,
    };
  }

  async delete(id: string, userId: string) {
    const existingDocument = await this.prismaService.documents.findUnique({
      where: {
        id,
        status: {
          not: DocumentStatus.DELETED,
        },
      },
      select: {
        id: true,
        authorId: true,
        publicId: true,
        resourceType: true,
      },
    });

    if (!existingDocument) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (existingDocument.authorId !== userId) {
      throw new ForbiddenException(
        'Only the document author can delete this document',
      );
    }

    await this.destroyCloudinaryAsset(existingDocument);

    await this.prismaService.documents.delete({
      where: { id },
    });

    return {
      message: 'Document deleted successfully',
    };
  }
}
