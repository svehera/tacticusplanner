import AddAPhoto from '@mui/icons-material/AddAPhoto';
import Settings from '@mui/icons-material/Settings';
import { Button, Tooltip } from '@mui/material';
import { cloneDeep, orderBy } from 'lodash';
import { ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { Rank } from '@/fsd/5-shared/model';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';
import { SyncButton } from '@/fsd/5-shared/ui/sync-button';

import { CharactersService, ICharacter2 } from '@/fsd/4-entities/character';
import { LegendaryEventEnum, LegendaryEventService, LreTrackId } from '@/fsd/4-entities/lre';
// eslint-disable-next-line import-x/order
import { IMow2, MowsService } from '@/fsd/4-entities/mow';

// eslint-disable-next-line import-x/no-internal-modules
import { CharactersPowerService } from '@/fsd/4-entities/unit/characters-power.service';

import { getLre, ILreTeam } from '@/fsd/3-features/lre';
// eslint-disable-next-line import-x/no-internal-modules
import { RosterSnapshotDiffStyle, RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { ManageSnapshotsDialog } from './manage-snapshots-dialog';
import { IRosterSnapshot, IRosterSnapshotsState } from './models';
import { RosterFilterDropdown } from './roster-filter-dropdown';
import { RosterSnapshotsAssetsProvider } from './roster-snapshots-assets-provider';
import { RosterSnapshotsGroupedDisplay, RosterSnapshotsGroupedSection } from './roster-snapshots-grouped-display';
import { RosterSnapshotsMagnificationSlider } from './roster-snapshots-magnification-slider';
import { RosterSnapshotsService } from './roster-snapshots-service';
import { RosterSnapshotsUnit } from './roster-snapshots-unit';
import { RosterSnapshotsUnitDiff } from './roster-snapshots-unit-diff';
import { TakeSnapshotDialog } from './take-snapshot-dialog';

interface CharDiff {
    before: ICharacter2;
    after: ICharacter2;
    powerDiff: number;
    logPowerDiff: number;
}

interface MachineOfWarDiff {
    before: IMow2;
    after: IMow2;
    powerDiff: number;
    logPowerDiff: number;
}

const isCharDiff = (unit: CharDiff | MachineOfWarDiff): unit is CharDiff => 'rank' in unit.before;
const isMowDiff = (unit: CharDiff | MachineOfWarDiff): unit is MachineOfWarDiff => !isCharDiff(unit);
type CharacterType = ICharacter2 & { power: number };
type MowType = IMow2 & { power: number };
const isCharacterType = (unit: CharacterType | MowType): unit is CharacterType => 'rank' in unit;
const isMowType = (unit: CharacterType | MowType): unit is MowType => !isCharacterType(unit);

type TeamCategoryKey = 'warOffense' | 'warDefense' | 'raid' | 'ta' | 'horde';

const TEAM_CATEGORY_OPTIONS: Array<{ key: TeamCategoryKey; label: string; token: string }> = [
    { key: 'warOffense', label: 'All Guild War Offense Teams', token: '__all-war-offense__' },
    { key: 'warDefense', label: 'All Guild War Defense Teams', token: '__all-war-defense__' },
    { key: 'raid', label: 'All Raid Teams', token: '__all-raid__' },
    { key: 'ta', label: 'All Tournament Arena Teams', token: '__all-ta__' },
    { key: 'horde', label: 'All Horde Teams', token: '__all-horde__' },
];

interface TeamDisplaySpec {
    id: string;
    title: string;
    chars: string[];
    mows: string[];
    hideInnerTitle?: boolean;
}

interface TeamDisplaySection {
    id: string;
    title: string;
    sections?: TeamDisplaySection[];
    teams?: TeamDisplaySpec[];
}

function getDisplayByTeamSections(
    zoom: number,
    chars: ICharacter2[],
    mows: IMow2[],
    rosterSnapshots: IRosterSnapshotsState,
    left: number,
    right: number,
    diffStyle: RosterSnapshotDiffStyle,
    showShards: RosterSnapshotShowVariableSettings,
    showMythicShards: RosterSnapshotShowVariableSettings,
    showXpLevel: RosterSnapshotShowVariableSettings,
    showEquipment: RosterSnapshotShowVariableSettings,
    showShardDiffs: RosterSnapshotShowVariableSettings,
    showMythicShardsDiffs: RosterSnapshotShowVariableSettings,
    showXpLevelDiffs: RosterSnapshotShowVariableSettings,
    showEquipmentDiffs: RosterSnapshotShowVariableSettings,
    teamSections: TeamDisplaySection[]
) {
    if (rosterSnapshots.base === undefined) {
        return getDisplay(
            zoom,
            chars,
            mows,
            rosterSnapshots,
            left,
            right,
            diffStyle,
            showShards,
            showMythicShards,
            showXpLevel,
            showEquipment,
            showShardDiffs,
            showMythicShardsDiffs,
            showXpLevelDiffs,
            showEquipmentDiffs,
            new Set<string>()
        );
    }

    let leftIndex = left;
    let rightIndex = right;
    if (leftIndex < -1) leftIndex = -1;
    if (leftIndex > rosterSnapshots.diffs.length - 1) leftIndex = rosterSnapshots.diffs.length - 1;
    if (rightIndex <= leftIndex) rightIndex = leftIndex + 1;
    if (rightIndex > rosterSnapshots.diffs.length) rightIndex = rosterSnapshots.diffs.length;

    let base = RosterSnapshotsService.fixSnapshot(rosterSnapshots.base);
    for (let index = 0; index <= leftIndex; index++) {
        base = RosterSnapshotsService.fixSnapshot(
            RosterSnapshotsService.resolveSnapshotDiff(base, rosterSnapshots.diffs[index])
        );
    }

    let compare: IRosterSnapshot = base;
    if (rightIndex < rosterSnapshots.diffs.length) {
        for (let index = leftIndex + 1; index <= rightIndex; index++) {
            compare = RosterSnapshotsService.fixSnapshot(
                RosterSnapshotsService.resolveSnapshotDiff(compare, rosterSnapshots.diffs[index])
            );
        }
    } else {
        compare = RosterSnapshotsService.fixSnapshot(
            RosterSnapshotsService.createSnapshot('Current Roster', Date.now(), chars, mows)
        );
    }

    const diff = RosterSnapshotsService.diffSnapshots(
        base,
        compare,
        showShardDiffs !== RosterSnapshotShowVariableSettings.Never,
        showMythicShardsDiffs !== RosterSnapshotShowVariableSettings.Never,
        showXpLevelDiffs !== RosterSnapshotShowVariableSettings.Never,
        showEquipmentDiffs !== RosterSnapshotShowVariableSettings.Never
    );

    const staticCharById = new Map(chars.map(char => [char.snowprintId, char]));
    const staticMowById = new Map(mows.map(mow => [mow.snowprintId, mow]));
    const baseCharById = new Map(base.chars.map(char => [char.id, char]));
    const compareCharById = new Map(compare.chars.map(char => [char.id, char]));
    const diffCharById = new Map(diff.charDiffs.map(charDiff => [charDiff.id, charDiff]));
    const baseMowById = new Map(base.mows.map(mow => [mow.id, mow]));
    const compareMowById = new Map(compare.mows.map(mow => [mow.id, mow]));
    const diffMowById = new Map(diff.mowDiffs.map(mowDiff => [mowDiff.id, mowDiff]));

    const toFullChar = (charId: string, source: 'base' | 'compare') => {
        const staticChar = staticCharById.get(charId);
        const snapshotChar = source === 'base' ? baseCharById.get(charId) : compareCharById.get(charId);
        if (!staticChar || !snapshotChar) {
            return;
        }

        return {
            ...staticChar,
            ...snapshotChar,
            id: staticChar.id,
            level: snapshotChar.xpLevel,
            equipment: [
                { id: snapshotChar.equip0?.id ?? '', level: snapshotChar.equip0Level ?? 0 },
                { id: snapshotChar.equip1?.id ?? '', level: snapshotChar.equip1Level ?? 0 },
                { id: snapshotChar.equip2?.id ?? '', level: snapshotChar.equip2Level ?? 0 },
            ],
        };
    };

    const toFullMow = (mowId: string, source: 'base' | 'compare') => {
        const staticMow = staticMowById.get(mowId);
        const snapshotMow = source === 'base' ? baseMowById.get(mowId) : compareMowById.get(mowId);
        if (!staticMow || !snapshotMow) {
            return;
        }

        return {
            ...staticMow,
            ...snapshotMow,
            id: staticMow.id,
            unlocked: !snapshotMow.locked,
        };
    };

    const renderTeam = (team: TeamDisplaySpec) => {
        const diffItems: ReactNode[] = [];
        const unitItems: ReactNode[] = [];
        const uniqueChars = [...new Set(team.chars)];
        const uniqueMows = [...new Set(team.mows)];

        for (const charId of uniqueChars) {
            const afterChar = toFullChar(charId, 'compare');
            if (!afterChar) {
                continue;
            }

            const beforeChar = toFullChar(charId, 'base');
            const hasDiff = diffCharById.has(charId) && !!beforeChar;

            if (hasDiff && beforeChar) {
                diffItems.push(
                    <RosterSnapshotsUnitDiff
                        key={`${team.id}-diff-char-${charId}`}
                        diffStyle={diffStyle}
                        showShards={showShards}
                        showMythicShards={showMythicShards}
                        showXpLevel={showXpLevel}
                        showEquipment={showEquipment}
                        showAbilities={RosterSnapshotShowVariableSettings.Always}
                        showTooltip={true}
                        char={RosterSnapshotsService.snapshotCharacter(beforeChar)}
                        diff={RosterSnapshotsService.diffChar(beforeChar, afterChar)}
                    />
                );
                continue;
            }

            unitItems.push(
                <RosterSnapshotsUnit
                    key={`${team.id}-char-${charId}`}
                    showShards={showShards}
                    showMythicShards={showMythicShards}
                    showXpLevel={showXpLevel}
                    showAbilities={RosterSnapshotShowVariableSettings.Always}
                    showEquipment={showEquipment}
                    showTooltip={true}
                    char={RosterSnapshotsService.snapshotCharacter(afterChar)}
                    isEnabled={afterChar.rank !== Rank.Locked}
                />
            );
        }

        for (const mowId of uniqueMows) {
            const afterMow = toFullMow(mowId, 'compare');
            if (!afterMow) {
                continue;
            }

            const beforeMow = toFullMow(mowId, 'base');
            const hasDiff = diffMowById.has(mowId) && !!beforeMow;

            if (hasDiff && beforeMow) {
                diffItems.push(
                    <RosterSnapshotsUnitDiff
                        key={`${team.id}-diff-mow-${mowId}`}
                        diffStyle={diffStyle}
                        showShards={showShards}
                        showMythicShards={showMythicShards}
                        showXpLevel={showXpLevel}
                        showEquipment={showEquipment}
                        showAbilities={RosterSnapshotShowVariableSettings.Always}
                        showTooltip={true}
                        mow={RosterSnapshotsService.snapshotMachineOfWar(beforeMow)}
                        diff={RosterSnapshotsService.diffMow(beforeMow, afterMow)}
                    />
                );
                continue;
            }

            unitItems.push(
                <RosterSnapshotsUnit
                    key={`${team.id}-mow-${mowId}`}
                    showShards={showShards}
                    showMythicShards={showMythicShards}
                    showXpLevel={showXpLevel}
                    showAbilities={RosterSnapshotShowVariableSettings.Always}
                    showEquipment={showEquipment}
                    showTooltip={true}
                    mow={RosterSnapshotsService.snapshotMachineOfWar(afterMow)}
                    isEnabled={afterMow.unlocked}
                />
            );
        }

        return {
            id: team.id,
            title: team.title,
            hideTitle: team.hideInnerTitle,
            diffItems,
            unitItems,
        };
    };

    const renderSection = (section: TeamDisplaySection): RosterSnapshotsGroupedSection => {
        return {
            id: section.id,
            title: section.title,
            teams: section.teams?.map(team => renderTeam(team)),
            sections: section.sections?.map(subsection => ({
                id: subsection.id,
                title: subsection.title,
                teams: subsection.teams?.map(team => renderTeam(team)),
                sections: subsection.sections?.map(subsubsection => ({
                    id: subsubsection.id,
                    title: subsubsection.title,
                    teams: subsubsection.teams?.map(team => renderTeam(team)),
                })),
            })),
        };
    };

    return (
        <RosterSnapshotsAssetsProvider>
            <RosterSnapshotsGroupedDisplay zoom={zoom} sections={teamSections.map(section => renderSection(section))} />
        </RosterSnapshotsAssetsProvider>
    );
}

function getDisplay(
    zoom: number,
    chars: ICharacter2[],
    mows: IMow2[],
    rosterSnapshots: IRosterSnapshotsState,
    left: number,
    right: number,
    diffStyle: RosterSnapshotDiffStyle,
    showShards: RosterSnapshotShowVariableSettings,
    showMythicShards: RosterSnapshotShowVariableSettings,
    showXpLevel: RosterSnapshotShowVariableSettings,
    showEquipment: RosterSnapshotShowVariableSettings,
    showShardDiffs: RosterSnapshotShowVariableSettings,
    showMythicShardsDiffs: RosterSnapshotShowVariableSettings,
    showXpLevelDiffs: RosterSnapshotShowVariableSettings,
    showEquipmentDiffs: RosterSnapshotShowVariableSettings,
    includedUnitIds: Set<string>
) {
    const hasUnitFilter = includedUnitIds.size > 0;

    let leftIndex = left;
    let rightIndex = right;
    if (leftIndex < -1) leftIndex = -1;
    if (leftIndex > rosterSnapshots.diffs.length - 1) leftIndex = rosterSnapshots.diffs.length - 1;
    if (rightIndex <= leftIndex) rightIndex = leftIndex + 1;
    if (rightIndex > rosterSnapshots.diffs.length) rightIndex = rosterSnapshots.diffs.length;
    if (rosterSnapshots.base === undefined) {
        const powerChars = RosterSnapshotsService.createSnapshot("sum'n", Date.now(), chars, mows).chars.map(c => ({
            ...c,
            power: CharactersPowerService.getCharacterPower(chars.find(char => char.snowprintId === c.id)!),
        }));
        const poweredMows = RosterSnapshotsService.createSnapshot("sum'n", Date.now(), chars, mows).mows.map(m => ({
            ...m,
            power: CharactersPowerService.getCharacterPower(mows.find(mow => mow.snowprintId === m.id)!),
        }));

        const powerUnits = orderBy([...powerChars, ...poweredMows], 'power', 'desc').filter(
            unit => !hasUnitFilter || includedUnitIds.has(unit.id)
        );
        return (
            <div className="flex flex-wrap gap-2 p-2 sm:gap-5 sm:p-4">
                {powerUnits.map(unit => (
                    <div key={`power-${unit.id}`}>
                        <RosterSnapshotsAssetsProvider>
                            <RosterSnapshotsUnit
                                showShards={showShards}
                                showMythicShards={showMythicShards}
                                showXpLevel={showXpLevel}
                                showAbilities={RosterSnapshotShowVariableSettings.Always}
                                showEquipment={showEquipment}
                                showTooltip={true}
                                char={'rank' in unit ? unit : undefined}
                                mow={'rank' in unit ? undefined : unit}
                                isEnabled={'rank' in unit ? unit.rank !== Rank.Locked : !unit.locked}
                            />
                        </RosterSnapshotsAssetsProvider>
                    </div>
                ))}
            </div>
        );
    }
    let base = RosterSnapshotsService.fixSnapshot(rosterSnapshots.base);
    for (let index = 0; index <= leftIndex; index++) {
        base = RosterSnapshotsService.fixSnapshot(
            RosterSnapshotsService.resolveSnapshotDiff(base, rosterSnapshots.diffs[index])
        );
    }
    let compare: IRosterSnapshot = base;
    if (rightIndex < rosterSnapshots.diffs.length) {
        for (let index = leftIndex + 1; index <= rightIndex; index++) {
            compare = RosterSnapshotsService.fixSnapshot(
                RosterSnapshotsService.resolveSnapshotDiff(compare, rosterSnapshots.diffs[index])
            );
        }
    } else {
        compare = RosterSnapshotsService.fixSnapshot(
            RosterSnapshotsService.createSnapshot('Current Roster', Date.now(), chars, mows)
        );
    }
    const diff = RosterSnapshotsService.diffSnapshots(
        base,
        compare,
        showShardDiffs !== RosterSnapshotShowVariableSettings.Never,
        showMythicShardsDiffs !== RosterSnapshotShowVariableSettings.Never,
        showXpLevelDiffs !== RosterSnapshotShowVariableSettings.Never,
        showEquipmentDiffs !== RosterSnapshotShowVariableSettings.Never
    );

    const diffChars: Array<CharDiff> = [];
    const diffMows: Array<MachineOfWarDiff> = [];

    const nonDiffChars: Array<CharacterType> = [];
    const nonDiffMows: Array<MowType> = [];

    const baseChars = base.chars;
    const compareChars = compare.chars;

    for (const compareChar of compareChars) {
        if (hasUnitFilter && !includedUnitIds.has(compareChar.id)) {
            continue;
        }

        const baseChar = baseChars.find(c => c.id === compareChar.id);
        const diffChar = diff.charDiffs.find(c => c.id === compareChar.id);
        const fullChar = chars.find(c => c.snowprintId === compareChar.id);

        if (fullChar === undefined) continue;

        if (diffChar !== undefined && baseChar !== undefined) {
            const beforeChar = {
                ...fullChar,
                ...baseChar,
                level: baseChar.xpLevel,
                id: fullChar.id,
                equipment: [
                    { id: baseChar.equip0?.id ?? '', level: baseChar.equip0Level ?? 0 },
                    { id: baseChar.equip1?.id ?? '', level: baseChar.equip1Level ?? 0 },
                    { id: baseChar.equip2?.id ?? '', level: baseChar.equip2Level ?? 0 },
                ],
            };
            const afterChar = {
                ...fullChar,
                ...compareChar,
                level: compareChar.xpLevel,
                id: fullChar.id,
                equipment: [
                    { id: compareChar.equip0?.id ?? '', level: compareChar.equip0Level ?? 0 },
                    { id: compareChar.equip1?.id ?? '', level: compareChar.equip1Level ?? 0 },
                    { id: compareChar.equip2?.id ?? '', level: compareChar.equip2Level ?? 0 },
                ],
            };
            const powerBefore =
                beforeChar.rank === Rank.Locked ? 0 : CharactersPowerService.getCharacterPower(beforeChar);
            const powerAfter = afterChar.rank === Rank.Locked ? 0 : CharactersPowerService.getCharacterPower(afterChar);
            diffChars.push({
                before: beforeChar,
                after: afterChar,
                powerDiff: Math.abs(powerAfter - powerBefore),
                logPowerDiff: Math.abs(
                    (powerAfter === 0 ? 0 : Math.log(powerAfter)) - (powerBefore === 0 ? 0 : Math.log(powerBefore))
                ),
            });
        } else {
            const power = CharactersPowerService.getCharacterPower({ ...fullChar, ...compareChar, id: fullChar.id });
            nonDiffChars.push({ ...fullChar, ...compareChar, power });
        }
    }

    const baseMows = base.mows;
    const compareMows = compare.mows;

    for (const compareMow of compareMows) {
        if (hasUnitFilter && !includedUnitIds.has(compareMow.id)) {
            continue;
        }

        const baseMow = baseMows.find(m => m.id === compareMow.id);
        const diffMow = diff.mowDiffs.find(m => m.id === compareMow.id);
        const fullMow = mows.find(m => m.snowprintId === compareMow.id);

        if (!fullMow) continue;

        if (diffMow && baseMow) {
            const beforeMow = { ...fullMow, ...baseMow, id: fullMow.id };
            const afterMow = { ...fullMow, ...compareMow, id: fullMow.id };
            const powerBefore = beforeMow.locked ? 0 : CharactersPowerService.getCharacterPower(beforeMow);
            const powerAfter = afterMow.locked ? 0 : CharactersPowerService.getCharacterPower(afterMow);
            diffMows.push({
                before: beforeMow,
                after: afterMow,
                powerDiff: Math.abs(powerAfter - powerBefore),
                logPowerDiff: Math.abs(
                    (powerAfter === 0 ? 0 : Math.log(powerAfter)) - (powerBefore === 0 ? 0 : Math.log(powerBefore))
                ),
            });
        } else {
            const power = CharactersPowerService.getCharacterPower({ ...fullMow, ...compareMow });
            nonDiffMows.push({ ...fullMow, ...compareMow, power });
        }
    }

    const diffUnits = orderBy([...diffChars, ...diffMows], 'powerDiff', 'desc');
    const nonDiffUnits = orderBy([...nonDiffChars, ...nonDiffMows], 'power', 'desc');
    const diffCache = (() => {
        const cache = {
            chars: diffUnits.filter(unit => isCharDiff(unit)),
            mows: diffUnits.filter(unit => isMowDiff(unit)),
        };
        return {
            chars: cache.chars.map(c => ({
                before: RosterSnapshotsService.snapshotCharacter(c.before),
                diff: RosterSnapshotsService.diffChar(c.before, c.after),
            })),
            mows: cache.mows.map(m => ({
                before: RosterSnapshotsService.snapshotMachineOfWar(m.before),
                diff: RosterSnapshotsService.diffMow(m.before, m.after),
            })),
        };
    })();

    const nonDiffCache = (() => {
        const cache = {
            chars: nonDiffUnits.filter(unit => isCharacterType(unit)),
            mows: nonDiffUnits.filter(unit => isMowType(unit)),
        };
        return {
            chars: cache.chars.map(c => RosterSnapshotsService.snapshotCharacter(c)),
            mows: cache.mows.map(m => RosterSnapshotsService.snapshotMachineOfWar(m)),
        };
    })();

    const renderedCharDiffs = diffCache.chars.map(unit => (
        <RosterSnapshotsUnitDiff
            key={`diff-${unit.before.id}`}
            diffStyle={diffStyle}
            showShards={showShards}
            showMythicShards={showMythicShards}
            showXpLevel={showXpLevel}
            showEquipment={showEquipment}
            showAbilities={RosterSnapshotShowVariableSettings.Always}
            showTooltip={true}
            char={unit.before}
            diff={unit.diff}
        />
    ));

    const renderedMowDiffs = diffCache.mows.map(unit => (
        <RosterSnapshotsUnitDiff
            key={`diff-${unit.before.id}`}
            diffStyle={diffStyle}
            showShards={showShards}
            showMythicShards={showMythicShards}
            showXpLevel={showXpLevel}
            showEquipment={showEquipment}
            showAbilities={RosterSnapshotShowVariableSettings.Always}
            showTooltip={true}
            mow={unit.before}
            diff={unit.diff}
        />
    ));

    const renderedChars = nonDiffCache.chars.map(unit => (
        <RosterSnapshotsUnit
            key={`nondiff-${unit.id}`}
            showShards={showShards}
            showMythicShards={showMythicShards}
            showXpLevel={showXpLevel}
            showAbilities={RosterSnapshotShowVariableSettings.Always}
            showEquipment={showEquipment}
            showTooltip={true}
            char={unit}
            isEnabled={unit.rank !== Rank.Locked}
        />
    ));

    const renderedMows = nonDiffCache.mows.map(unit => (
        <RosterSnapshotsUnit
            key={`nondiff-${unit.id}`}
            showShards={showShards}
            showMythicShards={showMythicShards}
            showXpLevel={showXpLevel}
            showAbilities={RosterSnapshotShowVariableSettings.Always}
            showEquipment={showEquipment}
            showTooltip={true}
            mow={unit}
            isEnabled={!unit.locked}
        />
    ));

    return (
        <>
            <RosterSnapshotsAssetsProvider>
                <div style={{ zoom }} className="flex flex-wrap gap-2 p-2 sm:gap-5 sm:p-4">
                    {renderedCharDiffs}
                    {renderedMowDiffs}
                </div>
                <div style={{ zoom }} className="flex flex-wrap gap-2 p-2 sm:gap-5 sm:p-4">
                    {renderedChars.filter(char => char.props.isEnabled)}
                    {renderedMows.filter(mow => mow.props.isEnabled)}
                    {renderedChars.filter(char => !char.props.isEnabled)}
                    {renderedMows.filter(mow => !mow.props.isEnabled)}
                </div>
            </RosterSnapshotsAssetsProvider>
        </>
    );
}

export const RosterSnapshots = () => {
    const {
        characters,
        mows: unresolvedMows,
        rosterSnapshots,
        viewPreferences,
        teams2,
        leSelectedTeams,
    } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const chars = CharactersService.resolveStoredCharacters(characters);
    const mows = MowsService.resolveAllFromStorage(unresolvedMows);
    const [isTakeSnapshotDialogOpen, setIsTakeSnapshotDialogOpen] = useState(false);
    const [currentTimeMillis, setCurrentTimeMillis] = useState<number>(Date.now());
    const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
    const [leftIndex, setLeftIndex] = useState<number>(rosterSnapshots.diffs.length - 1);
    const [rightIndex, setRightIndex] = useState<number>(rosterSnapshots.diffs.length);
    const [liveSnapshotIndices, setLiveSnapshotIndices] = useState<number[]>(
        RosterSnapshotsService.getLiveSnapshotInidices(rosterSnapshots)
    );
    const [diffStyleSetting, setDiffStyleSetting] = useState<RosterSnapshotDiffStyle>(
        viewPreferences.rosterSnapshotsDiffStyle
    );
    const [showShardsSetting, setShowShardsSetting] = useState<RosterSnapshotShowVariableSettings>(
        viewPreferences.showShardsInRosterSnapshots
    );
    const [showMythicShardsSetting, setShowMythicShardsSetting] = useState<RosterSnapshotShowVariableSettings>(
        viewPreferences.showMythicShardsInRosterSnapshots
    );
    const [showXpLevelSetting, setShowXpLevelSetting] = useState<RosterSnapshotShowVariableSettings>(
        viewPreferences.showXpLevelInRosterSnapshots
    );
    const [showEquipmentSetting, setShowEquipmentSetting] = useState<RosterSnapshotShowVariableSettings>(
        viewPreferences.showEquipmentInRosterSnapshots
    );
    const [showShardDiffsSetting, setShowShardDiffsSetting] = useState<RosterSnapshotShowVariableSettings>(
        viewPreferences.showShardsInDiffs
    );
    const [showMythicShardsDiffsSetting, setShowMythicShardsDiffsSetting] =
        useState<RosterSnapshotShowVariableSettings>(viewPreferences.showMythicShardsInDiffs);
    const [showXpLevelDiffsSetting, setShowXpLevelDiffsSetting] = useState<RosterSnapshotShowVariableSettings>(
        viewPreferences.showXpLevelInDiffs
    );
    const [showEquipmentDiffsSetting, setShowEquipmentDiffsSetting] = useState<RosterSnapshotShowVariableSettings>(
        viewPreferences.showEquipmentInDiffs
    );
    const [selectedManualTeamNames, setSelectedManualTeamNames] = useState<string[]>([]);
    const [selectedCategoryTokens, setSelectedCategoryTokens] = useState<string[]>([]);
    const [selectedLeOptionTokens, setSelectedLeOptionTokens] = useState<string[]>([]);
    const [zoom, setZoom] = useState<number>(1);

    const teamsByCategory = useMemo(() => {
        return TEAM_CATEGORY_OPTIONS.map(option => ({
            ...option,
            teamNames: teams2.filter(team => Boolean(team[option.key])).map(team => team.name),
        }));
    }, [teams2]);

    const categorySelectionState = useMemo(() => {
        const selectedTokens = new Set(selectedCategoryTokens);
        return teamsByCategory.map(category => ({
            ...category,
            isSelected: selectedTokens.has(category.token),
        }));
    }, [selectedCategoryTokens, teamsByCategory]);

    const selectedTeamNames = useMemo(() => {
        const selected = new Set(selectedManualTeamNames);

        for (const category of categorySelectionState) {
            if (!category.isSelected) {
                continue;
            }

            for (const teamName of category.teamNames) {
                selected.add(teamName);
            }
        }

        return [...selected];
    }, [selectedManualTeamNames, categorySelectionState]);

    const leSelectionGroups = useMemo(() => {
        type TrackOption = 'all' | LreTrackId;
        const tracks: Array<{ key: TrackOption; label: string }> = [
            { key: 'all', label: 'All' },
            { key: 'alpha', label: 'Alpha' },
            { key: 'beta', label: 'Beta' },
            { key: 'gamma', label: 'Gamma' },
        ];

        const unfinishedEvents = LegendaryEventService.getUnfinishedEvents();

        return unfinishedEvents.map(event => {
            const eventTeams: ILreTeam[] = leSelectedTeams[event.id as LegendaryEventEnum]?.teams ?? [];
            const eventCharacter = CharactersService.charactersData.find(x => x.snowprintId === event.unitSnowprintId);
            const eventName = eventCharacter?.shortName || eventCharacter?.name || event.name;

            const getTeamUnitIds = (track: TrackOption) => {
                const matchingTeams: ILreTeam[] =
                    track === 'all' ? eventTeams : eventTeams.filter(team => team.section === (track as LreTrackId));

                const allIds: string[] = matchingTeams.flatMap(
                    team => team.charSnowprintIds ?? team.charactersIds ?? []
                );
                return [...new Set(allIds)];
            };

            const trackOptions = tracks.map(track => {
                return {
                    token: `__le-${event.id}-${track.key}__`,
                    key: track.key,
                    label: track.label,
                    unitIds: getTeamUnitIds(track.key),
                };
            });

            return {
                id: event.id,
                eventEnum: event.id as LegendaryEventEnum,
                label: `LE ${eventName}`,
                icon: eventCharacter?.roundIcon ?? '',
                tracks: trackOptions,
            };
        });
    }, [leSelectedTeams]);

    const leSelectionOptions = useMemo(() => {
        return leSelectionGroups.flatMap(group => group.tracks);
    }, [leSelectionGroups]);

    const selectedLeOptions = useMemo(() => {
        const selectedLeTokens = new Set(selectedLeOptionTokens);
        return leSelectionOptions.filter(option => selectedLeTokens.has(option.token));
    }, [leSelectionOptions, selectedLeOptionTokens]);

    const selectedFilterCount = useMemo(() => {
        const selectedTeamTypeCount = categorySelectionState.filter(category => category.isSelected).length;
        return selectedManualTeamNames.length + selectedTeamTypeCount + selectedLeOptionTokens.length;
    }, [selectedManualTeamNames, categorySelectionState, selectedLeOptionTokens]);

    const selectedTeamNamesSet = useMemo(() => new Set(selectedTeamNames), [selectedTeamNames]);
    const selectedLeTokensSet = useMemo(() => new Set(selectedLeOptionTokens), [selectedLeOptionTokens]);

    const teamFilterOptions = useMemo(
        () =>
            teams2.map(team => ({
                name: team.name,
                isSelected: selectedTeamNamesSet.has(team.name),
            })),
        [teams2, selectedTeamNamesSet]
    );

    const teamTypeFilterOptions = useMemo(
        () =>
            categorySelectionState.map(category => ({
                token: category.token,
                label: category.label,
                isSelected: category.isSelected,
                disabled: category.teamNames.length === 0,
            })),
        [categorySelectionState]
    );

    const legendaryEventFilterOptions = useMemo(
        () =>
            leSelectionGroups.map(group => ({
                id: group.id,
                label: group.label,
                icon: group.icon,
                tracks: group.tracks.map(track => ({
                    token: track.token,
                    label: track.label,
                    isSelected: selectedLeTokensSet.has(track.token),
                    disabled: track.unitIds.length === 0,
                })),
            })),
        [leSelectionGroups, selectedLeTokensSet]
    );

    const rosterFilterSummaryLabel = selectedFilterCount === 0 ? 'All Units' : `${selectedFilterCount} selected`;

    const selectedUnitIds = useMemo(() => {
        const selectedTeamUnitIds = teams2
            .filter(team => selectedTeamNames.includes(team.name))
            .flatMap(team => [...team.chars, ...(team.mows ?? [])]);
        const selectedLeUnitIds = selectedLeOptions.flatMap(option => option.unitIds);
        const allSelectedUnitIds = [...selectedTeamUnitIds, ...selectedLeUnitIds];

        if (allSelectedUnitIds.length === 0) {
            return new Set<string>();
        }

        return new Set<string>(allSelectedUnitIds);
    }, [selectedTeamNames, selectedLeOptions, teams2]);

    const renderTeamMemberIcons = (teamName: string) => {
        const team = teams2.find(x => x.name === teamName);
        if (!team) {
            return;
        }

        const flexIndex = team.flexIndex ?? team.chars.length;
        const core = team.chars.slice(0, flexIndex);
        const flex = team.chars.slice(flexIndex);
        const mowsInTeam = team.mows ?? [];

        return (
            <div className="flex items-center gap-1">
                {core.map(id => {
                    const character = chars.find(x => x.snowprintId === id);
                    const mow = mows.find(x => x.snowprintId === id);
                    const icon = character?.roundIcon ?? mow?.roundIcon ?? '';

                    return (
                        <UnitShardIcon key={`${team.name}-core-${id}`} name={id} icon={icon} height={24} width={24} />
                    );
                })}
                {flex.length > 0 && <div className="mx-0.5" />}
                {flex.map(id => {
                    const character = chars.find(x => x.snowprintId === id);
                    const mow = mows.find(x => x.snowprintId === id);
                    const icon = character?.roundIcon ?? mow?.roundIcon ?? '';

                    return (
                        <UnitShardIcon key={`${team.name}-flex-${id}`} name={id} icon={icon} height={24} width={24} />
                    );
                })}
                {mowsInTeam.length > 0 && <div className="mx-0.5" />}
                {mowsInTeam.map(id => {
                    const character = chars.find(x => x.snowprintId === id);
                    const mow = mows.find(x => x.snowprintId === id);
                    const icon = character?.roundIcon ?? mow?.roundIcon ?? '';

                    return (
                        <UnitShardIcon key={`${team.name}-mow-${id}`} name={id} icon={icon} height={24} width={24} />
                    );
                })}
            </div>
        );
    };

    const toggleTeam = (teamName: string) => {
        setSelectedManualTeamNames(current => {
            const next = new Set(current);
            if (next.has(teamName)) {
                next.delete(teamName);
            } else {
                next.add(teamName);
            }

            return [...next];
        });
    };

    const toggleTeamType = (token: string) => {
        const category = categorySelectionState.find(x => x.token === token);
        if (!category || category.teamNames.length === 0) {
            return;
        }

        setSelectedCategoryTokens(current => {
            const next = new Set(current);
            if (next.has(token)) {
                next.delete(token);
            } else {
                next.add(token);
            }

            return [...next];
        });
    };

    const toggleLegendaryTrack = (token: string) => {
        setSelectedLeOptionTokens(current => {
            const next = new Set(current);
            if (next.has(token)) {
                next.delete(token);
            } else {
                next.add(token);
            }

            return [...next];
        });
    };

    const selectedTeamSections = useMemo(() => {
        const teamsByName = new Map(teams2.map(team => [team.name, team]));

        const toTeamSpecFromTeams2 = (teamName: string): TeamDisplaySpec | undefined => {
            const team = teamsByName.get(teamName);
            if (!team) {
                return;
            }

            return {
                id: `teams2-${team.name}`,
                title: team.name,
                chars: team.chars,
                mows: team.mows ?? [],
            };
        };

        const toFriendlyCategoryTitle = (label: string) => {
            return label.startsWith('All ') ? label.slice(4) : label;
        };

        const getRestrictionNamesForTeam = (
            eventId: LegendaryEventEnum,
            track: LreTrackId,
            restrictionIds: string[]
        ) => {
            const lre = getLre(eventId, chars);
            const trackData = lre[track];
            const restrictionMap = new Map(
                trackData.unitsRestrictions
                    .filter(restriction => restriction.id)
                    .map(restriction => [restriction.id as string, restriction.name])
            );

            return restrictionIds.map(id => restrictionMap.get(id) ?? id);
        };

        const toTrackLabel = (track: 'all' | LreTrackId) => {
            if (track === 'all') {
                return 'All';
            }

            return `${track.charAt(0).toUpperCase()}${track.slice(1)}`;
        };

        const toLreTeamSpec = (eventId: LegendaryEventEnum, leTeam: ILreTeam, prefix: string): TeamDisplaySpec => {
            const restrictionNames = getRestrictionNamesForTeam(eventId, leTeam.section, leTeam.restrictionsIds);
            const restrictionsText = restrictionNames.length > 0 ? restrictionNames.join(' + ') : 'No Restrictions';
            const trackText = toTrackLabel(leTeam.section);
            return {
                id: `${prefix}-${leTeam.id}`,
                title: `${trackText} - ${restrictionsText}`,
                chars: leTeam.charSnowprintIds ?? leTeam.charactersIds ?? [],
                mows: [],
                hideInnerTitle: true,
            };
        };

        const manualSections: TeamDisplaySection[] = selectedManualTeamNames
            .map(teamName => toTeamSpecFromTeams2(teamName))
            .filter(team => !!team)
            .map(team => ({
                id: `manual-${team.id}`,
                title: team.title,
                teams: [team],
            }));

        const allTypeSections: TeamDisplaySection[] = categorySelectionState
            .filter(category => category.isSelected)
            .map(category => {
                const teamSubsections: TeamDisplaySection[] = category.teamNames
                    .map(teamName => toTeamSpecFromTeams2(teamName))
                    .filter(team => !!team)
                    .map(team => ({
                        id: `all-${category.key}-${team.id}`,
                        title: team.title,
                        teams: [team],
                    }));

                return {
                    id: `all-${category.key}`,
                    title: toFriendlyCategoryTitle(category.label),
                    sections: teamSubsections,
                };
            });

        const leSections: TeamDisplaySection[] = leSelectionGroups
            .map(group => {
                const selectedTracks = group.tracks.filter(track => selectedLeTokensSet.has(track.token));
                if (selectedTracks.length === 0) {
                    return;
                }

                const eventTeams = leSelectedTeams[group.eventEnum]?.teams ?? [];
                const getTeamsForTrack = (trackKey: 'all' | LreTrackId) => {
                    if (trackKey === 'all') {
                        return eventTeams;
                    }

                    return eventTeams.filter(team => team.section === trackKey);
                };

                if (selectedTracks.length === 1) {
                    const selectedTrack = selectedTracks[0];
                    const teamsForTrack = getTeamsForTrack(selectedTrack.key);

                    const teamSubsections: TeamDisplaySection[] = teamsForTrack.map(team => ({
                        id: `le-${group.id}-${selectedTrack.key}-${team.id}`,
                        title: toLreTeamSpec(group.eventEnum, team, `le-${group.id}-${selectedTrack.key}`).title,
                        teams: [toLreTeamSpec(group.eventEnum, team, `le-${group.id}-${selectedTrack.key}`)],
                    }));

                    return {
                        id: `le-${group.id}-${selectedTrack.key}`,
                        title:
                            selectedTrack.key === 'all'
                                ? group.label
                                : `${group.label} ${toTrackLabel(selectedTrack.key)}`,
                        sections: teamSubsections,
                    };
                }

                const trackSections: TeamDisplaySection[] = selectedTracks.map(track => {
                    const teamsForTrack = getTeamsForTrack(track.key);

                    const teamSubsections: TeamDisplaySection[] = teamsForTrack.map(team => ({
                        id: `le-${group.id}-${track.key}-${team.id}`,
                        title: toLreTeamSpec(group.eventEnum, team, `le-${group.id}-${track.key}`).title,
                        teams: [toLreTeamSpec(group.eventEnum, team, `le-${group.id}-${track.key}`)],
                    }));

                    return {
                        id: `le-${group.id}-track-${track.key}`,
                        title: toTrackLabel(track.key),
                        sections: teamSubsections,
                    };
                });

                return {
                    id: `le-${group.id}`,
                    title: group.label,
                    sections: trackSections,
                };
            })
            .filter(section => !!section);

        return [...manualSections, ...allTypeSections, ...leSections];
    }, [
        teams2,
        selectedManualTeamNames,
        categorySelectionState,
        leSelectionGroups,
        selectedLeTokensSet,
        leSelectedTeams,
        chars,
    ]);

    useEffect(() => {
        setLiveSnapshotIndices(RosterSnapshotsService.getLiveSnapshotInidices(rosterSnapshots));
        setDiffStyleSetting(viewPreferences.rosterSnapshotsDiffStyle);
        setShowShardsSetting(viewPreferences.showShardsInRosterSnapshots);
        setShowMythicShardsSetting(viewPreferences.showMythicShardsInRosterSnapshots);
        setShowXpLevelSetting(viewPreferences.showXpLevelInRosterSnapshots);
        setShowShardDiffsSetting(viewPreferences.showShardsInDiffs);
        setShowMythicShardsDiffsSetting(viewPreferences.showMythicShardsInDiffs);
        setShowXpLevelDiffsSetting(viewPreferences.showXpLevelInDiffs);
        setShowEquipmentSetting(viewPreferences.showEquipmentInRosterSnapshots);
        setShowEquipmentDiffsSetting(viewPreferences.showEquipmentInDiffs);
    }, [rosterSnapshots, viewPreferences]);

    const takeSnapshot = () => {
        setCurrentTimeMillis(Date.now());
        setIsTakeSnapshotDialogOpen(true);
    };

    const handleSaveSnapshot = (name: string) => {
        setIsTakeSnapshotDialogOpen(false);
        if (name.trim()) createAndDispatchSnapshot(name.trim());
    };

    const handleCancelSnapshot = () => {
        setIsTakeSnapshotDialogOpen(false);
    };

    const createAndDispatchSnapshot = useCallback(
        (name: string) => {
            const snapshot = RosterSnapshotsService.createSnapshot(name, Date.now(), chars, mows);
            if (rosterSnapshots.base === undefined) {
                dispatch.rosterSnapshots({
                    type: 'Set',
                    value: {
                        base: snapshot,
                        diffs: [],
                    },
                });
                return;
            }
            const resolved: IRosterSnapshot[] = [];
            let latest = rosterSnapshots.base;
            resolved.push(latest);
            for (const diff of rosterSnapshots.diffs) {
                latest = RosterSnapshotsService.resolveSnapshotDiff(latest, diff);
                resolved.push(latest);
            }
            resolved.push(snapshot);

            const newSnapshots: IRosterSnapshotsState = {
                base: resolved[0],
                diffs: [],
            };
            for (const [index, snap] of resolved.entries()) {
                if (index == 0) continue;
                newSnapshots.diffs.push(
                    RosterSnapshotsService.diffSnapshots(
                        resolved[index - 1],
                        snap,
                        /*diffShards=*/ true,
                        /*diffMythicShards=*/ true,
                        /*diffXpLevel=*/ true,
                        /*diffEquipment=*/ true
                    )
                );
            }
            if (newSnapshots.diffs.length > RosterSnapshotsService.MAX_SNAPSHOTS - 1) {
                newSnapshots.diffs.splice(0, newSnapshots.diffs.length - (RosterSnapshotsService.MAX_SNAPSHOTS - 1));
            }
            dispatch.rosterSnapshots({ type: 'Set', value: newSnapshots });
        },
        [chars, mows, rosterSnapshots, dispatch]
    );

    const openManage = () => {
        setIsManageDialogOpen(true);
    };

    const handleDeleteSnapshot = (index: number) => {
        const deletedLiveIndex = liveSnapshotIndices.indexOf(index);
        if (deletedLiveIndex === -1) return;

        if (leftIndex >= deletedLiveIndex) {
            const newLeftIndex = Math.max(0, leftIndex - 1);
            setLeftIndex(newLeftIndex);
            if (rightIndex <= newLeftIndex + 1) {
                setRightIndex(newLeftIndex + 1);
            }
        } else if (rightIndex > deletedLiveIndex) {
            setRightIndex(rightIndex - 1);
        }
        dispatch.rosterSnapshots({
            type: 'Set',
            value: RosterSnapshotsService.purgeOldestDeletedSnapshots(
                RosterSnapshotsService.deleteLiveSnapshot(rosterSnapshots, index, Date.now())
            ),
        });
    };

    const handleDeleteAllSnapshots = () => {
        const state: IRosterSnapshotsState = cloneDeep(rosterSnapshots);
        const timeMillis = Date.now();
        if (state.base) {
            state.base.deletedDateMillisUtc = timeMillis;
        }
        for (const diff of state.diffs) {
            diff.deletedDateMillisUtc = timeMillis;
        }

        dispatch.rosterSnapshots({
            type: 'Set',
            value: RosterSnapshotsService.purgeOldestDeletedSnapshots(state),
        });
    };

    const handleRenameSnapshot = (index: number, newName: string) => {
        const state: IRosterSnapshotsState = cloneDeep(rosterSnapshots);
        if (index == -1) {
            state.base!.name = newName;
            dispatch.rosterSnapshots({
                type: 'Set',
                value: state,
            });
            return;
        }
        state.diffs[index].name = newName;
        dispatch.rosterSnapshots({
            type: 'Set',
            value: state,
        });
    };

    const handleManageDone = () => {
        setIsManageDialogOpen(false);
    };

    const handleRestoreSnapshot = (index: number) => {
        dispatch.rosterSnapshots({
            type: 'Set',
            value: RosterSnapshotsService.restoreSnapshot(rosterSnapshots, index),
        });
    };

    const handelPurgeAllDeleted = () => {
        if (rosterSnapshots.base === undefined) return;
        const snapshots: IRosterSnapshot[] = [];
        let current = cloneDeep(rosterSnapshots.base);
        if (current.deletedDateMillisUtc === undefined) {
            snapshots.push(current);
        }
        for (const diff of rosterSnapshots.diffs) {
            current = RosterSnapshotsService.resolveSnapshotDiff(current, diff);
            if (current.deletedDateMillisUtc === undefined) {
                snapshots.push(current);
            }
        }

        const state: IRosterSnapshotsState = {
            base: snapshots.length > 0 ? snapshots[0] : undefined,
            diffs: [],
        };
        for (const [index, snap] of snapshots.entries()) {
            if (index == 0) continue;
            state.diffs.push(
                RosterSnapshotsService.diffSnapshots(
                    snapshots[index - 1],
                    snap,
                    /*diffShards=*/ true,
                    /*diffMythicShards=*/ true,
                    /*diffXpLevel=*/ true,
                    /*diffEquipment=*/ true
                )
            );
        }
        dispatch.rosterSnapshots({ type: 'Set', value: state });
    };

    const getTakeSnapshotTitle = () => {
        if (rosterSnapshots.diffs.length >= RosterSnapshotsService.MAX_SNAPSHOTS - 1) {
            return `Maximum of ${RosterSnapshotsService.MAX_SNAPSHOTS} snapshots reached. Please delete existing snapshots to take new ones.`;
        }
        return 'Take a snapshot of your current roster state.';
    };

    const handleDiffStyleChange = (value: RosterSnapshotDiffStyle) => {
        dispatch.viewPreferences({
            type: 'Update',
            setting: 'rosterSnapshotsDiffStyle',
            value,
        });
    };

    const handleShowShardsChange = (value: RosterSnapshotShowVariableSettings) => {
        dispatch.viewPreferences({
            type: 'Update',
            setting: 'showShardsInRosterSnapshots',
            value,
        });
    };

    const handleShowMythicShardsChange = (value: RosterSnapshotShowVariableSettings) => {
        dispatch.viewPreferences({
            type: 'Update',
            setting: 'showMythicShardsInRosterSnapshots',
            value,
        });
    };

    const handleShowXpLevelChange = (value: RosterSnapshotShowVariableSettings) => {
        dispatch.viewPreferences({
            type: 'Update',
            setting: 'showXpLevelInRosterSnapshots',
            value,
        });
    };

    const handleShowEquipmentChange = (value: RosterSnapshotShowVariableSettings) => {
        dispatch.viewPreferences({
            type: 'Update',
            setting: 'showEquipmentInRosterSnapshots',
            value,
        });
    };

    const handleShowShardDiffsChange = (value: RosterSnapshotShowVariableSettings) => {
        dispatch.viewPreferences({
            type: 'Update',
            setting: 'showShardsInDiffs',
            value,
        });
    };

    const handleShowMythicShardsDiffsChange = (value: RosterSnapshotShowVariableSettings) => {
        dispatch.viewPreferences({
            type: 'Update',
            setting: 'showMythicShardsInDiffs',
            value,
        });
    };

    const handleShowXpLevelDiffsChange = (value: RosterSnapshotShowVariableSettings) => {
        dispatch.viewPreferences({
            type: 'Update',
            setting: 'showXpLevelInDiffs',
            value,
        });
    };

    const handleShowEquipmentDiffsChange = (value: RosterSnapshotShowVariableSettings) => {
        dispatch.viewPreferences({
            type: 'Update',
            setting: 'showEquipmentInDiffs',
            value,
        });
    };

    return (
        <div>
            <div>
                <TakeSnapshotDialog
                    snapshotNames={[rosterSnapshots.base?.name ?? '', ...rosterSnapshots.diffs.map(d => d.name)]}
                    isOpen={isTakeSnapshotDialogOpen}
                    currentTimeMillis={currentTimeMillis}
                    onSave={handleSaveSnapshot}
                    onCancel={handleCancelSnapshot}
                />
            </div>
            <div>
                <ManageSnapshotsDialog
                    rosterSnapshots={rosterSnapshots}
                    isOpen={isManageDialogOpen}
                    showShards={showShardsSetting}
                    showMythicShards={showMythicShardsSetting}
                    showXpLevel={showXpLevelSetting}
                    showEquipment={showEquipmentSetting}
                    diffStyle={viewPreferences.rosterSnapshotsDiffStyle}
                    showShardDiffs={showShardDiffsSetting}
                    showMythicShardsDiffs={showMythicShardsDiffsSetting}
                    showXpLevelDiffs={showXpLevelDiffsSetting}
                    showEquipmentDiffs={showEquipmentDiffsSetting}
                    onShowShardsChange={handleShowShardsChange}
                    onShowMythicShardsChange={handleShowMythicShardsChange}
                    onShowXpLevelChange={handleShowXpLevelChange}
                    onShowEquipmentChange={handleShowEquipmentChange}
                    onDiffStyleChange={handleDiffStyleChange}
                    onShowShardDiffsChange={handleShowShardDiffsChange}
                    onShowMythicShardsDiffsChange={handleShowMythicShardsDiffsChange}
                    onShowXpLevelDiffsChange={handleShowXpLevelDiffsChange}
                    onShowEquipmentDiffsChange={handleShowEquipmentDiffsChange}
                    onDeleteSnapshot={handleDeleteSnapshot}
                    onDeleteAllSnapshots={handleDeleteAllSnapshots}
                    onPurgeDeleted={handelPurgeAllDeleted}
                    onRenameSnapshot={handleRenameSnapshot}
                    onRestoreSnapshot={handleRestoreSnapshot}
                    onDone={handleManageDone}
                />
            </div>
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-600 p-2">
                <SyncButton showText={!isMobile} />
                <Tooltip title={getTakeSnapshotTitle()}>
                    <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={takeSnapshot}
                        disabled={rosterSnapshots.diffs.length >= RosterSnapshotsService.MAX_SNAPSHOTS - 1}>
                        <AddAPhoto className="mr-1" />
                        {!isMobile && 'Take Snapshot'}
                    </Button>
                </Tooltip>
                <Button size="small" variant="contained" color="primary" onClick={openManage}>
                    <Settings className="mr-1" />
                    {!isMobile && 'Manage'}
                </Button>
                <div className="ml-2">
                    <RosterFilterDropdown
                        summaryLabel={rosterFilterSummaryLabel}
                        teams={teamFilterOptions}
                        teamTypes={teamTypeFilterOptions}
                        legendaryEvents={legendaryEventFilterOptions}
                        renderTeamIcons={renderTeamMemberIcons}
                        onToggleTeam={toggleTeam}
                        onToggleTeamType={toggleTeamType}
                        onToggleLegendaryTrack={toggleLegendaryTrack}
                    />
                </div>
                <RosterSnapshotsMagnificationSlider zoom={zoom} setZoom={setZoom} />
            </div>

            {liveSnapshotIndices.length > 0 && (
                <div className="flex items-center gap-4 p-2">
                    <div>
                        <label htmlFor="left-snapshot" className="mr-2">
                            Left:
                        </label>
                        <select
                            id="left-snapshot"
                            value={leftIndex}
                            className="rounded border bg-gray-700 p-1"
                            onChange={event => {
                                const newLeftIndex = Number.parseInt(event.target.value, 10);
                                setLeftIndex(newLeftIndex);
                                if (rightIndex <= newLeftIndex) {
                                    setRightIndex(newLeftIndex + 1);
                                }
                            }}>
                            {liveSnapshotIndices.map((resolvedIndex, index) => (
                                <option key={index} value={index}>
                                    {RosterSnapshotsService.getSnapshotName(rosterSnapshots, resolvedIndex)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="right-snapshot" className="mr-2">
                            Right:
                        </label>
                        <select
                            id="right-snapshot"
                            value={rightIndex}
                            className="rounded border bg-gray-700 p-1"
                            onChange={event => {
                                setRightIndex(Number.parseInt(event.target.value, 10));
                            }}>
                            {liveSnapshotIndices
                                .filter((_, index) => index > leftIndex)
                                .map((resolvedIndex, index) => (
                                    <option key={leftIndex + 1 + index} value={leftIndex + 1 + index}>
                                        {RosterSnapshotsService.getSnapshotName(rosterSnapshots, resolvedIndex)}
                                    </option>
                                ))}
                            <option value={liveSnapshotIndices.length}>Current</option>
                        </select>
                    </div>
                </div>
            )}
            {selectedTeamSections.length > 0
                ? getDisplayByTeamSections(
                      zoom,
                      chars,
                      mows,
                      rosterSnapshots,
                      liveSnapshotIndices[leftIndex],
                      liveSnapshotIndices[rightIndex],
                      diffStyleSetting,
                      showShardsSetting,
                      showMythicShardsSetting,
                      showXpLevelSetting,
                      showEquipmentSetting,
                      showShardDiffsSetting,
                      showMythicShardsDiffsSetting,
                      showXpLevelDiffsSetting,
                      showEquipmentDiffsSetting,
                      selectedTeamSections
                  )
                : getDisplay(
                      zoom,
                      chars,
                      mows,
                      rosterSnapshots,
                      liveSnapshotIndices[leftIndex],
                      liveSnapshotIndices[rightIndex],
                      diffStyleSetting,
                      showShardsSetting,
                      showMythicShardsSetting,
                      showXpLevelSetting,
                      showEquipmentSetting,
                      showShardDiffsSetting,
                      showMythicShardsDiffsSetting,
                      showXpLevelDiffsSetting,
                      showEquipmentDiffsSetting,
                      selectedUnitIds
                  )}
        </div>
    );
};
