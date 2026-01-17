/* eslint-disable import-x/no-internal-modules */
import adeptusMechanicusExtremisChallenge from '@/assets/images/campaigns/resized/Adeptus Mechanicus Extremis Challenge.png';
import adeptusMechanicusExtremis from '@/assets/images/campaigns/resized/Adeptus Mechanicus Extremis.png';
import adeptusMechanicusStandardChallenge from '@/assets/images/campaigns/resized/Adeptus Mechanicus Standard Challenge.png';
import adeptusMechanicusStandard from '@/assets/images/campaigns/resized/Adeptus Mechanicus Standard.png';
import deathGuardExtremisChallenge from '@/assets/images/campaigns/resized/Death Guard Extremis Challenge.png';
import deathGuardExtremis from '@/assets/images/campaigns/resized/Death Guard Extremis.png';
import deathGuardStandardChallenge from '@/assets/images/campaigns/resized/Death Guard Standard Challenge.png';
import deathGuardStandard from '@/assets/images/campaigns/resized/Death Guard Standard.png';
import fallOfCadiaElite from '@/assets/images/campaigns/resized/Fall of Cadia Elite.png';
import fallOfCadiaMirrorElite from '@/assets/images/campaigns/resized/Fall of Cadia Mirror Elite.png';
import fallOfCadiaMirror from '@/assets/images/campaigns/resized/Fall of Cadia Mirror.png';
import fallOfCadia from '@/assets/images/campaigns/resized/Fall of Cadia.png';
import indomitusElite from '@/assets/images/campaigns/resized/Indomitus Elite.png';
import indomitusMirrorElite from '@/assets/images/campaigns/resized/Indomitus Mirror Elite.png';
import indomitusMirror from '@/assets/images/campaigns/resized/Indomitus Mirror.png';
import indomitus from '@/assets/images/campaigns/resized/Indomitus.png';
import octariusElite from '@/assets/images/campaigns/resized/Octarius Elite.png';
import octariusMirrorElite from '@/assets/images/campaigns/resized/Octarius Mirror Elite.png';
import octariusMirror from '@/assets/images/campaigns/resized/Octarius Mirror.png';
import octarius from '@/assets/images/campaigns/resized/Octarius.png';
import onslaught from '@/assets/images/campaigns/resized/Onslaught.png';
import saimHannElite from '@/assets/images/campaigns/resized/Saim-Hann Elite.png';
import saimHannMirrorElite from '@/assets/images/campaigns/resized/Saim-Hann Mirror Elite.png';
import saimHannMirror from '@/assets/images/campaigns/resized/Saim-Hann Mirror.png';
import saimHann from '@/assets/images/campaigns/resized/Saim-Hann.png';
import tAuEmpireExtremisChallenge from "@/assets/images/campaigns/resized/T'au Empire Extremis Challenge.png";
import tAuEmpireExtremis from "@/assets/images/campaigns/resized/T'au Empire Extremis.png";
import tAuEmpireStandardChallenge from "@/assets/images/campaigns/resized/T'au Empire Standard Challenge.png";
import tAuEmpireStandard from "@/assets/images/campaigns/resized/T'au Empire Standard.png";
import tyranidsExtremisChallenge from '@/assets/images/campaigns/resized/Tyranids Extremis Challenge.png';
import tyranidsExtremis from '@/assets/images/campaigns/resized/Tyranids Extremis.png';
import tyranidsStandardChallenge from '@/assets/images/campaigns/resized/Tyranids Standard Challenge.png';
import tyranidsStandard from '@/assets/images/campaigns/resized/Tyranids Standard.png';
/* eslint-enable import-x/no-internal-modules */

import { AccessibleTooltip } from '@/fsd/5-shared/ui';

const campaignImages = {
    'Adeptus Mechanicus Extremis Challenge': adeptusMechanicusExtremisChallenge,
    'Adeptus Mechanicus Extremis': adeptusMechanicusExtremis,
    'Adeptus Mechanicus Standard Challenge': adeptusMechanicusStandardChallenge,
    'Adeptus Mechanicus Standard': adeptusMechanicusStandard,
    'Death Guard Extremis Challenge': deathGuardExtremisChallenge,
    'Death Guard Extremis': deathGuardExtremis,
    'Death Guard Standard Challenge': deathGuardStandardChallenge,
    'Death Guard Standard': deathGuardStandard,
    'Fall of Cadia Elite': fallOfCadiaElite,
    'Fall of Cadia Mirror Elite': fallOfCadiaMirrorElite,
    'Fall of Cadia Mirror': fallOfCadiaMirror,
    'Fall of Cadia': fallOfCadia,
    'Indomitus Elite': indomitusElite,
    'Indomitus Mirror Elite': indomitusMirrorElite,
    'Indomitus Mirror': indomitusMirror,
    Indomitus: indomitus,
    'Octarius Elite': octariusElite,
    'Octarius Mirror Elite': octariusMirrorElite,
    'Octarius Mirror': octariusMirror,
    Octarius: octarius,
    Onslaught: onslaught,
    'Saim-Hann Elite': saimHannElite,
    'Saim-Hann Mirror Elite': saimHannMirrorElite,
    'Saim-Hann Mirror': saimHannMirror,
    'Saim-Hann': saimHann,
    "T'au Empire Extremis Challenge": tAuEmpireExtremisChallenge,
    "T'au Empire Extremis": tAuEmpireExtremis,
    "T'au Empire Standard Challenge": tAuEmpireStandardChallenge,
    "T'au Empire Standard": tAuEmpireStandard,
    'Tyranids Extremis Challenge': tyranidsExtremisChallenge,
    'Tyranids Extremis': tyranidsExtremis,
    'Tyranids Standard Challenge': tyranidsStandardChallenge,
    'Tyranids Standard': tyranidsStandard,
} as const;

type CampaignName = keyof typeof campaignImages;
const isValidCampaignName = (name: string): name is CampaignName => Object.hasOwn(campaignImages, name);

export const CampaignImage = ({ campaign, size = 50 }: { campaign: string; size?: number }) =>
    isValidCampaignName(campaign) ? (
        <AccessibleTooltip title={campaign}>
            <span className="inline-block" style={{ height: size, minWidth: size }}>
                <img className="pointer-events-none" src={campaignImages[campaign]} height={size} alt={campaign} />
            </span>
        </AccessibleTooltip>
    ) : null;
