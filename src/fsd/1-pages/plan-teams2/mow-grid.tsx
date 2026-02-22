/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */

import { IMow2 } from '@/fsd/4-entities/mow/@x/unit';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { RosterSnapshotCharacter } from '../input-roster-snapshots/roster-snapshot-character';

import { Teams2Service } from './teams2.service';

interface Props {
    mows: IMow2[];
    sizeMod: number;
    onMowSelect: (id: string) => void;
    showHeader: boolean;
}

export const MowGrid: React.FC<Props> = ({ mows, sizeMod, onMowSelect, showHeader }: Props) => {
    return (
        <div>
            {showHeader && (
                <div className="mb-4 flex justify-between">
                    <h3 className="font-bold">Machines of War</h3>
                    <span className="text-xs text-slate-500">Showing {mows.length} units</span>
                </div>
            )}
            <div className="flex flex-wrap gap-4">
                {mows.map(mow => (
                    <div
                        key={mow.snowprintId!}
                        onClick={() => onMowSelect(mow.snowprintId!)}
                        style={{ zoom: sizeMod }}
                        className="cursor-pointer transition-transform duration-100 hover:brightness-110 active:scale-95"
                        title={`Select ${mow.name || 'Machine of War'}`}>
                        <RosterSnapshotCharacter
                            key={mow.snowprintId!}
                            showMythicShards={RosterSnapshotShowVariableSettings.Never}
                            showShards={RosterSnapshotShowVariableSettings.Never}
                            showXpLevel={RosterSnapshotShowVariableSettings.Never}
                            showAbilities={
                                mow.unlocked
                                    ? RosterSnapshotShowVariableSettings.Always
                                    : RosterSnapshotShowVariableSettings.Never
                            }
                            showEquipment={RosterSnapshotShowVariableSettings.Never}
                            showTooltip={true}
                            mow={Teams2Service.convertMow(mow)}
                            mowData={mow}
                            isDisabled={!mow.unlocked}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
