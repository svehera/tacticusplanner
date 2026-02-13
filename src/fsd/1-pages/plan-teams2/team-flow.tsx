/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { ICharacter2 } from '@/models/interfaces';

import { IMow2 } from '@/fsd/4-entities/mow';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { RosterSnapshotCharacter } from '../input-roster-snapshots/roster-snapshot-character';

import { Teams2Service } from './teams2.service';

interface Props {
    chars: ICharacter2[];
    mows: IMow2[];
    disabledUnits?: string[]; // List of character snowprintIds that should be shown as disabled
    flexIndex?: number;
    onCharClicked: (char: ICharacter2) => void;
    onMowClicked: (mow: IMow2) => void;
}

export const TeamFlow: React.FC<Props> = ({
    chars,
    mows,
    disabledUnits,
    flexIndex,
    onCharClicked,
    onMowClicked,
}: Props) => {
    console.log(
        'Rendering TeamFlow with chars:',
        chars,
        'mows:',
        mows,
        'disabledUnits:',
        disabledUnits,
        'flexIndex:',
        flexIndex
    );
    const core = chars.slice(0, flexIndex ?? chars.length);
    const flex = chars.slice(flexIndex ?? chars.length);

    return (
        <div className="w-full rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-black/10">
            <div className="flex-min-w-[120px] flex flex-1 flex-auto flex-wrap items-start gap-2">
                {core.map(char => (
                    <div
                        key={char.snowprintId}
                        onClick={() => onCharClicked(char)}
                        className="cursor-pointer transition-transform duration-100 hover:brightness-110 active:scale-95">
                        <RosterSnapshotCharacter
                            showMythicShards={RosterSnapshotShowVariableSettings.Never}
                            showShards={RosterSnapshotShowVariableSettings.Never}
                            showXpLevel={RosterSnapshotShowVariableSettings.Never}
                            char={Teams2Service.convertCharacter(char!)}
                            charData={char}
                            isDisabled={disabledUnits?.includes(char.snowprintId!)}
                        />
                    </div>
                ))}

                {flex.length > 0 && (
                    <>
                        {core.length > 0 && <div className="mx-4 w-px self-stretch bg-slate-300 dark:bg-slate-700" />}
                        {flex.map(char => (
                            <div
                                key={char.snowprintId}
                                onClick={() => onCharClicked(char)}
                                className="cursor-pointer transition-transform duration-100 hover:brightness-110 active:scale-95">
                                <RosterSnapshotCharacter
                                    showMythicShards={RosterSnapshotShowVariableSettings.Never}
                                    showShards={RosterSnapshotShowVariableSettings.Never}
                                    showXpLevel={RosterSnapshotShowVariableSettings.Never}
                                    char={Teams2Service.convertCharacter(char!)}
                                    charData={char}
                                    isDisabled={disabledUnits?.includes(char.snowprintId!)}
                                />
                            </div>
                        ))}
                    </>
                )}

                {mows.length > 0 && (
                    <>
                        {(core.length > 0 || flex.length > 0) && (
                            <div className="mx-4 w-px self-stretch bg-slate-300 dark:bg-slate-700" />
                        )}
                        {mows.map(mow => (
                            <div
                                key={mow.snowprintId}
                                onClick={() => onMowClicked(mow)}
                                className="cursor-pointer transition-transform duration-100 hover:brightness-110 active:scale-95">
                                <RosterSnapshotCharacter
                                    showMythicShards={RosterSnapshotShowVariableSettings.Never}
                                    showShards={RosterSnapshotShowVariableSettings.Never}
                                    showXpLevel={RosterSnapshotShowVariableSettings.Never}
                                    mow={Teams2Service.convertMow(mow)}
                                    mowData={mow}
                                    isDisabled={disabledUnits?.includes(mow.snowprintId!)}
                                />
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};
