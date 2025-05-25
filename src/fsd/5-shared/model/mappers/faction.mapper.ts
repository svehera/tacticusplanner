import { Faction } from '../enums';

export function parseFaction(faction: string): Faction | undefined {
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
