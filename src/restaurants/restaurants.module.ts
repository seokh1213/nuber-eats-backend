import { RestaurantResolver } from './restaurants.resolver';
import { Module } from '@nestjs/common';

@Module({
  providers: [RestaurantResolver],
})
export class RestaurantsModule {}
