/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { ICharacter2 } from '@/models/interfaces';

import { Rank } from '@/fsd/5-shared/model/enums/rank.enum';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { RosterSnapshotCharacter } from '../input-roster-snapshots/roster-snapshot-character';

import { Teams2Service } from './teams2.service';

interface Props {
    characters: ICharacter2[];
    zoom: number;
    onCharacterSelect: (id: string) => void;
    showHeader: boolean;
    deployedUnitIds?: string[];
}

export const CharacterGrid: React.FC<Props> = ({
    characters,
    zoom,
    onCharacterSelect,
    showHeader,
    deployedUnitIds,
}: Props) => {
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
                    <div key={char.snowprintId} className="relative" style={{ zoom }}>
                        <div
                            onClick={() => onCharacterSelect(char.snowprintId)}
                            className="cursor-pointer transition-transform duration-100 hover:brightness-110 active:scale-95"
                            title={`Select ${char.name || 'Character'}`}>
                            <RosterSnapshotCharacter
                                key={char.snowprintId}
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
                        {deployedUnitIds?.includes(char.snowprintId) && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div className="rounded-full bg-slate-950/70 p-1 shadow-lg ring-1 ring-white/20 dark:bg-slate-100/20">
                                    <MiscIcon icon="deployment" width={36} height={36} />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
