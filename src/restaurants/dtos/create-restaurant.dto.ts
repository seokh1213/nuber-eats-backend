import { Category } from './../entities/category.entity';
import { CoreOutput } from './../../common/dtos/output.dto';
import { Restaurant } from './../entities/restaurant.entity';
import { InputType, ObjectType, PickType, Field } from '@nestjs/graphql';

@InputType()
export class CreateRestaurantInput extends PickType(Restaurant, [
  'name',
  'coverImg',
  'address',
]) {
  @Field((type) => String)
  categoryName: string;
}

@ObjectType()
export class CreateRestaurantOutput extends CoreOutput {}
