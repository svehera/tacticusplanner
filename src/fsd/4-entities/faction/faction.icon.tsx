/* eslint-disable import-x/no-internal-modules */
import adeptaSororitas from '@/assets/images/factions/Adepta Sororitas.png';
import adeptusCustodes from '@/assets/images/factions/Adeptus Custodes.png';
import adeptusMechanicus from '@/assets/images/factions/Adeptus Mechanicus.png';
import aeldari from '@/assets/images/factions/Aeldari.png';
import astraMilitarum from '@/assets/images/factions/Astra Militarum.png';
import blackLegion from '@/assets/images/factions/Black Legion.png';
import blackTemplars from '@/assets/images/factions/Black Templars.png';
import bloodAngels from '@/assets/images/factions/Blood Angels.png';
import darkAngels from '@/assets/images/factions/Dark Angels.png';
import deathGuard from '@/assets/images/factions/Death Guard.png';
import emperorSChildren from "@/assets/images/factions/Emperor's Children.png";
import genestealerCults from '@/assets/images/factions/Genestealer Cults.png';
import leaguesOfVotann from '@/assets/images/factions/Leagues of Votann.png';
import necrons from '@/assets/images/factions/Necrons.png';
import orks from '@/assets/images/factions/Orks.png';
import spaceWolves from '@/assets/images/factions/Space Wolves.png';
import tAuEmpire from "@/assets/images/factions/T'au Empire.png";
import thousandSons from '@/assets/images/factions/Thousand Sons.png';
import tyranids from '@/assets/images/factions/Tyranids.png';
import ultramarines from '@/assets/images/factions/Ultramarines.png';
import worldEaters from '@/assets/images/factions/World Eaters.png';
/* eslint-enable import-x/no-internal-modules */

const factionIcons = {
    'Adepta Sororitas': adeptaSororitas,
    'Adeptus Custodes': adeptusCustodes,
    'Adeptus Mechanicus': adeptusMechanicus,
    Aeldari: aeldari,
    'Astra Militarum': astraMilitarum,
    'Black Legion': blackLegion,
    'Black Templars': blackTemplars,
    'Blood Angels': bloodAngels,
    'Dark Angels': darkAngels,
    'Death Guard': deathGuard,
    "Emperor's Children": emperorSChildren,
    'Genestealer Cults': genestealerCults,
    'Leagues of Votann': leaguesOfVotann,
    Necrons: necrons,
    Orks: orks,
    'Space Wolves': spaceWolves,
    "T'au Empire": tAuEmpire,
    'Thousand Sons': thousandSons,
    Tyranids: tyranids,
    Ultramarines: ultramarines,
    'World Eaters': worldEaters,
};

type Faction = keyof typeof factionIcons;
const isValidFaction = (faction: string): faction is Faction => faction in factionIcons;

export const FactionImage = ({ faction }: { faction: string }) =>
    isValidFaction(faction) ? (
        <img
            loading={'lazy'}
            className="pointer-events-none [content-visibility:auto]"
            src={factionIcons[faction]}
            width={25}
            alt={faction}
        />
    ) : null;
