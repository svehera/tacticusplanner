import AddAPhoto from '@mui/icons-material/AddAPhoto';
import Settings from '@mui/icons-material/Settings';
import SyncIcon from '@mui/icons-material/Sync';
import { Button } from '@mui/material';
import { isMobile } from 'react-device-detect';

import { Rank, RarityStars } from '@/fsd/5-shared/model';
// eslint-disable-next-line import-x/no-internal-modules
import { Rarity } from '@/fsd/5-shared/model/enums/rarity.enum';

import { RosterSnapshotsUnit } from './roster-snapshots-unit';
import { RosterSnapshotsUnitDiff } from './roster-snapshots-unit-diff';

export const RosterSnapshots = () => {
    const sync = () => {};
    const takeSnapshot = () => {};
    const openSettings = () => {};
    return (
        <div>
            <div className="flex justify-begin p-2 border-b border-gray-600">
                <Button size="small" variant="contained" color="primary" onClick={sync}>
                    <SyncIcon className="mr-1" />
                    {!isMobile && 'Sync'}
                </Button>
                <div className="w-1" />
                <Button size="small" variant="contained" color="primary" onClick={takeSnapshot}>
                    <AddAPhoto className="mr-1" />
                    {!isMobile && 'Take Snapshot'}
                </Button>
                <div className="w-1" />
                <Button size="small" variant="contained" color="primary" onClick={openSettings}>
                    <Settings className="mr-1" />
                    {!isMobile && 'Settings'}
                </Button>
            </div>
            <div>
                <RosterSnapshotsUnit
                    char={{
                        id: 'bloodDante',
                        rarity: Rarity.Common,
                        rank: Rank.Diamond3,
                        stars: RarityStars.OneBlueStar,
                        active: 36,
                        passive: 50,
                    }}
                />
            </div>
            <div>
                <RosterSnapshotsUnit
                    mow={{
                        id: 'adeptExorcist',
                        rarity: Rarity.Mythic,
                        stars: RarityStars.OneBlueStar,
                        active: 36,
                        passive: 50,
                    }}
                />
            </div>
            <div>
                <RosterSnapshotsUnitDiff
                    char={{
                        id: 'bloodDante',
                        rarity: Rarity.Common,
                        rank: Rank.Diamond3,
                        stars: RarityStars.OneBlueStar,
                        active: 36,
                        passive: 50,
                    }}
                    diff={{
                        id: 'bloodDante',
                        rarity: Rarity.Rare,
                        rank: Rank.Adamantine1,
                        active: 40,
                    }}
                />
            </div>
            <div>
                <RosterSnapshotsUnitDiff
                    char={{
                        id: 'worldKharn',
                        rarity: Rarity.Common,
                        rank: Rank.Stone1,
                        stars: RarityStars.OneStar,
                        active: 1,
                        passive: 1,
                    }}
                    diff={{
                        id: 'worldKharn',
                        rank: Rank.Adamantine3,
                        rarity: Rarity.Mythic,
                        stars: RarityStars.MythicWings,
                        active: 65,
                        passive: 65,
                    }}
                />
            </div>
            <div>
                <RosterSnapshotsUnitDiff
                    mow={{
                        id: 'adeptExorcist',
                        rarity: Rarity.Common,
                        stars: RarityStars.OneStar,
                        active: 1,
                        passive: 1,
                    }}
                    diff={{
                        id: 'adeptExorcist',
                        rank: Rank.Adamantine3,
                        rarity: Rarity.Mythic,
                        stars: RarityStars.MythicWings,
                        active: 65,
                        passive: 65,
                    }}
                />
            </div>
        </div>
    );
};
