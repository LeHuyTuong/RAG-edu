import {
  Controller,
  Get,
  Param,
  Query,
  Version,
  UseGuards,
} from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { ListSubjectsQueryDto } from './dto';
import { Public } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Version('1')
  @Public()
  @Get()
  findAll(@Query() query: ListSubjectsQueryDto) {
    return this.subjectsService.findAll(query);
  }

  @Version('1')
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }
}
