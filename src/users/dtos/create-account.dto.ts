import { MutationOutput } from './../../common/dtos/output.dto';
import { PickType, InputType, ObjectType } from '@nestjs/graphql';
import { User } from './../entities/user.entity';

@InputType()
export class CreateAccountInput extends PickType(User, [
  'password',
  'email',
  'role',
]) {}

@ObjectType()
export class CreateAccountOutput extends MutationOutput {}
