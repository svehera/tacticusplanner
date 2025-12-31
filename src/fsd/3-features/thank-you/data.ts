// eslint-disable-next-line import-x/no-internal-modules
import contentCreatorsJson from '@/data/contentCreators.json';
// eslint-disable-next-line import-x/no-internal-modules
import contributorsJson from '@/data/thankYou.json';

import { IContributor, IContentCreator } from './thank-you.model';

export const contributors: IContributor[] = contributorsJson;
export const contentCreators: IContentCreator[] = contentCreatorsJson;
