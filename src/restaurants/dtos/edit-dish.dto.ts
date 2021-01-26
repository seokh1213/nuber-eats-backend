import { CoreOutput } from './../../common/dtos/output.dto';
import { Dish } from './../entities/dish.entity';
import {
  InputType,
  ObjectType,
  PartialType,
  PickType,
  Field,
  Int,
} from '@nestjs/graphql';

@InputType()
export class EditDishInput extends PickType(PartialType(Dish), [
  'name',
  'options',
  'price',
  'description',
]) {
  @Field((type) => Int)
  dishId: number;
}

@ObjectType()
export class EditDishOutput extends CoreOutput {}
