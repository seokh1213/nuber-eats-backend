import { PubSub } from 'graphql-subscriptions';
import { PUB_SUB } from './common.constants';
import { Module, Global } from '@nestjs/common';

const pubsub = new PubSub();

@Global()
@Module({
  providers: [
    {
      provide: PUB_SUB,
      useValue: pubsub,
    },
  ],
  exports: [PUB_SUB],
})
export class CommonModule {}
