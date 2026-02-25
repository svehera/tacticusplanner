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
    showAbilities: RosterSnapshotShowVariableSettings;
    showEquipment: RosterSnapshotShowVariableSettings;
    showTooltip: boolean;
    char?: ISnapshotCharacter;
    mow?: ISnapshotMachineOfWar;
    isEnabled: boolean;
}

export const RosterSnapshotsUnit: React.FC<Props> = ({
    showShards,
    showMythicShards,
    showXpLevel,
    showEquipment,
    showAbilities,
    char,
    mow,
    showTooltip,
    isEnabled,
}: Props) => {
    const staticChar = char ? CharactersService.resolveCharacter(char.id) : undefined;
    const staticMow = mow ? MowsService.resolveToStatic(mow.id) : undefined;

    return (
        <div className="flex h-[200px] w-[110px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl transition duration-300 hover:border-blue-500/50 hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800">
            <div className="relative flex h-full w-full flex-shrink-0 items-center justify-center bg-gray-100 p-1 dark:bg-gray-900">
                {char !== undefined && staticChar !== undefined && (
                    <RosterSnapshotCharacter
                        showShards={showShards}
                        showMythicShards={showMythicShards}
                        showXpLevel={showXpLevel}
                        showEquipment={showEquipment}
                        showTooltip={showTooltip}
                        showAbilities={showAbilities}
                        char={char}
                        charData={staticChar}
                        isDisabled={!isEnabled}
                    />
                )}
                {mow !== undefined && staticMow !== undefined && (
                    <RosterSnapshotCharacter
                        showShards={showShards}
                        showMythicShards={showMythicShards}
                        showXpLevel={showXpLevel}
                        showEquipment={showEquipment}
                        showTooltip={showTooltip}
                        showAbilities={showAbilities}
                        mow={mow}
                        mowData={staticMow}
                        isDisabled={!isEnabled}
                    />
                )}
            </div>
        </div>
    );
};
