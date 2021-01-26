import { Dish } from './../entities/dish.entity';
import { CoreOutput } from './../../common/dtos/output.dto';
import { Field, InputType, ObjectType, Int, PickType } from '@nestjs/graphql';
import { Column } from 'typeorm';

@InputType()
export class CreateDishInput extends PickType(Dish, [
  'name',
  'price',
  'description',
  'options',
]) {
  @Field((type) => Int)
  restaurantId: number;
}

@ObjectType()
export class CreateDishOutput extends CoreOutput {}
