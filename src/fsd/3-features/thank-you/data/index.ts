import { IContributor, IContentCreator } from '../thank-you.model';

import contentCreatorsJson from './contentCreators.json';
import contributorsJson from './thankYou.json';

export const contributors: IContributor[] = contributorsJson;
export const contentCreators: IContentCreator[] = contentCreatorsJson;
