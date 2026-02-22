/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { ICharacter2 } from '@/models/interfaces';

import { Rank } from '@/fsd/5-shared/model/enums/rank.enum';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { RosterSnapshotCharacter } from '../input-roster-snapshots/roster-snapshot-character';

import { Teams2Service } from './teams2.service';

interface Props {
    characters: ICharacter2[];
    sizeMod: number;
    onCharacterSelect: (id: string) => void;
    showHeader: boolean;
}

export const CharacterGrid: React.FC<Props> = ({ characters, sizeMod, onCharacterSelect, showHeader }: Props) => {
    return (
        <div>
            {showHeader && (
                <div className="mb-4 flex justify-between">
                    <h3 className="font-bold">Characters</h3>
                    <span className="text-xs text-slate-500">Showing {characters.length} units</span>
                </div>
            )}
            <div className="flex flex-wrap gap-4">
                {characters.map(char => (
                    <div
                        key={char.snowprintId!}
                        onClick={() => onCharacterSelect(char.snowprintId!)}
                        style={{ zoom: sizeMod }}
                        className="cursor-pointer transition-transform duration-100 hover:brightness-110 active:scale-95"
                        title={`Select ${char.name || 'Character'}`}>
                        <RosterSnapshotCharacter
                            key={char.snowprintId!}
                            showMythicShards={RosterSnapshotShowVariableSettings.Never}
                            showShards={RosterSnapshotShowVariableSettings.Never}
                            showXpLevel={RosterSnapshotShowVariableSettings.Never}
                            showAbilities={RosterSnapshotShowVariableSettings.Always}
                            showEquipment={RosterSnapshotShowVariableSettings.Always}
                            showTooltip={true}
                            char={Teams2Service.convertCharacter(char)}
                            charData={char}
                            isDisabled={char.rank === Rank.Locked}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
