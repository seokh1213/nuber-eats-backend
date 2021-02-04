import { Order } from './../../orders/entities/order.entity';
import { Restaurant } from './../entities/restaurant.entity';
import { CoreOutput } from './../../common/dtos/output.dto';
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@InputType()
export class MyRestaurantInput {
  @Field((type) => Int)
  restaurantId: number;
}

@ObjectType()
export class MyRestaurantOutput extends CoreOutput {
  @Field((type) => Restaurant, { nullable: true })
  restaurant?: Restaurant;
}
