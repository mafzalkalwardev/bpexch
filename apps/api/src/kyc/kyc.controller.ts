import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { KycService } from './kyc.service';
import { KycSubmissionDto, KycReviewDto } from './kyc.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RequirePermission } from '../auth/permission.decorator';

@Controller('kyc')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class KycController {
  constructor(private kyc: KycService) {}

  @Post('submit')
  submit(@CurrentUser() user: { id: string }, @Body() dto: KycSubmissionDto) {
    return this.kyc.submit(user.id, dto);
  }

  @Get('pending')
  @RequirePermission('MANAGE_KYC')
  pending() {
    return this.kyc.pending();
  }

  @Post(':id/review')
  @RequirePermission('MANAGE_KYC')
  review(
    @CurrentUser() reviewer: { id: string },
    @Param('id') id: string,
    @Body() dto: KycReviewDto,
  ) {
    return this.kyc.review(id, reviewer.id, dto.approve, dto.note);
  }
}
