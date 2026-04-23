import { useState } from 'react';

import { ButtonPill } from '@/fsd/5-shared/ui';

import { ChipCampaignLocation, ICampaignBattleComposed } from '@/fsd/4-entities/campaign';

interface Props {
    locations: ICampaignBattleComposed[];
    maxLocations?: number;
    compactRaidLocations?: boolean;
    clickable?: boolean;
}

export const RaidLocations = ({ locations, maxLocations, compactRaidLocations = true, clickable = true }: Props) => {
    const [expanded, setExpanded] = useState(false);

    const effectiveMaxLocations = typeof maxLocations === 'number' ? maxLocations : compactRaidLocations ? 4 : 2;
    const suggested = locations.filter(x => x.isSuggested && x.isUnlocked);
    const displayLocations = suggested.length > 0 ? suggested : locations;
    const safeMaxLocations = Math.max(1, Math.floor(Number(effectiveMaxLocations) || 1));

    const visibleLocations = expanded
        ? displayLocations.length
        : displayLocations.length > safeMaxLocations
          ? Math.max(0, safeMaxLocations - 1)
          : safeMaxLocations;

    const visibleLocationList = expanded ? displayLocations : displayLocations.slice(0, visibleLocations);

    return (
        <div
            className={`flex gap-y-1 text-xs text-inherit ${compactRaidLocations ? 'flex-wrap items-center gap-x-2' : 'flex-col'}`}>
            {visibleLocationList.map(loc => (
                <ChipCampaignLocation
                    key={loc.id}
                    location={loc}
                    unlocked={loc.isUnlocked ?? false}
                    compact={compactRaidLocations}
                    clickable={clickable}
                />
            ))}

            {displayLocations.length > safeMaxLocations && !expanded && (
                <ButtonPill onClick={() => setExpanded(true)} compact={compactRaidLocations}>
                    +{displayLocations.length - visibleLocations} more
                </ButtonPill>
            )}

            {displayLocations.length > safeMaxLocations && expanded && (
                <ButtonPill onClick={() => setExpanded(false)} compact={compactRaidLocations}>
                    less
                </ButtonPill>
            )}
        </div>
    );
};
