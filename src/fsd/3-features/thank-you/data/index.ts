import { mutableCopy } from '@/fsd/5-shared/lib';

import { IContributor, IContentCreator } from '../thank-you.model';

import contentCreatorsJson from './contentCreators.json';
import contributorsJson from './thankYou.json';

export const contributors = mutableCopy(contributorsJson) satisfies IContributor[];
export const contentCreators = mutableCopy(contentCreatorsJson) satisfies IContentCreator[];
