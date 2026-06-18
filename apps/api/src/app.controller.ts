import { Controller, Get, Version } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  checkHealth(): string {
    return 'Im alive!';
  }
}
