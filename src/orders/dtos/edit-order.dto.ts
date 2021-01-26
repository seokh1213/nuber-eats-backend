import { CoreOutput } from './../../common/dtos/output.dto';
import { Order, OrderStatus } from './../entities/order.entity';
import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';

@InputType()
export class EditOrderInput extends PickType(Order, ['id', 'status']) {}

@ObjectType()
export class EditOrderOutput extends CoreOutput {}
