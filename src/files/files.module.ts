import { FilesController } from './files.controller';
import { Module } from '@nestjs/common';

@Module({
  controllers: [FilesController],
})
export class FilesModule {}
