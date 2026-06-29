import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class LaunchGameDto {
  @IsString()
  gameId!: string;
}

export class CasinoWebhookDto {
  @IsString()
  sessionId!: string;

  @IsString()
  transactionId!: string;

  @IsEnum(['BET', 'WIN', 'REFUND'])
  type!: 'BET' | 'WIN' | 'REFUND';

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  signature?: string;
}

export class CreateGameDto {
  @IsString()
  name!: string;

  @IsString()
  category!: string;

  @IsString()
  provider!: string;

  @IsOptional()
  @IsString()
  providerGameId?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}
