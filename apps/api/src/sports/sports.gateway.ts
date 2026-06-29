import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/sports' })
export class SportsGateway {
  @WebSocketServer()
  server!: Server;

  emitOddsUpdate(runnerId: string, backPrice: number, layPrice: number) {
    this.server?.emit('odds', { runnerId, backPrice, layPrice });
  }

  emitBetUpdate(userId: string, bet: unknown) {
    this.server?.emit(`bet:${userId}`, bet);
  }
}
