import Service from '.';

export default class WikiService extends Service {
  constructor() {
    super('Wiki');
  }
}

export const wiki = new WikiService();
