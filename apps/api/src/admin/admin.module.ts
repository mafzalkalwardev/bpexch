import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AuditModule } from '../audit/audit.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [AuditModule, WalletModule],
  controllers: [AdminController],
})
export class AdminModule {}
