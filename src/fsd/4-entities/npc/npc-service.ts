import { Alliance, Faction, parseFaction } from '@/fsd/5-shared/model';

import { npcData } from './data';
import { INpcData, INpcStatsRaw } from './model';

export class NpcService {
    static readonly npcDataFull: INpcData[] = this.convertNpcData();

    private static convertNpcData(): INpcData[] {
        let data: INpcData[] = [];

        data = npcData.map(npc => {
            const ret: INpcData = {
                id: npc.id,
                name: npc.Name,
                faction: parseFaction(npc.Faction) ?? Faction.Ultramarines,
                alliance: this.parseAlliance(npc.Alliance) ?? Alliance.Imperial,
                movement: npc.Movement,
                meleeHits: npc['Melee Hits'] ?? 0,
                meleeType: npc['Melee Damage'] ?? '(none)',
                traits: npc.Traits ?? [],
                activeAbilities: npc['Active Abilities'] ?? [],
                passiveAbilities: npc['Passive Abilities'] ?? [],
                icon: npc.Icon,
                stats: (npc.Stats ?? []).map((stat: INpcStatsRaw) => ({
                    abilityLevel: stat.AbilityLevel,
                    damage: stat.Damage,
                    armor: stat.Armor,
                    health: stat.Health,
                    progressionIndex: stat.ProgressionIndex,
                    rank: stat.Rank,
                    stars: stat.Stars,
                })),
            };
            if (npc['Ranged Hits']) {
                ret.rangeHits = npc['Ranged Hits']!;
                ret.rangeType = npc['Ranged Damage']!;
                ret.range = npc.Distance!;
            }
            return ret;
        });

        return data;
    }

    public static getNpcById(id: string): INpcData | undefined {
        return this.npcDataFull.find(npc => npc.id === id);
    }

    private static parseAlliance(alliance: string): Alliance | undefined {
        switch (alliance) {
            // Towen gave us this data, and he wasn't consistent in capitalizizing xenos. /shrug.
            case 'xenos':
                return Alliance.Xenos;
            case 'Xenos':
                return Alliance.Xenos;
            case 'Chaos':
                return Alliance.Chaos;
            case 'Imperial':
                return Alliance.Imperial;
            default:
                return undefined;
        }
    }
}
