import { Order } from './../../orders/entities/order.entity';
import { Dish } from './dish.entity';
import { User } from 'src/users/entities/user.entity';
import { Category } from './category.entity';
import { CoreEntity } from './../../common/entities/core.entity';
import { Field, ObjectType, InputType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType() // Graphql
@Entity() // Typeorm
export class Restaurant extends CoreEntity {
  @Field((type) => String)
  @Column()
  @IsString()
  @Length(5)
  name: string;

  @Field((type) => String)
  @Column()
  @IsString()
  address: string;

  @Field((type) => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  coverImg: string;

  @ManyToOne((type) => Category, (category) => category.restaurants, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @Field((type) => Category)
  category: Category;

  @ManyToOne((type) => User, (user) => user.restaurants, {
    onDelete: 'CASCADE',
  })
  @Field((type) => User, { nullable: true })
  owner: User;

  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;

  @Field((type) => [Dish])
  @OneToMany((type) => Dish, (dish) => dish.restaurant)
  menu: Dish[];

  @Field((type) => [Order])
  @OneToMany((type) => Order, (order) => order.restaurant)
  orders: Order[];

  @Field((type) => Boolean)
  @Column({ default: false })
  isPromoted: boolean;

  @Field((type) => Date, { nullable: true })
  @Column({ nullable: true })
  promotedUntil?: Date;
}
