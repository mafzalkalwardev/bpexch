import { IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { BetSide } from '@bpexch/shared';

export class PlaceBetDto {
  @IsString()
  runnerId!: string;

  @IsEnum(BetSide)
  side!: BetSide;

  @IsNumber()
  @Min(1.01)
  odds!: number;

  @IsNumber()
  @Min(100)
  stake!: number;
}

export class SettleEventDto {
  @IsString()
  winnerRunnerId!: string;
}
