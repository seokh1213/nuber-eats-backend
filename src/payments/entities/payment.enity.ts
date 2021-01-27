import { Restaurant } from './../../restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { CoreEntity } from './../../common/entities/core.entity';
import { InputType, ObjectType, Field, Int } from '@nestjs/graphql';
import { Entity, Column, RelationId, ManyToOne } from 'typeorm';

@InputType('PaymentInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Payment extends CoreEntity {
  @Field((type) => String)
  @Column()
  transactionId: string;

  @Field((type) => User)
  @ManyToOne((type) => User, (user) => user.payments)
  user: User;

  @RelationId((payment: Payment) => payment.user)
  userId: number;

  @Field((type) => Restaurant)
  @ManyToOne((type) => Restaurant)
  restaurant: Restaurant;

  @RelationId((payment: Payment) => payment.restaurant)
  @Field((type) => Int)
  restaurantId: number;
}
