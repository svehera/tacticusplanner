import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { CampaignProgressionTabId } from './campaign-progression-card';
import { SortMode } from './campaign-progression.utils';

export interface CampaignProgressionFilters {
    sortMode: SortMode;
    setSortMode: (mode: SortMode) => void;
    expandedCardId: string | undefined;
    setExpandedCardId: (id: string | undefined) => void;
    hideNoDrops: boolean;
    setHideNoDrops: (v: boolean) => void;
    hideLocked: boolean;
    setHideLocked: (v: boolean) => void;
    hideCE: boolean;
    setHideCE: (v: boolean) => void;
    activeTabs: Record<string, CampaignProgressionTabId>;
    setActiveTabs: Dispatch<SetStateAction<Record<string, CampaignProgressionTabId>>>;
    getActiveTab: (campaign: string) => CampaignProgressionTabId;
}

export function useCampaignProgressionFilters(): CampaignProgressionFilters {
    const [searchParameters, setSearchParameters] = useSearchParams();

    const [sortMode, setSortMode] = useState<SortMode>(() => (searchParameters.get('sort') as SortMode) || 'savings');
    const [activeTabs, setActiveTabs] = useState<Record<string, CampaignProgressionTabId>>({});
    const [expandedCardId, setExpandedCardId] = useState<string | undefined>(
        () => searchParameters.get('campaign') ?? undefined
    );
    const [hideNoDrops, setHideNoDrops] = useState(() => searchParameters.get('dropsOnly') !== 'false');
    const [hideLocked, setHideLocked] = useState(() => searchParameters.get('hideLocked') !== 'false');
    const [hideCE, setHideCE] = useState(() => searchParameters.get('hideCE') === 'true');

    useEffect(() => {
        const next = new URLSearchParams(searchParameters);
        if (expandedCardId) {
            next.set('campaign', expandedCardId);
        } else {
            next.delete('campaign');
        }
        if (sortMode === 'savings') {
            next.delete('sort');
        } else {
            next.set('sort', sortMode);
        }
        if (hideNoDrops) {
            next.delete('dropsOnly');
        } else {
            next.set('dropsOnly', 'false');
        }
        if (hideLocked) {
            next.delete('hideLocked');
        } else {
            next.set('hideLocked', 'false');
        }
        if (hideCE) {
            next.set('hideCE', 'true');
        } else {
            next.delete('hideCE');
        }
        if (next.toString() !== searchParameters.toString()) {
            setSearchParameters(next, { replace: true });
        }
    }, [expandedCardId, hideCE, hideLocked, hideNoDrops, searchParameters, setSearchParameters, sortMode]);

    const getActiveTab = (campaign: string): CampaignProgressionTabId => activeTabs[campaign] ?? 'mats';

    return {
        sortMode,
        setSortMode,
        expandedCardId,
        setExpandedCardId,
        hideNoDrops,
        setHideNoDrops,
        hideLocked,
        setHideLocked,
        hideCE,
        setHideCE,
        activeTabs,
        setActiveTabs,
        getActiveTab,
    };
}
