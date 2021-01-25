import { PaginationInput, PaginationOutput } from './pagination.dto';
import { Category } from './../entities/category.entity';
import { CoreOutput } from './../../common/dtos/output.dto';
import { Field, ObjectType, ArgsType } from '@nestjs/graphql';

@ArgsType()
export class CategoryInput extends PaginationInput {
  @Field((type) => String)
  slug: string;
}

@ObjectType()
export class CategoryOutput extends PaginationOutput {
  @Field((type) => Category, { nullable: true })
  category?: Category;
}
