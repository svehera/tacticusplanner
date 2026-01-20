/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */

import { Faction, Rarity } from '@/fsd/5-shared/model';

import { IMow2 } from '@/fsd/4-entities/mow/@x/unit';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { RosterSnapshotCharacter } from '../input-roster-snapshots/roster-snapshot-character';

import { WarService } from './war.service';

interface Props {
    searchText: string;
    minRarity: Rarity;
    maxRarity: Rarity;
    factions: Faction[];
    mows: IMow2[];
    selectedMow: string;
    onMowSelect: (id: string) => void;
}

export const MowSelectionGrid: React.FC<Props> = ({
    searchText,
    minRarity,
    maxRarity,
    mows,
    factions,
    selectedMow,
    onMowSelect,
}: Props) => {
    const filteredMows = mows
        .filter(mow => selectedMow !== mow.snowprintId!)
        .filter(mow => WarService.passesMowFilter(mow, minRarity, maxRarity, factions, searchText))
        .sort((a, b) => {
            const powerA = Math.pow(a.primaryAbilityLevel ?? 0, 2) + Math.pow(a.secondaryAbilityLevel ?? 0, 2);
            const powerB = Math.pow(b.primaryAbilityLevel ?? 0, 2) + Math.pow(b.secondaryAbilityLevel ?? 0, 2);
            if (powerB !== powerA) {
                return powerB - powerA;
            }
            return b.rarity - a.rarity;
        });
    return (
        <div className="flex-[1] bg-white dark:bg-[#161b22] p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="mb-4">
                <h3 className="font-bold">Machines of War</h3>
            </div>
            <div className="flex flex-wrap gap-4">
                {filteredMows.map(mow => (
                    <div
                        key={mow.snowprintId!}
                        onClick={() => onMowSelect(mow.snowprintId!)}
                        className="cursor-pointer transition-transform duration-100 active:scale-95 hover:brightness-110"
                        title={`Select ${mow.name || 'Machine of War'}`}>
                        <RosterSnapshotCharacter
                            key={mow.snowprintId!}
                            showMythicShards={RosterSnapshotShowVariableSettings.Never}
                            showShards={RosterSnapshotShowVariableSettings.Never}
                            showXpLevel={RosterSnapshotShowVariableSettings.Never}
                            mow={WarService.convertMow(mow)}
                            mowData={mow}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
