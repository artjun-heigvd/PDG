import { Module } from '@nestjs/common';
import { GatewayTest } from './gateway';

@Module({
  providers: [GatewayTest],
})
export class GatewayModule {}
