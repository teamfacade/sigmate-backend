import ImageFileService, { imageService } from '../../services/file/image';

export default class ImageUploader {
  static wikiBlock() {
    return imageService
      .createImageMulter({
        path: ImageFileService.PATH_WIKI_BLOCK_IMAGE,
      })
      .single('image');
  }
}
