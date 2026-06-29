import { Module } from '@nestjs/common';
import { SportsService } from './sports.service';
import { SportsController } from './sports.controller';
import { OddsFeedService } from './odds-feed.service';
import { OrderMatchingService } from './order-matching.service';
import { CashOutService } from './cash-out.service';
import { SportsGateway } from './sports.gateway';
import { WalletModule } from '../wallet/wallet.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [WalletModule, AuditModule],
  controllers: [SportsController],
  providers: [SportsService, OddsFeedService, OrderMatchingService, SportsGateway, CashOutService],
  exports: [SportsService, CashOutService],
})
export class SportsModule {}
