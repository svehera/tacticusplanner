// eslint-disable-next-line import-x/no-internal-modules
import { GoalColorMode } from '@/routes/goals/goal-color-coding-toggle';

import { CharactersFilterBy, CharactersOrderBy } from '@/fsd/4-entities/character';

export interface IViewOption<T = IViewPreferences> {
    key: keyof T;
    value: boolean;
    label: string;
    disabled: boolean;
    tooltip?: string;
}

export enum RosterSnapshotShowVariableSettings {
    Never,
    WhenNonZero,
    Always,
}

export enum RosterSnapshotDiffStyle {
    SideBySide,
    Detailed,
}

export interface IViewPreferences
    extends ILreViewSettings, ILreTileSettings, IWyoViewSettings, IRosterSnapshotsViewSettings {
    // autoTeams: boolean;
    wyoFilter: CharactersFilterBy;
    wyoOrder: CharactersOrderBy;
    craftableItemsInInventory: boolean;
    inventoryShowAlphabet: boolean;
    inventoryShowPlusMinus: boolean;
    goalsTableView: boolean;
    goalColorMode: GoalColorMode;
    campaignsTableView: boolean;
    raidsTableView: boolean;
    myProgressShowCoreCharacters: boolean;
    apiIntegrationSyncOptions: string[];
    tokenomicsTableView: boolean;
}

interface IWyoViewSettings {
    showBadges: boolean;
    showAbilitiesLevel: boolean;
    showBsValue: boolean;
    showPower: boolean;
    showCharacterLevel: boolean;
    showCharacterRarity: boolean;
}

export interface ILreViewSettings {
    lreGoalsPreview: boolean;
    lreGridView: boolean;
    showAlpha: boolean;
    showBeta: boolean;
    showGamma: boolean;
    onlyUnlocked: boolean;
    hideCompleted: boolean;
}

export interface ILreTileSettings {
    lreTileShowUnitIcon: boolean;
    lreTileShowUnitRarity: boolean;
    lreTileShowUnitRank: boolean;
    lreTileShowUnitRankBackground: boolean;
    lreTileShowUnitName: boolean;
    lreTileShowUnitBias: boolean;
    lreTileShowUnitActiveAbility: boolean;
    lreTileShowUnitPassiveAbility: boolean;
    lreTileShowUnitHealTraits: boolean;
    lreTileShowUnitRelic: boolean;
}

interface IRosterSnapshotsViewSettings {
    showXpLevelInRosterSnapshots: RosterSnapshotShowVariableSettings;
    showShardsInRosterSnapshots: RosterSnapshotShowVariableSettings;
    showMythicShardsInRosterSnapshots: RosterSnapshotShowVariableSettings;
    showEquipmentInRosterSnapshots: RosterSnapshotShowVariableSettings;
    showXpLevelInDiffs: RosterSnapshotShowVariableSettings;
    showShardsInDiffs: RosterSnapshotShowVariableSettings;
    showMythicShardsInDiffs: RosterSnapshotShowVariableSettings;
    showEquipmentInDiffs: RosterSnapshotShowVariableSettings;
    rosterSnapshotsDiffStyle: RosterSnapshotDiffStyle;
}

export interface ICharactersViewControls {
    orderBy: CharactersOrderBy;
    filterBy: CharactersFilterBy;
}
