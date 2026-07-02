import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { AuthModule } from '../auth/auth.module';
import { SubjectsModule } from '../subjects';
import { AuthGuard } from '../../common/guards/auth.guard';
import { OptionalJwtGuard } from '../../common/guards/optional-jwt.guard';

@Module({
  imports: [AuthModule, SubjectsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, AuthGuard, OptionalJwtGuard],
})
export class DocumentsModule {}
