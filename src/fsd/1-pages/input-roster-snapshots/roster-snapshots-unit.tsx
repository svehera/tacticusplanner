import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';

// eslint-disable-next-line import-x/no-internal-modules
import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { ISnapshotCharacter, ISnapshotMachineOfWar } from './models';
import { RosterSnapshotCharacter } from './roster-snapshot-character';

interface Props {
    showShards: RosterSnapshotShowVariableSettings;
    showMythicShards: RosterSnapshotShowVariableSettings;
    showXpLevel: RosterSnapshotShowVariableSettings;
    char?: ISnapshotCharacter;
    mow?: ISnapshotMachineOfWar;
}

export const RosterSnapshotsUnit: React.FC<Props> = ({
    showShards,
    showMythicShards,
    showXpLevel,
    char,
    mow,
}: Props) => {
    const staticChar = char ? CharactersService.resolveCharacter(char.id) : undefined;
    const staticMow = mow ? MowsService.resolveToStatic(mow.id) : undefined;

    return (
        <div className="flex h-42 w-26 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl transition duration-300 hover:border-blue-500/50 hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800">
            <div className="relative flex h-full w-18 flex-shrink-0 items-center justify-center bg-gray-100 p-1 dark:bg-gray-900">
                {char !== undefined && staticChar !== undefined && (
                    <RosterSnapshotCharacter
                        showShards={showShards}
                        showMythicShards={showMythicShards}
                        showXpLevel={showXpLevel}
                        char={char}
                        charData={staticChar}
                    />
                )}
                {mow !== undefined && staticMow !== undefined && (
                    <RosterSnapshotCharacter
                        showShards={showShards}
                        showMythicShards={showMythicShards}
                        showXpLevel={showXpLevel}
                        mow={mow}
                        mowData={staticMow}
                    />
                )}
            </div>
        </div>
    );
};
