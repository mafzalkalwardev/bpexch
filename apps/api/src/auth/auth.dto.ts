import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(4)
  password!: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}
