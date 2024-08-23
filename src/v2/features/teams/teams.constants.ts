import { IMenuOption } from 'src/v2/models/menu-option';
import { GameMode, GuildRaidBoss, GwMode, TaMode } from 'src/v2/features/teams/teams.enums';

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

export const allModes = [...guildRaidBosses, ...guildRaidPrimes, ...taSubModes, ...gwSubModes];
