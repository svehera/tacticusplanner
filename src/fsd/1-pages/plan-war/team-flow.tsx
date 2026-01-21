/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { ICharacter2 } from '@/models/interfaces';

import { IMow2 } from '@/fsd/4-entities/mow';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { RosterSnapshotCharacter } from '../input-roster-snapshots/roster-snapshot-character';

import { WarService } from './war.service';

interface Props {
    chars: ICharacter2[];
    mows: IMow2[];
    onCharClicked: (char: ICharacter2) => void;
    onMowClicked: (mow: IMow2) => void;
}
export const TeamFlow: React.FC<Props> = ({ chars, mows, onCharClicked, onMowClicked }: Props) => {
    return (
        <div className="flex w-full p-4 min-h-[100px] items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-black/10">
            <div className="flex items-center gap-4">
                <div className="flex flex-wrap gap-4 justify-center max-w-4xl">
                    {chars.map(char => (
                        <div
                            key={char.snowprintId!}
                            onClick={() => onCharClicked(char)}
                            className="cursor-pointer transition-transform duration-100 active:scale-95 hover:brightness-110"
                            title={`Selected ${char!.snowprintId! || 'Character'}`}>
                            <RosterSnapshotCharacter
                                showMythicShards={RosterSnapshotShowVariableSettings.Never}
                                showShards={RosterSnapshotShowVariableSettings.Never}
                                showXpLevel={RosterSnapshotShowVariableSettings.Never}
                                char={WarService.convertCharacter(char!)}
                                charData={char}
                            />
                        </div>
                    ))}
                </div>

                {chars.length > 0 && mows.length > 0 && (
                    <div className="self-stretch w-px bg-slate-300 dark:bg-slate-700 mx-2 min-h-[60px]" />
                )}

                <div className="flex flex-wrap gap-4 shrink-0 items-center">
                    {mows.map(mow => (
                        <div
                            key={mow.snowprintId!}
                            onClick={() => onMowClicked(mow)}
                            className="cursor-pointer transition-transform duration-100 active:scale-95 hover:brightness-110"
                            title="Selected Machine of War">
                            <RosterSnapshotCharacter
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
        </div>
    );
};
