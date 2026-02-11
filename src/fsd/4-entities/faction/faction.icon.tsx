/* eslint-disable import-x/no-internal-modules */

// The imports are a little verbose, but this way we get proper image optimization from Vite
// It also allows us to correct mismatches between the faction IDs and the image file names
import Sisterhood from '@/assets/images/factions/Adepta Sororitas.png';
import Custodes from '@/assets/images/factions/Adeptus Custodes.png';
import AdeptusMechanicus from '@/assets/images/factions/Adeptus Mechanicus.png';
import Aeldari from '@/assets/images/factions/Aeldari.png';
import AstraMilitarum from '@/assets/images/factions/Astra Militarum.png';
import BlackLegion from '@/assets/images/factions/Black Legion.png';
import BlackTemplars from '@/assets/images/factions/Black Templars.png';
import BloodAngels from '@/assets/images/factions/Blood Angels.png';
import DarkAngels from '@/assets/images/factions/Dark Angels.png';
import DeathGuard from '@/assets/images/factions/Death Guard.png';
import EmperorsChildren from "@/assets/images/factions/Emperor's Children.png";
import Genestealers from '@/assets/images/factions/Genestealer Cults.png';
import LeaguesOfVotann from '@/assets/images/factions/Leagues of Votann.png';
import Necrons from '@/assets/images/factions/Necrons.png';
import Orks from '@/assets/images/factions/Orks.png';
import SpaceWolves from '@/assets/images/factions/Space Wolves.png';
import Tau from "@/assets/images/factions/T'au Empire.png";
import ThousandSons from '@/assets/images/factions/Thousand Sons.png';
import Tyranids from '@/assets/images/factions/Tyranids.png';
import Ultramarines from '@/assets/images/factions/Ultramarines.png';
import WorldEaters from '@/assets/images/factions/World Eaters.png';

import { FactionId } from '@/fsd/5-shared/model';

const factionImages: { [key in FactionId]: string } = {
    AdeptusMechanicus,
    Aeldari,
    AstraMilitarum,
    BlackLegion,
    BlackTemplars,
    BloodAngels,
    Custodes,
    DarkAngels,
    DeathGuard,
    EmperorsChildren,
    Genestealers,
    LeaguesOfVotann,
    Necrons,
    Orks,
    Sisterhood,
    SpaceWolves,
    Tau,
    ThousandSons,
    Tyranids,
    Ultramarines,
    WorldEaters,
} as const;

export const FactionImage = ({ faction }: { faction: FactionId }) => {
    const imageUrl = factionImages[faction];

    return (
        <img
            loading={'lazy'}
            className="pointer-events-none [content-visibility:auto]"
            src={imageUrl}
            width={25}
            alt={faction}
        />
    );
};
