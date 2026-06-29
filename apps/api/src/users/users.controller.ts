import { Controller, Post, Get, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@bpexch/shared';
import { UsersService } from './users.service';
import { CreateUserDto } from './users.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RequirePermission } from '../auth/permission.decorator';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Post()
  @RequirePermission('CREATE_USER')
  create(@CurrentUser() actor: { id: string; role: UserRole }, @Body() dto: CreateUserDto) {
    return this.users.create(actor, dto);
  }

  @Get('downline')
  @RequirePermission('VIEW_DOWNLINE')
  downline(
    @CurrentUser() actor: { id: string; role: UserRole },
    @Query('depth') depth?: string,
  ) {
    return this.users.getDownline(actor.id, actor.role, depth ? parseInt(depth, 10) : -1);
  }

  @Get('hierarchy')
  @RequirePermission('VIEW_DOWNLINE')
  hierarchy(@CurrentUser() actor: { id: string; role: UserRole }) {
    return this.users.getHierarchyTree(actor.id);
  }
}
