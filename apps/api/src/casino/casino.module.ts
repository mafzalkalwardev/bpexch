import { Module } from '@nestjs/common';
import { CasinoService } from './casino.service';
import { CasinoController } from './casino.controller';
import { WalletModule } from '../wallet/wallet.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [WalletModule, AuditModule],
  controllers: [CasinoController],
  providers: [CasinoService],
  exports: [CasinoService],
})
export class CasinoModule {}
