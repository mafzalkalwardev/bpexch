import { IsString } from 'class-validator';

export class KycSubmissionDto {
  @IsString()
  documentType!: string;

  @IsString()
  documentNumber!: string;

  @IsString()
  documentUrl!: string;
}

export class KycReviewDto {
  approve!: boolean;

  @IsString()
  note?: string;
}
