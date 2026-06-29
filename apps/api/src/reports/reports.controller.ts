import { Controller, Get, UseGuards, Header } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RequirePermission } from '../auth/permission.decorator';

@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('downline')
  @RequirePermission('VIEW_DOWNLINE')
  downline(@CurrentUser() user: { id: string }) {
    return this.reports.downlineReport(user.id);
  }

  @Get('pnl')
  @RequirePermission('VIEW_REPORTS')
  pnl(@CurrentUser() user: { id: string }) {
    return this.reports.branchPnL(user.id);
  }

  @Get('export/csv')
  @RequirePermission('VIEW_REPORTS')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=downline-report.csv')
  exportCsv(@CurrentUser() user: { id: string }) {
    return this.reports.exportCsv(user.id);
  }
}
