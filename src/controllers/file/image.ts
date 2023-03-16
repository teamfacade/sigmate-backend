import { RequestHandler } from 'express';
import { join } from 'path';
import ms from 'ms';
import { Readable } from 'stream';
import RequestError from '../../errors/request';
import FileService, { fileService } from '../../services/file';
import { s3Service } from '../../services/s3';
import { imageService } from '../../services/file/image';

export default class ImageController {
  static getImage: RequestHandler = async (req, res, next) => {
    try {
      const storage = fileService.storage;
      const path = req.path.replace(/^\/uploads/, '').replace(/^\//, '');

      if (storage === FileService.STORAGE_S3) {
        // Retrieve the object from S3
        const s3Promise = s3Service.getObject({
          bucket: FileService.BUCKET_S3,
          key: path.replace(/^\//, ''),
        });
        // Retrieve image metadata from DB
        const dbPromise = imageService.getImageMetadata({ filepath: path });
        const [s3Object, image] = await Promise.all([s3Promise, dbPromise]);

        const stream = s3Object.Body;
        if (stream instanceof Readable) {
          // Set HTTP headers
          if (image) {
            res.setHeader('cache-control', `max-age=${ms('5m')}`);
            res.setHeader('content-length', String(image.size || 0));
            res.setHeader('content-type', image.mimetype);
          }

          // Send the data to the user without buffering the entire data in memory
          stream.pipe(res);
          // Response stream will end automatically when readable is drained
        } else {
          throw new RequestError({
            code: 'REQ/NF',
            message: 'S3 body not a Readable',
          });
        }
      } else {
        // Serve the file stored on disk
        try {
          res.sendFile(join(FileService.BASEPATH_DISK, path), {
            maxAge: '5m',
            root: '.',
          });
        } catch (error) {
          throw new RequestError('REQ/NF');
        }
      }
    } catch (error) {
      next(error);

      // If a Readable stream emits an error while piping,
      // the writable stream is not ended, so must be closed MANUALLY
      if (!res.writableEnded) res.end();
    }
  };
}
