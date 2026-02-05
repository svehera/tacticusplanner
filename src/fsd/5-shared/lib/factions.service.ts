// eslint-disable-next-line import-x/no-internal-modules
import factionsData from 'src/data/factions.json';

import { Alliance, Faction } from '../model';

export class FactionsService {
    /** @returns the snowprint IDs of the factions belonging to the alliance. */
    public static getFactions(alliance: Alliance): string[] {
        return factionsData.filter(x => x.alliance === alliance).map(x => x.snowprintId);
    }
    /**
     * @param faction The faction to convert.
     * @returns the string representation of the faction.
     */
    public static factionToString = (faction: Faction): string => {
        switch (faction) {
            case Faction.Ultramarines:
                return 'Ultramarines';
            case Faction.Black_Legion:
                return 'Black Legion';
            case Faction.Orks:
                return 'Orks';
            case Faction.ADEPTA_SORORITAS:
                return 'Adepta Sororitas';
            case Faction.Necrons:
                return 'Necrons';
            case Faction.Astra_militarum:
                return 'Astra Militarum';
            case Faction.Death_Guard:
                return 'Death Guard';
            case Faction.Black_Templars:
                return 'Black Templars';
            case Faction.Aeldari:
                return 'Aeldari';
            case Faction.Space_Wolves:
                return 'Space Wolves';
            case Faction.T_Au:
                return "T'au";
            case Faction.Dark_Angels:
                return 'Dark Angels';
            case Faction.Thousand_Sons:
                return 'Thousand Sons';
            case Faction.Tyranids:
                return 'Tyranids';
            case Faction.AdeptusMechanicus:
                return 'Adeptus Mechanicus';
            case Faction.WorldEaters:
                return 'World Eaters';
            case Faction.BloodAngels:
                return 'Blood Angels';
            case Faction.GenestealerCults:
                return 'Genestealer Cults';
            case Faction.AdeptusCustodes:
                return 'Custodes';
            case Faction.EmperorsChildren:
                return 'Emperors Children';
            default:
                return '';
        }
    };

    /** @returns the Faction enum corresponding to the Snowprint faction, or undefined if the string doesn't map. */
    public static safeSnowprintFactionToFaction = (snowprintFaction: string): Faction | undefined => {
        try {
            return this.snowprintFactionToFaction(snowprintFaction);
        } catch {
            return undefined;
        }
    };

    /**
     * @param snowprintFaction The faction string from Snowprint.
     * @returns the Faction enum corresponding to the Snowprint faction.
     */
    public static snowprintFactionToFaction = (snowprintFaction: string): Faction => {
        switch (snowprintFaction) {
            case 'Ultramarines':
                return Faction.Ultramarines;
            case 'BlackLegion':
                return Faction.Black_Legion;
            case 'Orks':
                return Faction.Orks;
            case 'Sisterhood':
                return Faction.ADEPTA_SORORITAS;
            case 'Necrons':
                return Faction.Necrons;
            case 'AstraMilitarum':
                return Faction.Astra_militarum;
            case 'DeathGuard':
                return Faction.Death_Guard;
            case 'BlackTemplars':
                return Faction.Black_Templars;
            case 'Aeldari':
                return Faction.Aeldari;
            case 'SpaceWolves':
                return Faction.Space_Wolves;
            case 'Tau':
                return Faction.T_Au;
            case 'DarkAngels':
                return Faction.Dark_Angels;
            case 'ThousandSons':
                return Faction.Thousand_Sons;
            case 'Tyranids':
                return Faction.Tyranids;
            case 'AdeptusMechanicus':
                return Faction.AdeptusMechanicus;
            case 'WorldEaters':
                return Faction.WorldEaters;
            case 'BloodAngels':
                return Faction.BloodAngels;
            case 'Genestealers':
                return Faction.GenestealerCults;
            case 'Custodes':
                return Faction.AdeptusCustodes;
            case 'EmperorsChildren':
                return Faction.EmperorsChildren;
            case 'LeaguesOfVotann':
                return Faction.LeaguesOfVotann;
            default:
                throw new Error(`Unknown faction: ${snowprintFaction}`);
        }
    };

    /**
     * @param faction The Faction enum value.
     * @returns the snowprint ID of the faction.
     */
    public static getFactionSnowprintId = (faction: Faction): string | undefined => {
        switch (faction) {
            case Faction.Ultramarines:
                return 'Ultramarines';
            case Faction.Black_Legion:
                return 'BlackLegion';
            case Faction.Orks:
                return 'Orks';
            case Faction.ADEPTA_SORORITAS:
                return 'Sisterhood';
            case Faction.Necrons:
                return 'Necrons';
            case Faction.Astra_militarum:
                return 'AstraMilitarum';
            case Faction.Death_Guard:
                return 'DeathGuard';
            case Faction.Black_Templars:
                return 'BlackTemplars';
            case Faction.Aeldari:
                return 'Aeldari';
            case Faction.Space_Wolves:
                return 'SpaceWolves';
            case Faction.T_Au:
                return 'Tau';
            case Faction.Dark_Angels:
                return 'DarkAngels';
            case Faction.Thousand_Sons:
                return 'ThousandSons';
            case Faction.Tyranids:
                return 'Tyranids';
            case Faction.AdeptusMechanicus:
                return 'AdeptusMechanicus';
            case Faction.WorldEaters:
                return 'WorldEaters';
            case Faction.BloodAngels:
                return 'BloodAngels';
            case Faction.GenestealerCults:
                return 'Genestealers';
            case Faction.AdeptusCustodes:
                return 'Custodes';
            case Faction.EmperorsChildren:
                return 'EmperorsChildren';
            default:
                return undefined;
        }
    };
}
