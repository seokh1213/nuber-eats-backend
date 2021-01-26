import { CoreOutput } from './../../common/dtos/output.dto';
import { Field, InputType, ObjectType, Int } from '@nestjs/graphql';

@InputType()
export class DeleteDishInput {
  @Field((type) => Int)
  dishId: number;
}

@ObjectType()
export class DeleteDishOutput extends CoreOutput {}
