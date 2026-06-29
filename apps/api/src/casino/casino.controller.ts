import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  Headers,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { UserRole } from '@bpexch/shared';
import { CasinoService } from './casino.service';
import { LaunchGameDto, CasinoWebhookDto, CreateGameDto } from './casino.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RequirePermission } from '../auth/permission.decorator';
import { Roles } from '../auth/roles.decorator';

@Controller('casino')
export class CasinoController {
  constructor(private casino: CasinoService) {}

  @Get('games')
  listGames(@Query('category') category?: string) {
    return this.casino.listGames(category);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('launch')
  @RequirePermission('PLACE_BETS')
  launch(@CurrentUser() user: { id: string }, @Body() dto: LaunchGameDto) {
    return this.casino.launchGame(user.id, dto.gameId);
  }

  @Post('webhook')
  webhook(@Body() dto: CasinoWebhookDto, @Headers('x-webhook-secret') secret?: string) {
    return this.casino.handleWebhook(dto, secret || dto.signature);
  }

  @Get('embed/:sessionId')
  async embed(
    @Param('sessionId') sessionId: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    const session = await this.casino.getEmbedSession(sessionId, token);
    const balance = session.user.wallet ? Number(session.user.wallet.balance) : 0;
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${session.game.name}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui;background:#0a1628;color:#fff;min-height:100vh}
.header{background:#1a2744;padding:12px 16px;display:flex;justify-content:space-between;align-items:center}
.game-area{padding:20px;text-align:center}.balance{color:#4ade80;font-weight:bold}
.btn{background:#eab308;color:#000;border:none;padding:10px 20px;border-radius:6px;margin:8px;cursor:pointer;font-weight:600}
.btn:hover{background:#ca8a04}.result{margin-top:16px;font-size:1.2rem}
</style></head><body>
<div class="header"><span>${session.game.name}</span><span class="balance">PKR ${balance.toFixed(2)}</span></div>
<div class="game-area">
<h2>${session.game.name}</h2>
<p style="margin:16px 0;color:#94a3b8">Mock ${session.game.category} — sandbox provider</p>
<button class="btn" onclick="placeBet(100)">Bet PKR 100</button>
<button class="btn" onclick="placeBet(500)">Bet PKR 500</button>
<button class="btn" onclick="simulateWin()">Simulate Win PKR 200</button>
<div class="result" id="result"></div>
</div>
<script>
const sessionId='${session.id}';
const apiBase='${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/casino/webhook';
const secret='${process.env.CASINO_WEBHOOK_SECRET || 'mock-webhook-secret'}';
let txCounter=0;
async function post(type,amount){
  txCounter++;
  const r=await fetch(apiBase,{method:'POST',headers:{'Content-Type':'application/json','x-webhook-secret':secret},
    body:JSON.stringify({sessionId,transactionId:sessionId+'-'+txCounter,type,amount})});
  const d=await r.json();
  document.getElementById('result').textContent=type+' OK — Balance: PKR '+d.balance.toFixed(2);
  document.querySelector('.balance').textContent='PKR '+d.balance.toFixed(2);
}
function placeBet(a){post('BET',a)}
function simulateWin(){post('WIN',200)}
</script></body></html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Post('games')
  createGame(@Body() dto: CreateGameDto) {
    return this.casino.createGame(dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('sessions/:id/close')
  closeSession(@Param('id') id: string) {
    return this.casino.closeSession(id);
  }
}
