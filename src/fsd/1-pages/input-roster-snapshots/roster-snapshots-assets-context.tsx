import { createContext } from 'react';

import { RosterSnapshotAssets } from './models';

export const AssetContext = createContext<RosterSnapshotAssets | null>(null);
