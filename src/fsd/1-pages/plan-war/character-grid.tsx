/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { ICharacter2 } from '@/models/interfaces';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { RosterSnapshotCharacter } from '../input-roster-snapshots/roster-snapshot-character';

import { WarService } from './war.service';

interface Props {
    characters: ICharacter2[];
    onCharacterSelect: (id: string) => void;
    showHeader: boolean;
}

export const CharacterGrid: React.FC<Props> = ({ characters, onCharacterSelect, showHeader }: Props) => {
    return (
        <div>
            {showHeader && (
                <div className="flex justify-between mb-4">
                    <h3 className="font-bold">Characters</h3>
                    <span className="text-xs text-slate-500">Showing {characters.length} units</span>
                </div>
            )}
            <div className="flex flex-wrap gap-4">
                {characters.map(char => (
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
