/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { ICharacter2 } from '@/models/interfaces';

import { IMow2 } from '@/fsd/4-entities/mow';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { RosterSnapshotCharacter } from '../input-roster-snapshots/roster-snapshot-character';

import { Teams2Service } from './teams2.service';

interface Props {
    chars: ICharacter2[];
    flexIndex?: number;
    mows: IMow2[];
    onCharClicked: (char: ICharacter2) => void;
    onMowClicked: (mow: IMow2) => void;
}

export const TeamFlow: React.FC<Props> = ({ chars, mows, flexIndex, onCharClicked, onMowClicked }: Props) => {
    const core = chars.slice(0, flexIndex ?? chars.length);
    const flex = chars.slice(flexIndex ?? chars.length);

    return (
        <div className="w-full p-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-black/10">
            <div className="flex flex-nowrap">
                {core.length > 0 && (
                    <div className="flex flex-wrap items-start flex-1 gap-2 flex-auto flex-min-w-[120px]">
                        {core.map(char => (
                            <div
                                key={char.snowprintId}
                                onClick={() => onCharClicked(char)}
                                className="cursor-pointer transition-transform duration-100 active:scale-95 hover:brightness-110">
                                <RosterSnapshotCharacter
                                    showMythicShards={RosterSnapshotShowVariableSettings.Never}
                                    showShards={RosterSnapshotShowVariableSettings.Never}
                                    showXpLevel={RosterSnapshotShowVariableSettings.Never}
                                    char={Teams2Service.convertCharacter(char!)}
                                    charData={char}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {flex.length > 0 && (
                    <>
                        {core.length > 0 && <div className="self-stretch w-px bg-slate-300 dark:bg-slate-700 mx-4" />}
                        <div className="flex flex-wrap items-start flex-1 gap-2 flex-auto flex-min-w-[120px]">
                            {flex.map(char => (
                                <div
                                    key={char.snowprintId}
                                    onClick={() => onCharClicked(char)}
                                    className="cursor-pointer transition-transform duration-100 active:scale-95 hover:brightness-110">
                                    <RosterSnapshotCharacter
                                        showMythicShards={RosterSnapshotShowVariableSettings.Never}
                                        showShards={RosterSnapshotShowVariableSettings.Never}
                                        showXpLevel={RosterSnapshotShowVariableSettings.Never}
                                        char={Teams2Service.convertCharacter(char!)}
                                        charData={char}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {mows.length > 0 && (
                    <>
                        {(core.length > 0 || flex.length > 0) && (
                            <div className="self-stretch w-px bg-slate-300 dark:bg-slate-700 mx-4" />
                        )}
                        <div className="flex flex-wrap items-start flex-1 gap-2 flex-auto flex-min-w-[120px]">
                            {mows.map(mow => (
                                <div
                                    key={mow.snowprintId}
                                    onClick={() => onMowClicked(mow)}
                                    className="cursor-pointer transition-transform duration-100 active:scale-95 hover:brightness-110">
                                    <RosterSnapshotCharacter
                                        showMythicShards={RosterSnapshotShowVariableSettings.Never}
                                        showShards={RosterSnapshotShowVariableSettings.Never}
                                        showXpLevel={RosterSnapshotShowVariableSettings.Never}
                                        mow={Teams2Service.convertMow(mow)}
                                        mowData={mow}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
