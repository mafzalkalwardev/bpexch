import { Controller, Post, Body, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentWebhookDto } from './payments.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post('webhook/deposit')
  depositWebhook(@Body() dto: PaymentWebhookDto) {
    return this.payments.handleDepositWebhook(dto);
  }

  @Post('withdrawals/:id/payout')
  initiatePayout(@Param('id') id: string, @Body('provider') provider: string) {
    return this.payments.initiateWithdrawalPayout(id, provider || 'JAZZCASH');
  }
}
