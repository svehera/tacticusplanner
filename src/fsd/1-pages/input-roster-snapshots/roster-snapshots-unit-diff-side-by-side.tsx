/* eslint-disable import-x/no-internal-modules */
import { ArrowForward } from '@mui/icons-material';

import { Rank } from '@/fsd/5-shared/model';

import { CharactersService } from '@/fsd/4-entities/character';
import { EquipmentService } from '@/fsd/4-entities/equipment/equipment.service';
import { MowsService } from '@/fsd/4-entities/mow';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { ISnapshotCharacter, ISnapshotMachineOfWar, ISnapshotUnitDiff } from './models';
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
    diff: ISnapshotUnitDiff;
}

export const RosterSnapshotsUnitDiffSideBySide: React.FC<Props> = ({
    showShards,
    showMythicShards,
    showXpLevel,
    showAbilities,
    showEquipment,
    showTooltip,
    char,
    mow,
    diff,
}: Props) => {
    const staticChar = char ? CharactersService.resolveCharacter(char.id) : undefined;
    const staticMow = mow ? MowsService.resolveToStatic(mow.id) : undefined;

    return (
        <div className="170px flex w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg transition duration-300 hover:border-blue-500 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <div className="w-1"></div>
            <div className="h-[170px] w-[96px]">
                <RosterSnapshotCharacter
                    showShards={showShards}
                    showMythicShards={showMythicShards}
                    showXpLevel={showXpLevel}
                    showAbilities={showAbilities}
                    showEquipment={showEquipment}
                    showTooltip={showTooltip}
                    char={char}
                    charData={staticChar}
                    mow={mow}
                    mowData={staticMow}
                />
            </div>
            <div className="flex items-center px-0">
                <ArrowForward className="text-gray-500" />
            </div>
            <RosterSnapshotCharacter
                showShards={showShards}
                showMythicShards={showMythicShards}
                showXpLevel={showXpLevel}
                showAbilities={showAbilities}
                showEquipment={showEquipment}
                showTooltip={showTooltip}
                char={
                    staticChar == undefined
                        ? undefined
                        : {
                              id: char!.id,
                              rarity: diff.rarity ?? char!.rarity,
                              stars: diff.stars ?? char!.stars,
                              rank: diff.rank ?? (char ? char.rank : Rank.Locked),
                              activeAbilityLevel: diff.active ?? char?.activeAbilityLevel ?? 1,
                              passiveAbilityLevel: diff.passive ?? char?.passiveAbilityLevel ?? 1,
                              xpLevel: diff.xpLevel ?? (char ? char.xpLevel : 0),
                              shards: diff.shards ?? char!.shards,
                              mythicShards: diff.mythicShards ?? char!.mythicShards,
                              equip0: EquipmentService.equipmentData.find(eq => eq.id === diff.equip0) ?? char!.equip0,
                              equip1: EquipmentService.equipmentData.find(eq => eq.id === diff.equip1) ?? char!.equip1,
                              equip2: EquipmentService.equipmentData.find(eq => eq.id === diff.equip2) ?? char!.equip2,
                              equip0Level: diff.equip0Level ?? char!.equip0Level,
                              equip1Level: diff.equip1Level ?? char!.equip1Level,
                              equip2Level: diff.equip2Level ?? char!.equip2Level,
                          }
                }
                charData={staticChar}
                mow={
                    staticMow == undefined
                        ? undefined
                        : {
                              id: mow!.id,
                              rarity: diff.rarity ?? mow!.rarity,
                              stars: diff.stars ?? mow!.stars,
                              primaryAbilityLevel: diff.active ?? mow!.primaryAbilityLevel ?? 1,
                              secondaryAbilityLevel: diff.passive ?? mow!.secondaryAbilityLevel ?? 1,
                              locked: false,
                              shards: diff.shards ?? mow!.shards,
                              mythicShards: diff.mythicShards ?? mow!.mythicShards,
                          }
                }
                mowData={staticMow}
            />
        </div>
    );
};
