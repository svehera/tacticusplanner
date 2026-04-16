/* eslint-disable import-x/no-internal-modules */
import { ISnapshotCharacter, ISnapshotMachineOfWar } from '@/fsd/5-shared/ui/unit-portrait';

import { RosterSnapshotDiffStyle, RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { ISnapshotUnitDiff } from './models';
import { RosterSnapshotsUnitDiffDetailed } from './roster-snapshots-unit-diff-detailed';
import { RosterSnapshotsUnitDiffSideBySide } from './roster-snapshots-unit-diff-side-by-side';

interface Props {
    showShards: RosterSnapshotShowVariableSettings;
    showMythicShards: RosterSnapshotShowVariableSettings;
    showXpLevel: RosterSnapshotShowVariableSettings;
    showAbilities: RosterSnapshotShowVariableSettings;
    showEquipment: RosterSnapshotShowVariableSettings;
    showTooltip: boolean;
    diffStyle: RosterSnapshotDiffStyle;
    char?: ISnapshotCharacter;
    mow?: ISnapshotMachineOfWar;
    diff: ISnapshotUnitDiff;
}

export const RosterSnapshotsUnitDiff: React.FC<Props> = ({
    showShards,
    showMythicShards,
    showXpLevel,
    showAbilities,
    showEquipment,
    showTooltip,
    diffStyle,
    char,
    mow,
    diff,
}: Props) => {
    if (diffStyle === RosterSnapshotDiffStyle.SideBySide)
        return (
            <RosterSnapshotsUnitDiffSideBySide
                showShards={showShards}
                showMythicShards={showMythicShards}
                showXpLevel={showXpLevel}
                showAbilities={showAbilities}
                showEquipment={showEquipment}
                showTooltip={showTooltip}
                char={char}
                mow={mow}
                diff={diff}
            />
        );
    return (
        <RosterSnapshotsUnitDiffDetailed
            showShards={showShards}
            showMythicShards={showMythicShards}
            showXpLevel={showXpLevel}
            showAbilities={showAbilities}
            showEquipment={showEquipment}
            char={char}
            mow={mow}
            diff={diff}
        />
    );
};
