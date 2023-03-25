import ImageFileService, { imageService } from '../../services/file/image';

export default class WikiFileController {
  static uploadImageBlock: sigmate.ReqHandler<{
    response: {
      success: number;
      file: { url: string };
    };
  }> = async (req, res, next) => {
    try {
      const image = await imageService.createMetadata({
        file: req.file,
        path: ImageFileService.PATH_WIKI_BLOCK_IMAGE,
      });

      const baseUrl = ImageFileService.BASEURL_UPLOADS;
      const ext =
        ImageFileService.MIME_EXT_IMG[
          image.mimetype as keyof typeof ImageFileService['MIME_EXT_IMG']
        ];
      const url = `${baseUrl}/${image.path}/${image.id}.${ext}`;
      res.status(200).json({
        meta: res.meta(),
        success: 1,
        file: { url },
      });
    } catch (error) {
      next(error);
    }
  };
}
