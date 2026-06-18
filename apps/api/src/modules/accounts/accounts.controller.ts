import {
  Controller,
  Body,
  Patch,
  Param,
  Delete,
  Get,
  Version,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { AccountsService } from './accounts.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ParseMongoIdPipe } from '../../common/pipes/parse-mongoid.pipe';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { TokenPayload } from '../../common/interfaces/auth.interface';
import { User } from '../../common/decorators';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR)
  @Version('1')
  @Get('me')
  findMe(@User() user: TokenPayload) {
    return this.accountsService.findMe(user.sub);
  }

  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR)
  @Version('1')
  @Patch(':id')
  update(
    @Param('id', new ParseMongoIdPipe()) id: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @User() user: TokenPayload,
  ) {
    return this.accountsService.update(id, updateAccountDto, user.sub);
  }

  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR)
  @Version('1')
  @Delete(':id')
  remove(
    @Param('id', new ParseMongoIdPipe()) id: string,
    @User() user: TokenPayload,
  ) {
    return this.accountsService.remove(id, user.sub);
  }
}
