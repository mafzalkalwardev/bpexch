import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@bpexch/shared';
import { SportsService } from './sports.service';
import { OrderMatchingService } from './order-matching.service';
import { CashOutService } from './cash-out.service';
import { PlaceBetDto, SettleEventDto } from './sports.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequirePermission } from '../auth/permission.decorator';

@Controller('sports')
export class SportsController {
  constructor(
    private sports: SportsService,
    private matching: OrderMatchingService,
    private cashOutService: CashOutService,
  ) {}

  @Get()
  listSports() {
    return this.sports.listSports();
  }

  @Get('events')
  listEvents(@Query('sport') sport?: string, @Query('inPlay') inPlay?: string) {
    return this.sports.listEvents(sport, inPlay === 'true');
  }

  @Get('markets/:id')
  getMarket(@Param('id') id: string) {
    return this.sports.getMarket(id);
  }

  @Get('orderbook/:runnerId')
  getOrderBook(@Param('runnerId') runnerId: string) {
    return this.matching.getOrderBook(runnerId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('bets')
  @RequirePermission('PLACE_BETS')
  placeBet(@CurrentUser() user: { id: string }, @Body() dto: PlaceBetDto) {
    return this.sports.placeBet(user.id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('bets/my')
  @RequirePermission('PLACE_BETS')
  myBets(@CurrentUser() user: { id: string }, @Query('status') status?: string) {
    return this.sports.getUserBets(user.id, status);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('bets/:id/cashout')
  @RequirePermission('PLACE_BETS')
  cashOutBet(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.cashOutService.cashOut(user.id, id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('exposure')
  @RequirePermission('PLACE_BETS')
  exposure(@CurrentUser() user: { id: string }) {
    return this.cashOutService.getExposure(user.id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('events/:id/settle')
  settle(@Param('id') id: string, @Body() dto: SettleEventDto) {
    return this.sports.settleEvent(id, dto.winnerRunnerId);
  }
}
