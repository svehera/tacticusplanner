import { Alliance, Faction } from '@/fsd/5-shared/model';

import { CharactersService } from '@/fsd/4-entities/character/@x/npc';

import { npcData } from './data';
import { INpcData } from './model';

export class NpcService {
    static readonly npcDataFull: INpcData[] = this.convertNpcData();

    /** @returns the image asset for the NPC, which is allowed to be a character. */
    public static getNpcIconPath(name: string): string {
        const prefix: string = 'npcs';
        const map: Record<string, string> = {
            'Flayed One': 'flayed_one.png',
            'Necron Warrior': 'necron_warrior.png',
            'Scarab Swarm': 'scarab_swarm.png',
            Deathmark: 'deathmark.png',
            'Ophydian Destroyer': 'ophydian_destroyer.png',
            'Cadian Guardsman': 'cadian_guardsman.png',
            'Cadian Lascannon team': 'lascannon.png',
            'Cadian Lascannon Team': 'lascannon.png',
            'Cadian Vox-Caster': 'vox_caster.png',
            'Cadian Mortar Team': 'mortar_team.png',
            Eliminator: 'eliminator.png',
            Inceptor: 'inceptor.png',
            'Heavy Intercessor': 'intercessor.png',
            Bloodletter: 'blood_letter.png',
            'Chaos Terminator': 'chaos_terminator.png',
            'Traitor Guardsman': 'traitor_guardsman.png',
            Havoc: 'chaos_havoc.png',
            Campaign: 'campaign.png',
            Initiate: 'initiate.png',
            Neophyte: 'neophyte.png',
            'Initiate with Pyreblaster': 'pyreblaster.png',
            Aggressor: 'aggressor.png',
            'Ork Boy': 'ork_boy.png',
            Grot: 'grot.png',
            'Grot Tank': 'grot_tank.png',
            'Storm Boy': 'storm_boy.png',
            Hormagaunt: 'hormagaunt.png',
            Termagant: 'termagaunt.png',
            'Ripper Swarm': 'ripper_swarm.png',
            'Tyranid Warrior': 'tyranid_warrior.png',
            'Rubric Marine': 'rubric_marine.webp',
            'Pink Horror': 'pink_horror.webp',
            Screamer: 'screamer_of_tzeentch.webp',
            Guardian: 'guardian.webp',
            'Scarab Occult Terminator': 'scarab_occult_terminator.webp',
            'Harlequin Player': 'harlequin.webp',
            Warlock: 'warlock.webp',
            Wraithguard: 'wraithguard.webp',
        };
        if (map[name]) {
            return prefix + '/' + map[name];
        }
        const unit = CharactersService.charactersData.find(x => x.name === name);
        if (unit != undefined) {
            return 'portraits/' + unit.icon;
        }
        console.log('unknown npc - ' + name);
        return 'unknown-' + name;
    }

    private static convertNpcData(): INpcData[] {
        let data: INpcData[] = [];

        data = npcData.npcs.map(npc => {
            const faction: Faction = this.parseFaction(npc.faction) ?? Faction.Ultramarines;
            const alliance: Alliance = this.parseAlliance(npc.alliance) ?? Alliance.Imperial;
            const ret: INpcData = {
                name: npc.name,
                faction: faction,
                alliance: alliance,
                movement: npc.movement,
                meleeHits: npc.meleeHits,
                meleeType: npc.meleeType,
                health: npc.health,
                damage: npc.damage,
                armor: npc.armor,
                traits: npc.traits,
                activeAbilities: npc.activeAbilities,
                passiveAbilities: npc.passiveAbilities,
            };
            if (npc.rangeHits) {
                ret.rangeHits = npc.rangeHits!;
                ret.rangeType = npc.rangeType!;
                ret.range = npc.range!;
            }
            if (npc.critChance) {
                ret.critChance = npc.critChance!;
                ret.critDamage = npc.critDamage!;
            }
            if (npc.blockChance) {
                ret.blockChance = npc.blockChance!;
                ret.blockDamage = npc.blockDamage!;
            }
            return ret;
        });

        return data;
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

    private static parseFaction(faction: string): Faction | undefined {
        switch (faction) {
            case 'Ultramarines':
                return Faction.Ultramarines;
            case 'Adeptus Mechanicus':
                return Faction.AdeptusMechanicus;
            case 'Astra Militarum':
                return Faction.Astra_militarum;
            case 'Black Legion':
                return Faction.Black_Legion;
            case 'Black Templars':
                return Faction.Black_Templars;
            case 'Blood Angels':
                return Faction.BloodAngels;
            case 'Dark Angels':
                return Faction.Dark_Angels;
            case 'Genestealer Cults':
                return Faction.GenestealerCults;
            case 'Orks':
                return Faction.Orks;
            case 'Necrons':
                return Faction.Necrons;
            case 'Death Guard':
                return Faction.Death_Guard;
            case 'Aeldari':
                return Faction.Aeldari;
            case "T'au":
            case "T'au Empire":
                return Faction.T_Au;
            case 'Thousand Sons':
                return Faction.Thousand_Sons;
            case 'Tyranids':
                return Faction.Tyranids;
            case 'World Eaters':
                return Faction.WorldEaters;
            case 'Adepta Sororitas':
                return Faction.ADEPTA_SORORITAS;
            case 'Space Wolves':
                return Faction.Space_Wolves;
            default:
                return undefined;
        }
    }
}
