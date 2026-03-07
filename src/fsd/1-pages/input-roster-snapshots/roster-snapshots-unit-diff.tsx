// eslint-disable-next-line import-x/no-internal-modules
import { RosterSnapshotDiffStyle, RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { ISnapshotCharacter, ISnapshotMachineOfWar, ISnapshotUnitDiff } from './models';
import { RosterSnapshotsUnitDiffDetailed } from './roster-snapshots-unit-diff-detailed';
import { RosterSnapshotsUnitDiffSideBySide } from './roster-snapshots-unit-diff-side-by-side';

interface Properties {
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

export const RosterSnapshotsUnitDiff: React.FC<Properties> = ({
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
}: Properties) => {
    return diffStyle === RosterSnapshotDiffStyle.SideBySide ? (
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
    ) : (
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
