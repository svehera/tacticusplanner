import { useEffect, useState } from 'react';

import { DamageType } from '@/fsd/5-shared/model';

import { getImageUrl } from '../get-image-url';

/** Maps DamageType value → snowprint asset filename, for the few damage types whose asset
 * filename doesn't match the enum value (renames/spacing on Snowprint's side). Only consulted
 * as a fallback if the "correctly" named file 404s, so this self-heals if they ever fix it. */
const damageTypeFileOverrides: Partial<Record<DamageType, string>> = {
    [DamageType.Direct]: 'ui_icon_damage_profile2_DirectDamage.png',
    [DamageType.HeavyRound]: 'ui_icon_damage_profile2_HeavyRound.png',
    // Renamed in-game to "Gauss"; the DamageType enum value is stale.
    [DamageType.Molecular]: 'ui_icon_damage_profile2_Gauss.png',
};

function defaultDamageTypeIconFilename(damageType: DamageType): string {
    return `ui_icon_damage_profile2_${damageType.replaceAll(/\s+/g, '')}.png`;
}

export const DamageTypeImage = ({
    damageType,
    width,
    height,
}: {
    damageType: DamageType;
    width?: number;
    height?: number;
}) => {
    const override = damageTypeFileOverrides[damageType];
    const [useOverride, setUseOverride] = useState(false);
    useEffect(() => setUseOverride(false), [damageType]);

    const filename = useOverride && override ? override : defaultDamageTypeIconFilename(damageType);
    const image = getImageUrl(`snowprint_assets/damage_icons/${filename}`);

    return (
        <img
            loading={'lazy'}
            className="pointer-events-none h-auto w-auto"
            style={{ maxWidth: width ?? 25, maxHeight: height ?? 25 }}
            src={image}
            alt={damageType}
            onError={() => {
                if (override && !useOverride) setUseOverride(true);
            }}
        />
    );
};
