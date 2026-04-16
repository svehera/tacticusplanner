import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import React, { lazy, Suspense, useState } from 'react';

import { CampaignImage, Campaign, ICampaignBattleComposed } from '@/fsd/4-entities/campaign';

const LocationDetails = lazy(() => import('./location-details').then(m => ({ default: m.LocationDetails })));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CHALLENGE_CAMPAIGNS = new Set([
    Campaign.AMSC,
    Campaign.AMEC,
    Campaign.DGSC,
    Campaign.DGEC,
    Campaign.TSC,
    Campaign.TEC,
    Campaign.TASC,
    Campaign.TAEC,
    Campaign.ASSC,
    Campaign.ASEC,
]);

const getNodeLabel = (location: ICampaignBattleComposed): string =>
    CHALLENGE_CAMPAIGNS.has(location.campaign) ? `${location.nodeNumber}B` : String(location.nodeNumber);

// ─── LocationRow ─────────────────────────────────────────────────────────────

const LocationRow: React.FC<{ location: ICampaignBattleComposed }> = ({ location }) => {
    const [expanded, setExpanded] = useState(false);
    const [everExpanded, setEverExpanded] = useState(false);

    const nodeLabel = getNodeLabel(location);
    const isOnslaught = location.campaign === Campaign.Onslaught;

    return (
        <div className={`rounded-md transition-colors ${expanded ? 'bg-(--secondary)' : 'hover:bg-(--secondary)'}`}>
            <button
                type="button"
                onClick={() => {
                    setExpanded(v => !v);
                    setEverExpanded(true);
                }}
                className={`flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-sm text-[var(--card-fg)] ${location.isUnlocked ? 'opacity-100' : 'opacity-50'}`}>
                <CampaignImage campaign={location.campaign} size={20} showTooltip={false} />
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="min-w-0 truncate font-medium">{location.campaign}</span>
                    {!isOnslaught && <span className="shrink-0">· {nodeLabel}</span>}
                </div>
                <ExpandMoreIcon
                    className={`shrink-0 text-[18px] text-[var(--muted-fg)] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                />
            </button>

            {everExpanded && (
                <div
                    className={`grid transition-[grid-template-rows] duration-200 ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                        <div className="ml-3 border-l-2 border-(--primary) pr-2 pb-2 pl-3">
                            <Suspense fallback={undefined}>
                                <LocationDetails location={location} />
                            </Suspense>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── ExpandableRaidLocations ──────────────────────────────────────────────────

interface Props {
    locations: ICampaignBattleComposed[];
}

export const ExpandableRaidLocations: React.FC<Props> = ({ locations }) => {
    if (locations.length === 0) return;

    const suggested = locations.filter(l => l.isSuggested && l.isUnlocked);
    const displayLocations = suggested.length > 0 ? suggested : locations;

    return (
        <div className="flex max-h-96 flex-col gap-1 overflow-y-auto">
            {displayLocations.map(loc => (
                <LocationRow key={loc.id} location={loc} />
            ))}
        </div>
    );
};
