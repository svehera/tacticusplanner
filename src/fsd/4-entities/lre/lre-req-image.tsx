/* eslint-disable import-x/no-internal-modules */
import defeatAll from '@/assets/images/lre/_defeatAll.png';
import astraMilitarum from '@/assets/images/lre/astra_militarum.png';
import blackLegion from '@/assets/images/lre/black_legion.png';
import blast from '@/assets/images/lre/blast.png';
import bolter from '@/assets/images/lre/bolter.png';
import chain from '@/assets/images/lre/chain.png';
import closeCombatWeakness from '@/assets/images/lre/close_combat_weakness.png';
import deepStrike from '@/assets/images/lre/deep strike.png';
import eviscerate from '@/assets/images/lre/eviscerate.png';
import flame from '@/assets/images/lre/flame.png';
import flying from '@/assets/images/lre/flying.png';
import getStuckIn from '@/assets/images/lre/get stuck in.png';
import heavyWeapon from '@/assets/images/lre/heavy_weapon.png';
import hits from '@/assets/images/lre/hits.png';
import infiltrate from '@/assets/images/lre/infiltrate.png';
import mech from '@/assets/images/lre/mech.png';
import melee from '@/assets/images/lre/melee.png';
import noBigTarget from '@/assets/images/lre/no_bigTarget.png';
import noBolter from '@/assets/images/lre/no_bolter.png';
import noFinalVengeance from '@/assets/images/lre/no_finalVengeance.png';
import noFlying from '@/assets/images/lre/no_flying.png';
import noMech from '@/assets/images/lre/no_mech.png';
import noOverwatch from '@/assets/images/lre/no_overwatch.png';
import noPhysical from '@/assets/images/lre/no_physical.png';
import noPower from '@/assets/images/lre/no_power.png';
import noPsychic from '@/assets/images/lre/no_psychic.png';
import noSummons from '@/assets/images/lre/no_summons.png';
import noTerminator from '@/assets/images/lre/no_terminator.png';
import physical from '@/assets/images/lre/physical.png';
import piercing from '@/assets/images/lre/piercing.png';
import power from '@/assets/images/lre/power.png';
import psychic from '@/assets/images/lre/psychic.png';
import psyker from '@/assets/images/lre/psyker.png';
import ranged from '@/assets/images/lre/ranged.png';
import rangedSpecialist from '@/assets/images/lre/ranged_specialist.png';
import rapidAssault from '@/assets/images/lre/rapid assault.png';
import resilient from '@/assets/images/lre/resilient.png';
import score from '@/assets/images/lre/score.png';
import terminator from '@/assets/images/lre/terminator.png';
import terrifying from '@/assets/images/lre/terrifying.png';
import token from '@/assets/images/lre/token.png';
import unstoppable from '@/assets/images/lre/unstoppable.png';
/* eslint-enable import-x/no-internal-modules */

import { AccessibleTooltip } from '@/fsd/5-shared/ui';

const lreImageMap = {
    _defeatAll: defeatAll,
    astra_militarum: astraMilitarum,
    black_legion: blackLegion,
    blast: blast,
    bolter: bolter,
    chain: chain,
    close_combat_weakness: closeCombatWeakness,
    'deep strike': deepStrike,
    eviscerate: eviscerate,
    flame: flame,
    flying: flying,
    'get stuck in': getStuckIn,
    heavy_weapon: heavyWeapon,
    hits: hits,
    infiltrate: infiltrate,
    mech: mech,
    melee: melee,
    no_bigTarget: noBigTarget,
    no_bolter: noBolter,
    no_finalVengeance: noFinalVengeance,
    no_flying: noFlying,
    no_mech: noMech,
    no_overwatch: noOverwatch,
    no_physical: noPhysical,
    no_power: noPower,
    no_psychic: noPsychic,
    no_summons: noSummons,
    no_terminator: noTerminator,
    physical: physical,
    piercing: piercing,
    power: power,
    psychic: psychic,
    psyker: psyker,
    ranged_specialist: rangedSpecialist,
    ranged: ranged,
    'rapid assault': rapidAssault,
    resilient: resilient,
    score: score,
    terminator: terminator,
    terrifying: terrifying,
    token: token,
    unstoppable: unstoppable,
} as const;

type LreReq = keyof typeof lreImageMap;
const isValidLreReq = (iconId: string): iconId is LreReq => Object.hasOwn(lreImageMap, iconId);

export const LreReqImage = ({ iconId, tooltip, sizePx }: { iconId: string; tooltip?: string; sizePx?: number }) => {
    if (!isValidLreReq(iconId)) return null;
    const img = (
        <img
            loading={'lazy'}
            className="pointer-events-none [content-visibility:auto]"
            width={sizePx ?? 25}
            height={sizePx ?? 25}
            src={lreImageMap[iconId]}
            alt={iconId}
        />
    );
    return tooltip ? (
        <AccessibleTooltip title={tooltip}>
            <span>{img}</span>
        </AccessibleTooltip>
    ) : (
        img
    );
};
