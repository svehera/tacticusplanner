import { ArrowForward } from '@mui/icons-material';

import { RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService, RankIcon } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';

import { ISnapshotCharacter, ISnapshotMachineOfWar, ISnapshotUnitDiff } from './models';
import { RosterSnapshotCharacter } from './roster-snapshot-character';
import { Rank } from '@/fsd/5-shared/model';

interface Props {
    char?: ISnapshotCharacter;
    mow?: ISnapshotMachineOfWar;
    diff: ISnapshotUnitDiff;
}

export const RosterSnapshotsUnitDiff2: React.FC<Props> = ({ char, mow, diff }: Props) => {
    const staticChar = char ? CharactersService.resolveCharacter(char.id) : undefined;
    const staticMow = mow ? MowsService.resolveToStatic(mow.id) : undefined;
    const unit = char || mow; // The base unit (Character or MoW)

    return (
        <div className="flex w-84 h-24 dark:bg-gray-800 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition duration-300 hover:shadow-xl hover:border-blue-500">
            <RosterSnapshotCharacter char={char} charData={staticChar} mow={mow} mowData={staticMow} />
            <div className="flex items-center px-2">
                <ArrowForward className="text-gray-500" />
            </div>
            <RosterSnapshotCharacter
                char={staticChar == undefined ? undefined : {
                    id: unit!.id,
                    rarity: diff.rarity ?? unit!.rarity,
                    stars: diff.stars ?? unit!.stars,
                    rank: diff.rank ?? (char ? char.rank : Rank.Locked),
                    active: diff.active ?? unit!.active,
                    passive: diff.passive ?? unit!.passive,
                }}
                charData={staticChar}
                mow={staticMow == undefined ? undefined : {
                    id: unit!.id,
                    rarity: diff.rarity ?? unit!.rarity,
                    stars: diff.stars ?? unit!.stars,
                    active: diff.active ?? unit!.active,
                    passive: diff.passive ?? unit!.passive,
                    locked: false,
                }}
                mowData={staticMow}
            />
        </div>
    );
};
