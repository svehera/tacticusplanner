import { IMenuOption } from 'src/v2/models/menu-option';
import { GameMode, GuildRaidBoss, GwMode, TaMode } from 'src/v2/features/teams/teams.enums';

export const gameModes: IMenuOption[] = [
    {
        value: GameMode.guildRaids,
        label: 'Guild Raids',
        selected: true,
    },
    {
        value: GameMode.tournamentArena,
        label: 'Tournament Arena',
        selected: false,
    },
    // {
    //     value: GameMode.guildWar,
    //     label: 'Guild War',
    //     selected: false,
    // },
];

const leftSidePrimeSuffix = '_prime_L';
const rightSidePrimeSuffix = '_prime_R';

export const guildRaidSubModes: IMenuOption[] = [
    {
        value: GuildRaidBoss.avatar,
        label: 'Avatar',
        selected: false,
    },
    {
        value: GuildRaidBoss.avatar + leftSidePrimeSuffix,
        label: 'Avatar - Aethana',
        selected: false,
    },
    {
        value: GuildRaidBoss.avatar + rightSidePrimeSuffix,
        label: 'Avatar - Eldryon',
        selected: false,
    },
    {
        value: GuildRaidBoss.ghazghkull,
        label: 'Ghazghkull',
        selected: false,
    },
    {
        value: GuildRaidBoss.ghazghkull + leftSidePrimeSuffix,
        label: 'Ghazghkull - Gibbascrapz',
        selected: false,
    },
    {
        value: GuildRaidBoss.ghazghkull + rightSidePrimeSuffix,
        label: 'Ghazghkull - Tanksmasha',
        selected: false,
    },
    {
        value: GuildRaidBoss.hiveTyrant,
        label: 'Hive Tyrant',
        selected: false,
    },
    {
        value: GuildRaidBoss.hiveTyrant + leftSidePrimeSuffix,
        label: 'Hive Tyrant - Alpha Prime',
        selected: false,
    },
    {
        value: GuildRaidBoss.hiveTyrant + rightSidePrimeSuffix,
        label: 'Hive Tyrant - Omega Prime',
        selected: false,
    },
    {
        value: GuildRaidBoss.mortarion,
        label: 'Mortarion',
        selected: false,
    },
    {
        value: GuildRaidBoss.mortarion + leftSidePrimeSuffix,
        label: 'Mortarion - Nauseous Rotbone',
        selected: false,
    },
    {
        value: GuildRaidBoss.mortarion + rightSidePrimeSuffix,
        label: 'Mortarion - Corrodius',
        selected: false,
    },
    {
        value: GuildRaidBoss.rogalDorn,
        label: 'Rogal Dorn',
        selected: false,
    },
    {
        value: GuildRaidBoss.rogalDorn + leftSidePrimeSuffix,
        label: 'Rogal Dorn - Sibyll Devine',
        selected: false,
    },
    {
        value: GuildRaidBoss.rogalDorn + rightSidePrimeSuffix,
        label: 'Rogal Dorn - Thaddeus Noble',
        selected: false,
    },
    {
        value: GuildRaidBoss.screamerKiller,
        label: 'Screamer-Killer',
        selected: false,
    },
    {
        value: GuildRaidBoss.screamerKiller + leftSidePrimeSuffix,
        label: 'Screamer-Killer - Neurothrope',
        selected: false,
    },
    {
        value: GuildRaidBoss.screamerKiller + rightSidePrimeSuffix,
        label: 'Screamer-Killer - Winged Prime',
        selected: false,
    },
    {
        value: GuildRaidBoss.szarekh,
        label: 'Szarekh',
        selected: false,
    },
    {
        value: GuildRaidBoss.szarekh + leftSidePrimeSuffix,
        label: 'Szarekh - Hapthatra',
        selected: false,
    },
    {
        value: GuildRaidBoss.szarekh + rightSidePrimeSuffix,
        label: 'Szarekh - Mesophet',
        selected: false,
    },
    {
        value: GuildRaidBoss.tervigon,
        label: 'Tervigon',
        selected: false,
    },
    {
        value: GuildRaidBoss.tervigon + leftSidePrimeSuffix,
        label: 'Tervigon - Alpha Prime',
        selected: false,
    },
    {
        value: GuildRaidBoss.tervigon + rightSidePrimeSuffix,
        label: 'Tervigon - Omega Prime',
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
