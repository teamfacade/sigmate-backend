import { DropletId } from '../../utils/droplet';
import { ImageFile, ImageFileId } from '../ImageFile.model';

export interface WikiDataSource {
  id: DropletId;
  name: string;
  description?: string;
  url: string;
  iconUrl?: string;
  iconFile?: ImageFile;
  iconFileId?: ImageFileId;
}
