import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PaymentWebhookDto {
  @IsEnum(['JAZZCASH', 'EASYPAISA', 'BANK'])
  provider!: 'JAZZCASH' | 'EASYPAISA' | 'BANK';

  @IsString()
  transactionId!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsString()
  userId!: string;

  @IsEnum(['SUCCESS', 'FAILED'])
  status!: 'SUCCESS' | 'FAILED';

  @IsOptional()
  @IsString()
  signature?: string;
}
