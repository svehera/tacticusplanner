import { mutableCopy } from '@/fsd/5-shared/lib';

import { LegendaryEventEnum, rawLreBattleData } from '@/fsd/4-entities/lre';

import { TokenDisplay } from './token-estimation-service';

export interface ILeWave {
    power: number;
    round: number;
    enemies: string[];
}

interface ILeObjective {
    type: string;
    target: string;
    points: number;
}

export interface ILeBattle {
    mapId: string;
    number: number;
    power: number;
    tier: number;
    disallowedFactions: string[];
    waves: ILeWave[];
    objectives: ILeObjective[];
}

interface ILeBattleSet {
    battles: ILeBattle[];
}

export interface ILeBattles {
    id: string;
    alpha: ILeBattleSet;
    beta: ILeBattleSet;
    gamma: ILeBattleSet;
}

export class LeBattleService {
    public static readonly battles = mutableCopy(rawLreBattleData.legendaryEvents) satisfies ILeBattles[];

    /**
     * @returns the battle set for the given character released via legendary events. SP tends to
     * remove old LEs from the game, so you should assume this only works for currently running LEs.
     * Works for any event as long as its id has a matching entry in new-le-battle-data.json.
     */
    public static getBattleSetForCharacter(characterId: LegendaryEventEnum): ILeBattles | undefined {
        return this.battles.find(battle => battle.id === String(characterId));
    }

    public static getBattleFromToken(token: TokenDisplay, battles: ILeBattles | undefined): ILeBattle | undefined {
        if (battles === undefined) return undefined;
        if (token.battleNumber < 0) return undefined;
        if (token.track === 'alpha' && token.battleNumber < battles.alpha.battles.length) {
            return battles.alpha.battles[token.battleNumber];
        } else if (token.track === 'beta' && token.battleNumber < battles.beta.battles.length) {
            return battles.beta.battles[token.battleNumber];
        } else if (token.track === 'gamma' && token.battleNumber < battles.gamma.battles.length) {
            return battles.gamma.battles[token.battleNumber];
        }
        return undefined;
    }
}
