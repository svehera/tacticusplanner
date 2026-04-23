import { createContext } from 'react';

import { UnitPortraitAssets } from './unit-portrait.model';

export const UnitPortraitAssetContext = createContext<UnitPortraitAssets | undefined>(undefined);
