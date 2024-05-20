import { Rarity } from 'src/models/enums';
import {
    PersonalTeamType,
    TournamentArenaType,
    GuildRaidBossType,
    GuildRaidMiniBossType,
    GuildRaidWarType,
} from './teams.enums';

export interface IPersonalTeam {
    id: string;
    name: string;

    type: PersonalTeamType;
    taType: TournamentArenaType;
    grBossType: GuildRaidBossType;
    grMiniBossType: GuildRaidMiniBossType;
    gwType: GuildRaidWarType;

    rarityCap: Rarity;
    lineup: string[];

    notes: string;
}
