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
      const url = `${ImageFileService.BASEURL_UPLOADS}/${image.path}/${image.basename}`;
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
