import { Controller, Get, Post, Body, UseGuards, Query, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@bpexch/shared';
import { WalletService } from './wallet.service';
import { CreditWalletDto, WithdrawalRequestDto, DepositRequestDto, ApproveWithdrawalDto } from './wallet.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RequirePermission } from '../auth/permission.decorator';

@Controller('wallet')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class WalletController {
  constructor(private wallet: WalletService) {}

  @Get('balance')
  balance(@CurrentUser() user: { id: string }) {
    return this.wallet.getBalance(user.id);
  }

  @Get('statement')
  statement(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.wallet.getStatement(user.id, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 50);
  }

  @Post('credit')
  @RequirePermission('CREDIT_WALLET')
  credit(@CurrentUser() actor: { id: string; role: UserRole }, @Body() dto: CreditWalletDto) {
    return this.wallet.credit(actor, dto.userId, dto.amount, dto.note, dto.idempotencyKey);
  }

  @Post('withdraw')
  @RequirePermission('REQUEST_WITHDRAWAL')
  withdraw(@CurrentUser() user: { id: string }, @Body() dto: WithdrawalRequestDto) {
    return this.wallet.requestWithdrawal(user.id, dto.amount, dto.paymentMethod, dto.accountDetails);
  }

  @Post('deposit-request')
  @RequirePermission('REQUEST_WITHDRAWAL')
  depositRequest(@CurrentUser() user: { id: string }, @Body() dto: DepositRequestDto) {
    return this.wallet.requestDeposit(user.id, dto.amount, dto.paymentMethod, dto.reference);
  }

  @Get('withdrawals/pending')
  @RequirePermission('APPROVE_WITHDRAWAL')
  pendingWithdrawals() {
    return this.wallet.listPendingWithdrawals();
  }

  @Post('withdrawals/approve')
  @RequirePermission('APPROVE_WITHDRAWAL')
  approveWithdrawal(@CurrentUser() actor: { id: string }, @Body() dto: ApproveWithdrawalDto) {
    return this.wallet.approveWithdrawal(actor.id, dto.withdrawalId, dto.approve, dto.note);
  }

  @Post('deposits/:id/approve')
  @RequirePermission('CREDIT_WALLET')
  approveDeposit(@CurrentUser() actor: { id: string }, @Param('id') id: string) {
    return this.wallet.approveDeposit(actor.id, id);
  }
}
