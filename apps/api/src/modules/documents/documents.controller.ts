import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Version,
  UseGuards,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  ListDocumentsQueryDto,
  RejectDocumentDto,
} from './dto';
import { Public } from '../../common/decorators/public.decorator';
import { OptionalJwtGuard } from '../../common/guards/optional-jwt.guard';
import { ParseMongoIdPipe } from '../../common/pipes/parse-mongoid.pipe';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { VerifiedAccountGuard } from '../../common/guards/verified-account.guard';
import { TokenPayload } from '../../common/interfaces/auth.interface';
import { Roles, User } from '../../common/decorators';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Version('1')
  @UseGuards(JwtAuthGuard, VerifiedAccountGuard)
  @Post()
  create(
    @Body() createDocumentDto: CreateDocumentDto,
    @User() user: TokenPayload,
  ) {
    return this.documentsService.create(createDocumentDto, user.sub);
  }

  @Version('1')
  @Public()
  @Get()
  @UseGuards(OptionalJwtGuard)
  findAll(@Query() query: ListDocumentsQueryDto, @User() user?: TokenPayload) {
    return this.documentsService.findAll(query, user);
  }

  @Version('1')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMine(@Query() query: ListDocumentsQueryDto, @User() user: TokenPayload) {
    return this.documentsService.findMine(query, user.sub);
  }

  @Version('1')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MODERATOR', 'ADMIN')
  @Post(':id/approve')
  approve(
    @Param('id', new ParseMongoIdPipe()) id: string,
    @User() user: TokenPayload,
  ) {
    return this.documentsService.approve(id, user.sub);
  }

  @Version('1')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MODERATOR', 'ADMIN')
  @Post(':id/reject')
  reject(
    @Param('id', new ParseMongoIdPipe()) id: string,
    @Body() rejectDocumentDto: RejectDocumentDto,
    @User() user: TokenPayload,
  ) {
    return this.documentsService.reject(id, rejectDocumentDto, user.sub);
  }

  @Version('1')
  @Public()
  @UseGuards(OptionalJwtGuard)
  @Get(':id')
  findOne(
    @Param('id', new ParseMongoIdPipe()) id: string,
    @User() user?: TokenPayload,
  ) {
    return this.documentsService.findOne(id, user);
  }

  @Version('1')
  @UseGuards(JwtAuthGuard, VerifiedAccountGuard)
  @Patch(':id')
  update(
    @Param('id', new ParseMongoIdPipe()) id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @User() user: TokenPayload,
  ) {
    return this.documentsService.update(id, updateDocumentDto, user.sub);
  }

  @Version('1')
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id', new ParseMongoIdPipe()) id: string,
    @User() user: TokenPayload,
  ) {
    return this.documentsService.delete(id, user.sub);
  }
}
