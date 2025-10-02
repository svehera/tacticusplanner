import { CharactersFilterBy, CharactersOrderBy } from '@/fsd/4-entities/character';

export interface IViewOption<T = IViewPreferences> {
    key: keyof T;
    value: boolean;
    label: string;
    disabled: boolean;
    tooltip?: string;
}

export interface IViewPreferences extends ILreViewSettings, ILreTileSettings, IWyoViewSettings {
    theme: 'light' | 'dark';
    // autoTeams: boolean;
    wyoFilter: CharactersFilterBy;
    wyoOrder: CharactersOrderBy;
    craftableItemsInInventory: boolean;
    inventoryShowAlphabet: boolean;
    inventoryShowPlusMinus: boolean;
    goalsTableView: boolean;
    goalsBattlePassSeasonView?: boolean;
    myProgressShowCoreCharacters: boolean;
    apiIntegrationSyncOptions: string[];
}

export interface IWyoViewSettings {
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
}

export interface ICharactersViewControls {
    orderBy: CharactersOrderBy;
    filterBy: CharactersFilterBy;
}
