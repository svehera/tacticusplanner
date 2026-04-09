import React, { useMemo, useState, useCallback, memo } from 'react';

import { ButtonPill } from '@/fsd/5-shared/ui';

import { ICampaignBattleComposed } from '@/fsd/4-entities/campaign/@x/upgrade';
import { ChipCampaignLocation } from '@/fsd/4-entities/campaign/chip-campaign-location';

interface Props {
    locations: ICampaignBattleComposed[];
    maxLocations?: number;
    compactRaidLocations?: boolean;
}

const Component: React.FC<Props> = ({ locations, maxLocations, compactRaidLocations = true }) => {
    const [expanded, setExpanded] = useState(false);

    const effectiveMaxLocations = useMemo(() => {
        if (typeof maxLocations === 'number') return maxLocations;
        return compactRaidLocations ? 4 : 2;
    }, [maxLocations, compactRaidLocations]);

    const displayLocations = useMemo(() => {
        const suggested = locations.filter(x => x.isSuggested && x.isUnlocked);
        return suggested.length > 0 ? suggested : locations;
    }, [locations]);

    const safeMaxLocations = useMemo(
        () => Math.max(1, Math.floor(Number(effectiveMaxLocations) || 1)),
        [effectiveMaxLocations]
    );

    const visibleLocations = expanded
        ? displayLocations.length
        : displayLocations.length > safeMaxLocations
          ? Math.max(0, safeMaxLocations - 1)
          : safeMaxLocations;

    const visibleLocationList = useMemo(() => {
        return expanded ? displayLocations : displayLocations.slice(0, visibleLocations);
    }, [expanded, displayLocations, visibleLocations]);

    const expand = useCallback(() => setExpanded(true), []);
    const collapse = useCallback(() => setExpanded(false), []);

    return (
        <div
            className={`text-muted-fg flex gap-y-1 text-xs ${compactRaidLocations ? 'flex-wrap items-center gap-x-2' : 'flex-col'}`}>
            {visibleLocationList.map(loc => (
                <ChipCampaignLocation
                    key={loc.id}
                    location={loc}
                    unlocked={loc.isUnlocked ?? false}
                    compact={compactRaidLocations}
                />
            ))}

            {displayLocations.length > safeMaxLocations && !expanded && (
                <ButtonPill onClick={expand} compact={compactRaidLocations}>
                    +{displayLocations.length - visibleLocations} more
                </ButtonPill>
            )}

            {displayLocations.length > safeMaxLocations && expanded && (
                <ButtonPill onClick={collapse} compact={compactRaidLocations}>
                    less
                </ButtonPill>
            )}
        </div>
    );
};

export const RaidLocations = memo(Component, (previous, next) => {
    return (
        previous.maxLocations === next.maxLocations &&
        previous.locations === next.locations &&
        previous.compactRaidLocations === next.compactRaidLocations
    );
});
