import { CreateRestaurantDto } from './create-restaurant.dto';
import { Restaurant } from './../entities/restaurant.entity';
import { ArgsType, InputType, PartialType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateRestaurantInputType extends PartialType(
  CreateRestaurantDto,
) {}

@InputType()
export class UpdateRestaurantDto {
  @Field((type) => Number)
  id: number;

  @Field((type) => UpdateRestaurantInputType)
  data: UpdateRestaurantInputType;
}
