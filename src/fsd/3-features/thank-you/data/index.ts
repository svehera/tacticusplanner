import { mutableCopy } from '@/fsd/5-shared/lib';

import { IContributor, IContentCreator } from '../thank-you.model';

import contentCreatorsJson from './content-creators.json';
import contributorsJson from './thank-you.json';

export const contributors = mutableCopy(contributorsJson) satisfies IContributor[];
export const contentCreators = mutableCopy(contentCreatorsJson) satisfies IContentCreator[];
