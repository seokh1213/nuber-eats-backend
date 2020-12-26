import { User } from './../entities/user.entity';
import { ObjectType, PickType, InputType, PartialType } from '@nestjs/graphql';
import { CoreOutput } from './../../common/dtos/output.dto';

@ObjectType()
export class EditProfileOutput extends CoreOutput {}

@InputType()
export class EditProfileInput extends PartialType(
  PickType(User, ['email', 'password']),
) {}
