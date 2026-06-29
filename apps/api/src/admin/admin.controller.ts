import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@bpexch/shared';
import { AuditService } from '../audit/audit.service';
import { WalletService } from '../wallet/wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { RolesGuard } from '../auth/roles.guard';
import { RequirePermission } from '../auth/permission.decorator';
import { Roles } from '../auth/roles.decorator';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminController {
  constructor(
    private audit: AuditService,
    private wallet: WalletService,
    private prisma: PrismaService,
  ) {}

  @Get('audit')
  @RequirePermission('VIEW_AUDIT')
  auditLogs() {
    return this.audit.findRecent(100);
  }

  @Get('withdrawals/pending')
  @RequirePermission('APPROVE_WITHDRAWAL')
  pendingWithdrawals() {
    return this.wallet.listPendingWithdrawals();
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  async stats() {
    const [users, bets, withdrawals, totalBalance] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.bet.count(),
      this.prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.wallet.aggregate({ _sum: { balance: true } }),
    ]);
    return {
      users,
      bets,
      pendingWithdrawals: withdrawals,
      totalBalance: Number(totalBalance._sum.balance || 0),
    };
  }

  @Get('settings')
  @Roles(UserRole.SUPER_ADMIN)
  settings() {
    return this.prisma.platformSetting.findMany();
  }
}
