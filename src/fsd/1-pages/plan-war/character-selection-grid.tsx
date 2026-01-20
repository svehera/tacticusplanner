/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { ICharacter2 } from '@/models/interfaces';

import { Faction, Rank, Rarity } from '@/fsd/5-shared/model';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { RosterSnapshotCharacter } from '../input-roster-snapshots/roster-snapshot-character';

import { WarService } from './war.service';

interface Props {
    searchText: string;
    minRank: Rank;
    maxRank: Rank;
    minRarity: Rarity;
    maxRarity: Rarity;
    factions: Faction[];
    characters: ICharacter2[];
    selectedCharacterIds: string[];
    onCharacterSelect: (id: string) => void;
}

export const CharacterSelectionGrid: React.FC<Props> = ({
    searchText,
    minRank,
    maxRank,
    minRarity,
    maxRarity,
    characters,
    factions,
    selectedCharacterIds,
    onCharacterSelect,
}: Props) => {
    const filteredChars = characters
        .filter(c => !selectedCharacterIds.includes(c.snowprintId!))
        .filter(c => WarService.passesCharacterFilter(c, minRank, maxRank, minRarity, maxRarity, factions, searchText))
        .sort((a, b) => {
            if (b.rank !== a.rank) {
                return b.rank - a.rank;
            }
            const powerA = Math.pow(a.activeAbilityLevel ?? 0, 2) + Math.pow(a.passiveAbilityLevel ?? 0, 2);
            const powerB = Math.pow(b.activeAbilityLevel ?? 0, 2) + Math.pow(b.passiveAbilityLevel ?? 0, 2);
            if (powerB !== powerA) {
                return powerB - powerA;
            }
            return b.rarity - a.rarity;
        });
    return (
        <div className="flex-[3] bg-white dark:bg-[#161b22] p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between mb-4">
                <h3 className="font-bold">Characters</h3>
                <span className="text-xs text-slate-500">Showing {filteredChars.length} units</span>
            </div>
            <div className="flex flex-wrap gap-4">
                {filteredChars.map(char => (
                    <div
                        key={char.snowprintId!}
                        onClick={() => onCharacterSelect(char.snowprintId!)}
                        className="cursor-pointer transition-transform duration-100 active:scale-95 hover:brightness-110"
                        title={`Select ${char.name || 'Character'}`}>
                        <RosterSnapshotCharacter
                            key={char.snowprintId!}
                            showMythicShards={RosterSnapshotShowVariableSettings.Never}
                            showShards={RosterSnapshotShowVariableSettings.Never}
                            showXpLevel={RosterSnapshotShowVariableSettings.Never}
                            char={WarService.convertCharacter(char)}
                            charData={char}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
