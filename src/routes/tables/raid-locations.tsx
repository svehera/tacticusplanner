import React, { useMemo, useState, useCallback } from 'react';

import { ButtonPill } from '@/fsd/5-shared/ui';

import { ICampaignBattleComposed } from '@/fsd/4-entities/campaign/@x/upgrade';
import { CompactCampaignLocation } from '@/fsd/4-entities/campaign/compact-campaign-location';

interface Props {
    locations: ICampaignBattleComposed[];
    maxLocations?: number;
}

const Component: React.FC<Props> = ({ locations, maxLocations = 4 }) => {
    const [expanded, setExpanded] = useState(false);

    const displayLocations = useMemo(() => {
        const suggested = locations.filter(x => x.isSuggested && x.isUnlocked);
        return suggested.length > 0 ? suggested : locations;
    }, [locations]);

    const safeMaxLocations = useMemo(() => Math.max(0, Math.floor(Number(maxLocations) || 0)), [maxLocations]);

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
        <div className="text-muted-fg flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {visibleLocationList.map(loc => (
                <CompactCampaignLocation key={loc.id} location={loc} unlocked={loc.isUnlocked ?? false} />
            ))}

            {displayLocations.length > safeMaxLocations && !expanded && (
                <ButtonPill onClick={expand}>+{displayLocations.length - visibleLocations} more</ButtonPill>
            )}

            {displayLocations.length > safeMaxLocations && expanded && <ButtonPill onClick={collapse}>less</ButtonPill>}
        </div>
    );
};

export const RaidLocations = React.memo(Component, (previous, next) => {
    return previous.maxLocations === next.maxLocations && previous.locations === next.locations;
});
