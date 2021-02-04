import { PaginationOutput, PaginationInput } from './pagination.dto';
import { Restaurant } from './../entities/restaurant.entity';
import { ObjectType, Field, InputType } from '@nestjs/graphql';

@InputType()
export class MyRestaurantsInput extends PaginationInput {}

@ObjectType()
export class MyRestaurantsOutput extends PaginationOutput {
  @Field((type) => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}
