import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ParseMongoIdPipe } from '../../common/pipes/parse-mongoid.pipe';
import { AccountsService } from '../accounts/accounts.service';
import { CreateAccountDto } from '../accounts/dto/create-account.dto';
import { ListAccountsQueryDto } from '../accounts/dto/list-accounts-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounts')
export class AdminAccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Roles(UserRole.ADMIN)
  @Version('1')
  @Post()
  create(@Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.createModerator(createAccountDto);
  }

  @Roles(UserRole.ADMIN)
  @Version('1')
  @Get()
  findAll(@Query() query: ListAccountsQueryDto) {
    return this.accountsService.findAll(query);
  }

  @Roles(UserRole.ADMIN)
  @Version('1')
  @Get(':id')
  findOne(@Param('id', new ParseMongoIdPipe()) id: string) {
    return this.accountsService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Version('1')
  @Patch(':accountId/ban')
  ban(@Param('accountId', new ParseMongoIdPipe()) accountId: string) {
    return this.accountsService.ban(accountId);
  }
}
