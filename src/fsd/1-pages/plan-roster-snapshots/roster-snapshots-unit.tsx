// eslint-disable-next-line import-x/no-internal-modules
import { CharacterPortraitImage } from '@/v2/components/images/character-portrait.image';

import { RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService, RankIcon } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';

import { ISnapshotCharacter, ISnapshotMachineOfWar } from './models';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/assets';
import { RosterSnapshotCharacter } from './roster-snapshot-character';

interface Props {
    char?: ISnapshotCharacter;
    mow?: ISnapshotMachineOfWar;
}

export const RosterSnapshotsUnit: React.FC<Props> = ({ char, mow }: Props) => {
    const staticChar = char ? CharactersService.resolveCharacter(char.id) : undefined;
    const staticMow = mow ? MowsService.resolveToStatic(mow.id) : undefined;

    return (
        <div className="flex w-18 h-26 dark:bg-gray-800 bg-white rounded-lg shadow-xl overflow-hidden border dark:border-gray-700/50 border-gray-200 transition duration-300 hover:shadow-2xl hover:border-blue-500/50">
            <div className="w-18 h-full flex-shrink-0 relative p-1 dark:bg-gray-900 bg-gray-100 flex items-center justify-center">
                {char !== undefined && staticChar !== undefined && <RosterSnapshotCharacter char={char} charData={staticChar} />}
                {/*mow && <RosterSnapshotCharacter char={mow!} />*/}
            </div>
        </div>
    );
};
