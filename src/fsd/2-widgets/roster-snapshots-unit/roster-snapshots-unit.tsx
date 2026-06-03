import { ISnapshotCharacter, ISnapshotMachineOfWar, UnitPortrait } from '@/fsd/5-shared/ui/unit-portrait';

import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings';

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

export const RosterSnapshotsUnit = ({
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
        <div className="flex h-[200px] w-[110px] overflow-hidden rounded-xl border border-(--card-border) bg-(--card) shadow-sm transition-[border-color,box-shadow] duration-150 hover:border-(--primary)/50 hover:shadow-md">
            <div className="relative flex h-full w-full flex-shrink-0 items-center justify-center p-1">
                {char !== undefined && staticChar !== undefined && (
                    <UnitPortrait
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
                    <UnitPortrait
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
