import { useEffect, useState } from 'react';

import { Trait } from '@/fsd/5-shared/model';

import { getImageUrl } from '../get-image-url';

/** Maps Trait label → snowprint asset filename, for the handful of traits whose asset
 * filename doesn't match the label (typos/renames on Snowprint's side). Only consulted
 * as a fallback if the "correctly" named file 404s, so this self-heals if they ever fix it. */
const traitFileOverrides: Partial<Record<Trait, string>> = {
    [Trait.BeastSnagga]: 'ui_icon_trait_beast_slayer_01.png',
    [Trait.BlessingsOfKhorne]: 'ui_icon_trait_blessing_of_khorne_01.png',
    [Trait.CloseCombatWeakness]: 'ui_icon_trait_combat_weakness_01.png',
    [Trait.ContagionsOfNurgle]: 'ui_icon_trait_contagions_01.png',
    [Trait.Daemon]: 'ui_icon_trait_daemonic_01.png',
    [Trait.TeleportStrike]: 'ui_icon_trait_teleport_strike_01.png',
    [Trait.Diminutive]: 'ui_icon_trait_diminuitive_01.png',
    [Trait.FinalJustice]: 'ui_icon_trait_only_in_death_01.png',
    [Trait.LivingMetal]: 'ui_icon_trait_livingmetall_01.png',
    [Trait.MartialKatah]: 'ui_icon_trait_martial_katah_01.png',
    [Trait.MkXGravis]: 'ui_icon_trait_mk_gravis_01.png',
    [Trait.Psyker]: 'ui_icon_trait_psychic_01.png',
    [Trait.SuppressiveFire]: 'ui_icon_trait_supressive_fire_01.png',
    [Trait.TerminatorArmour]: 'ui_icon_trait_terminator_amour_01.png',
    [Trait.TwoManTeam]: 'ui_icon_trait_2_man_team_01.png',
    [Trait.WeaverOfFate]: 'ui_icon_trait_weavers_of_fate_01.png',
    [Trait.Unstoppable]: 'ui_icon_trait_unknown_01.png',
    [Trait.GetStuckIn]: 'ui_icon_trait_unknown_01.png',
};

function defaultTraitIconFilename(trait: Trait): string {
    const snake = trait.toLowerCase().replaceAll(/\s+/g, '_');
    return `ui_icon_trait_${snake}_01.png`;
}

export const TraitImage = ({ trait, width, height }: { trait: Trait; width?: number; height?: number }) => {
    const override = traitFileOverrides[trait];
    const [useOverride, setUseOverride] = useState(false);
    useEffect(() => setUseOverride(false), [trait]);

    const filename = useOverride && override ? override : defaultTraitIconFilename(trait);
    const image = getImageUrl(`snowprint_assets/traits/${filename}`);

    return (
        <img
            loading={'lazy'}
            className="pointer-events-none h-auto w-auto"
            style={{ maxWidth: width ?? 25, maxHeight: height ?? 25 }}
            src={image}
            alt={trait}
            onError={() => {
                if (override && !useOverride) setUseOverride(true);
            }}
        />
    );
};
