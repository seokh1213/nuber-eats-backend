import { Restaurant } from './restaurant.entity';
import { CoreEntity } from './../../common/entities/core.entity';
import { Field, ObjectType, InputType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

@InputType('CategoryInputType', { isAbstract: true })
@ObjectType() // Graphql
@Entity() // Typeorm
export class Category extends CoreEntity {
  @Field((type) => String)
  @Column()
  @IsString()
  @Length(5)
  name: string;

  @Field((type) => String)
  @Column()
  @IsString()
  address: string;

  @OneToMany((type) => Restaurant, (restaurant) => restaurant.category)
  @Field((type) => [Restaurant])
  restaurants: Restaurant[];
}
