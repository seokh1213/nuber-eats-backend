import * as uuidv4 from 'uuid';
import { User } from './user.entity';
import { CoreEntity } from './../../common/entities/core.entity';
import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { InputType, ObjectType, Field } from '@nestjs/graphql';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Verification extends CoreEntity {
  @Column()
  @Field((type) => String)
  code: string;

  @OneToOne((type) => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @BeforeInsert()
  @BeforeUpdate()
  createCode(): void {
    this.code = uuidv4.v4();
  }
}
