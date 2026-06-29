import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreditWalletDto {
  @IsString()
  userId!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class WithdrawalRequestDto {
  @IsNumber()
  @Min(500)
  amount!: number;

  @IsString()
  paymentMethod!: string;

  @IsString()
  accountDetails!: string;
}

export class DepositRequestDto {
  @IsNumber()
  @Min(500)
  amount!: number;

  @IsString()
  paymentMethod!: string;

  @IsOptional()
  @IsString()
  reference?: string;
}

export class ApproveWithdrawalDto {
  @IsString()
  withdrawalId!: string;

  approve!: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}
