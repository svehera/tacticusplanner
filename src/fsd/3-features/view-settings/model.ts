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
    // A CharactersFilterBy enum value, or a team name (from StoreContext.teams2) to filter by.
    wyoFilter: CharactersFilterBy | string;
    wyoOrder: CharactersOrderBy;
    // A CharactersFilterBy enum value, or a team name (from StoreContext.teams2) to filter by.
    sharedRosterFilter: CharactersFilterBy | string;
    craftableItemsInInventory: boolean;
    inventoryShowAlphabet: boolean;
    inventoryShowPlusMinus: boolean;
    goalsTableView: boolean;
    goalColorMode: GoalColorMode;
    raidsTableView: boolean;
    includeExhaustedBattlesInHse: boolean;
    showHseWarning: boolean;
    apiIntegrationSyncOptions: string[];
    tokenomicsTableView: boolean;
    showGuildShop?: boolean;
    showWarShop?: boolean;
    showRogueTrader?: boolean;
    showCrusadeShop?: boolean;
    hideRandomShopDeals?: boolean;
    leaderboardBossTopN: number;
    leaderboardPrimeTopN: number;
}

interface IWyoViewSettings {
    showBadges: boolean;
    showAbilitiesLevel: boolean;
    showBsValue: boolean;
    showPower: boolean;
    showCharacterLevel: boolean;
    showCharacterRarity: boolean;
    showEquipment: boolean;
}

export interface ILreViewSettings {
    lreGoalsPreview: boolean;
    lreGridView: boolean;
    onlyUnlocked: boolean;
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
    // A CharactersFilterBy enum value, or a team name to filter by.
    filterBy: CharactersFilterBy | string;
}
