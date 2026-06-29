import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto } from './auth.dto';
import { CurrentUser } from './current-user.decorator';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, req.ip);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@CurrentUser() user: { id: string; username: string; role: string; wallet?: { balance: unknown } }) {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      balance: user.wallet ? Number(user.wallet.balance) : 0,
    };
  }
}
