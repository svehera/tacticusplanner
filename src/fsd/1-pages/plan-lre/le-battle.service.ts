import { LegendaryEventEnum } from '@/fsd/4-entities/lre';

import battleData from './newLeBattleData.json';
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
    public static readonly battles: ILeBattles[] = battleData.legendaryEvents;

    /**
     * @returns the battle set for the given character released via legendary events. SP tends to
     * remove old LEs from the game, so you should assume this only works for currently running LEs.
     */
    public static getBattleSetForCharacter(characterId: LegendaryEventEnum): ILeBattles | undefined {
        if (characterId === LegendaryEventEnum.Trajann) {
            return this.battles.find(battle => battle.id === '11');
        }
        if (characterId === LegendaryEventEnum.Lucius) {
            return this.battles.find(battle => battle.id === '12');
        }
        if (characterId === LegendaryEventEnum.Dante) {
            return this.battles.find(battle => battle.id === '10');
        }
        if (characterId === LegendaryEventEnum.Farsight) {
            return this.battles.find(battle => battle.id === '13');
        }
        if (characterId === LegendaryEventEnum.Uthar) {
            return this.battles.find(battle => battle.id === '14');
        }
        return undefined;
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
