import { WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
  },
})
export class GatewayTest {}
