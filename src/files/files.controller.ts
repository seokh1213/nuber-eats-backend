import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { createHmac } from 'crypto';
import * as fs from 'fs';

const IMG_BASE_URL = './images/';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, IMG_BASE_URL);
  },
  filename: async function (req, file, cb) {
    const fileName = await createHmac('sha256', +new Date() + '')
      .update(file.originalname)
      .digest('hex');
    cb(null, fileName + '.' + file.mimetype.split('/')[1]);
  },
});

@Controller('file')
export class FilesController {
  @Post('uploads')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: {
        files: 1,
        fileSize: 5242880,
      },
      fileFilter: (
        _,
        file,
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        const isImage = file.mimetype && file.mimetype?.startsWith('image/');
        callback(
          !isImage &&
            new HttpException('Only accept the image', HttpStatus.FORBIDDEN),
          isImage,
        );
      },
    }),
  )
  uploadFile(@UploadedFile() file) {
    const { filename } = file;
    return { url: `http://localhost:4000/file/downloads/${filename}` };
  }

  @Get('downloads/:fileName')
  async downloadFile(@Param('fileName') fileName, @Res() res) {
    try {
      await fs.readFileSync(IMG_BASE_URL + fileName);
    } catch (error) {
      throw new HttpException('File is not found.', HttpStatus.NOT_FOUND);
    }
    const ext = fileName.split('.')[fileName.split('.').length - 1];
    res.setHeader('Content-Type', `image/${ext}`);
    return fs.createReadStream(IMG_BASE_URL + fileName).pipe(res);
  }
}
