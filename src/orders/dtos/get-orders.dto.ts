import { CoreOutput } from './../../common/dtos/output.dto';
import { Order, OrderStatus } from './../entities/order.entity';
import { Field, InputType, ObjectType } from '@nestjs/graphql';

@InputType()
export class GetOrdersInput {
  @Field((type) => OrderStatus, { nullable: true })
  status?: OrderStatus;
}

@ObjectType()
export class GetOrdersOutput extends CoreOutput {
  @Field((type) => [Order], { nullable: true })
  orders?: Order[];
}
