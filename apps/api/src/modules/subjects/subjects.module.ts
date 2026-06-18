import { Module } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { AuthModule } from '../auth/auth.module';
import { AuthGuard } from '../../common/guards/auth.guard';

@Module({
  imports: [AuthModule],
  controllers: [SubjectsController],
  providers: [SubjectsService, AuthGuard],
  exports: [SubjectsService],
})
export class SubjectsModule {}
