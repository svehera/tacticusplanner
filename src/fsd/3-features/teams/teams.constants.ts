import { IMenuOption } from '@/models/menu-option';

import { Faction } from '@/fsd/5-shared/model';

import { GameMode, GuildRaidBoss, GwMode, TaMode } from '@/fsd/3-features/teams/teams.enums';

export const anyOption: IMenuOption = { label: 'Any', selected: false, value: 'any' };

export const gameModes: IMenuOption[] = [
    {
        value: GameMode.guildRaids,
        label: 'Guild Raids',
        selected: false,
    },
    {
        value: GameMode.tournamentArena,
        label: 'Tournament Arena',
        selected: false,
    },
    {
        value: GameMode.guildWar,
        label: 'Guild War',
        selected: false,
    },
    {
        value: GameMode.survival,
        label: 'Survival',
        selected: false,
    },
];

export const gameModesForGuides: IMenuOption[] = [
    ...gameModes,
    {
        value: GameMode.legendaryRelease,
        label: 'Legendary Event',
        selected: false,
    },
    {
        value: GameMode.incursion,
        label: 'Incursion',
        selected: false,
    },
];

const leftSidePrimeSuffix = '_prime_L';
const rightSidePrimeSuffix = '_prime_R';

export const guildRaidBosses: IMenuOption[] = [
    {
        value: GuildRaidBoss.avatar,
        label: 'Avatar',
        selected: false,
    },
    {
        value: GuildRaidBoss.cawl,
        label: 'Belisarius Cawl',
        selected: false,
    },
    {
        value: GuildRaidBoss.ghazghkull,
        label: 'Ghazghkull',
        selected: false,
    },
    {
        value: GuildRaidBoss.hiveTyrant,
        label: 'Hive Tyrant',
        selected: false,
    },
    {
        value: GuildRaidBoss.magnus,
        label: 'Magnus',
        selected: false,
    },
    {
        value: GuildRaidBoss.mortarion,
        label: 'Mortarion',
        selected: false,
    },
    {
        value: GuildRaidBoss.rogalDorn,
        label: 'Rogal Dorn',
        selected: false,
    },
    {
        value: GuildRaidBoss.screamerKiller,
        label: 'Screamer-Killer',
        selected: false,
    },
    {
        value: GuildRaidBoss.szarekh,
        label: 'Szarekh',
        selected: false,
    },
    {
        value: GuildRaidBoss.tervigon,
        label: 'Tervigon',
        selected: false,
    },
];

export const guildRaidPrimes: IMenuOption[] = [
    {
        value: GuildRaidBoss.avatar + leftSidePrimeSuffix,
        label: 'Aethana (Avatar)',
        selected: false,
    },
    {
        value: GuildRaidBoss.avatar + rightSidePrimeSuffix,
        label: 'Eldryon (Avatar)',
        selected: false,
    },
    {
        value: GuildRaidBoss.cawl + leftSidePrimeSuffix,
        label: "Tan Gi'da (Cawl)",
        selected: false,
    },
    {
        value: GuildRaidBoss.cawl + rightSidePrimeSuffix,
        label: 'Actus (Cawl)',
        selected: false,
    },
    {
        value: GuildRaidBoss.ghazghkull + leftSidePrimeSuffix,
        label: 'Gibbascrapz (Ghazghkull)',
        selected: false,
    },
    {
        value: GuildRaidBoss.ghazghkull + rightSidePrimeSuffix,
        label: 'Tanksmasha (Ghazghkull)',
        selected: false,
    },
    {
        value: GuildRaidBoss.hiveTyrant + leftSidePrimeSuffix,
        label: 'Alpha/Omega Prime (Tyrant)',
        selected: false,
    },
    {
        value: GuildRaidBoss.magnus + leftSidePrimeSuffix,
        label: 'Thaumachus (Magnus)',
        selected: false,
    },
    {
        value: GuildRaidBoss.magnus + rightSidePrimeSuffix,
        label: 'Abraxas (Magnus)',
        selected: false,
    },
    {
        value: GuildRaidBoss.mortarion + leftSidePrimeSuffix,
        label: 'Nauseous Rotbone (Mortarion)',
        selected: false,
    },
    {
        value: GuildRaidBoss.mortarion + rightSidePrimeSuffix,
        label: 'Corrodius (Mortarion)',
        selected: false,
    },
    {
        value: GuildRaidBoss.rogalDorn + leftSidePrimeSuffix,
        label: 'Sibyll Devine (Rogal Dorn)',
        selected: false,
    },
    {
        value: GuildRaidBoss.rogalDorn + rightSidePrimeSuffix,
        label: 'Thaddeus Noble (Rogal Dorn)',
        selected: false,
    },
    {
        value: GuildRaidBoss.screamerKiller + leftSidePrimeSuffix,
        label: 'Neurothrope (Screamer)',
        selected: false,
    },
    {
        value: GuildRaidBoss.screamerKiller + rightSidePrimeSuffix,
        label: 'Winged Prime (Screamer)',
        selected: false,
    },
    {
        value: GuildRaidBoss.szarekh + leftSidePrimeSuffix,
        label: 'Hapthatra (Szarekh)',
        selected: false,
    },
    {
        value: GuildRaidBoss.szarekh + rightSidePrimeSuffix,
        label: 'Mesophet (Szarekh)',
        selected: false,
    },
];

export const taSubModes: IMenuOption[] = [
    {
        value: TaMode.conquest,
        label: 'Conquest',
        selected: false,
    },
    {
        value: TaMode.powerUps,
        label: 'Power Ups',
        selected: false,
    },
    {
        value: TaMode.draftPowerUps,
        label: 'Draft Power Ups',
        selected: false,
    },
    {
        value: TaMode.infestedPowerUps,
        label: 'Infested Power Ups',
        selected: false,
    },
];

export const gwSubModes: IMenuOption[] = [
    {
        value: GwMode.offense,
        label: 'Offense',
        selected: false,
    },
    {
        value: GwMode.defense,
        label: 'Defense',
        selected: false,
    },
];

export const lreSections: IMenuOption[] = [
    {
        value: '_alpha',
        label: 'Alpha',
        selected: false,
    },
    {
        value: '_beta',
        label: 'Beta',
        selected: false,
    },
    {
        value: '_gamma',
        label: 'Gamma',
        selected: false,
    },
];

export const allModes = [...guildRaidBosses, ...guildRaidPrimes, ...taSubModes, ...gwSubModes];

export const grEncounterToFaction: Record<string, Faction> = {
    [GuildRaidBoss.avatar]: Faction.Aeldari,
    [GuildRaidBoss.avatar + leftSidePrimeSuffix]: Faction.Aeldari,
    [GuildRaidBoss.avatar + rightSidePrimeSuffix]: Faction.Aeldari,
    [GuildRaidBoss.cawl]: Faction.AdeptusMechanicus,
    [GuildRaidBoss.cawl + leftSidePrimeSuffix]: Faction.AdeptusMechanicus,
    [GuildRaidBoss.cawl + rightSidePrimeSuffix]: Faction.AdeptusMechanicus,
    [GuildRaidBoss.ghazghkull]: Faction.Orks,
    [GuildRaidBoss.ghazghkull + leftSidePrimeSuffix]: Faction.Orks,
    [GuildRaidBoss.ghazghkull + rightSidePrimeSuffix]: Faction.Orks,
    [GuildRaidBoss.hiveTyrant]: Faction.Tyranids,
    [GuildRaidBoss.hiveTyrant + leftSidePrimeSuffix]: Faction.Tyranids,
    [GuildRaidBoss.hiveTyrant + rightSidePrimeSuffix]: Faction.Tyranids,
    [GuildRaidBoss.magnus]: Faction.Thousand_Sons,
    [GuildRaidBoss.magnus + leftSidePrimeSuffix]: Faction.Thousand_Sons,
    [GuildRaidBoss.magnus + rightSidePrimeSuffix]: Faction.Thousand_Sons,
    [GuildRaidBoss.mortarion]: Faction.Death_Guard,
    [GuildRaidBoss.mortarion + leftSidePrimeSuffix]: Faction.Death_Guard,
    [GuildRaidBoss.mortarion + rightSidePrimeSuffix]: Faction.Death_Guard,
    [GuildRaidBoss.rogalDorn]: Faction.Astra_militarum,
    [GuildRaidBoss.rogalDorn + leftSidePrimeSuffix]: Faction.Astra_militarum,
    [GuildRaidBoss.rogalDorn + rightSidePrimeSuffix]: Faction.Astra_militarum,
    [GuildRaidBoss.screamerKiller]: Faction.Tyranids,
    [GuildRaidBoss.screamerKiller + leftSidePrimeSuffix]: Faction.Tyranids,
    [GuildRaidBoss.screamerKiller + rightSidePrimeSuffix]: Faction.Tyranids,
    [GuildRaidBoss.szarekh]: Faction.Necrons,
    [GuildRaidBoss.szarekh + leftSidePrimeSuffix]: Faction.Necrons,
    [GuildRaidBoss.szarekh + rightSidePrimeSuffix]: Faction.Necrons,
    [GuildRaidBoss.tervigon]: Faction.Tyranids,
    [GuildRaidBoss.tervigon + leftSidePrimeSuffix]: Faction.Tyranids,
    [GuildRaidBoss.tervigon + rightSidePrimeSuffix]: Faction.Tyranids,
};
