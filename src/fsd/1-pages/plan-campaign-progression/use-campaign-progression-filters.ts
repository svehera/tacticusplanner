import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { CampaignProgressionTabId } from './campaign-progression-card';
import { SortMode } from './campaign-progression.utils';

const sortModes = new Set<SortMode>(['savings', 'earlyPayoff', 'goalPriority', 'unlocks']);

function getSortMode(searchParameters: URLSearchParams): SortMode {
    const sortMode = searchParameters.get('sort');
    return sortMode && sortModes.has(sortMode as SortMode) ? (sortMode as SortMode) : 'savings';
}

function getExpandedCardId(searchParameters: URLSearchParams): string | undefined {
    return searchParameters.get('campaign') ?? undefined;
}

function getHideNoDrops(searchParameters: URLSearchParams): boolean {
    return searchParameters.get('dropsOnly') !== 'false';
}

function getHideLocked(searchParameters: URLSearchParams): boolean {
    return searchParameters.get('hideLocked') !== 'false';
}

function getHideCE(searchParameters: URLSearchParams): boolean {
    return searchParameters.get('hideCE') === 'true';
}

/** All filter and sort state exposed by `useCampaignProgressionFilters`, synced to URL search params. */
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

/** Manages filter/sort state for the Campaign Progression page, persisting selections to URL search params. */
export function useCampaignProgressionFilters(): CampaignProgressionFilters {
    const [searchParameters, setSearchParameters] = useSearchParams();

    const [sortMode, setSortMode] = useState<SortMode>(() => getSortMode(searchParameters));
    const [activeTabs, setActiveTabs] = useState<Record<string, CampaignProgressionTabId>>({});
    const [expandedCardId, setExpandedCardId] = useState<string | undefined>(() => getExpandedCardId(searchParameters));
    const [hideNoDrops, setHideNoDrops] = useState(() => getHideNoDrops(searchParameters));
    const [hideLocked, setHideLocked] = useState(() => getHideLocked(searchParameters));
    const [hideCE, setHideCE] = useState(() => getHideCE(searchParameters));

    useEffect(() => {
        const nextSortMode = getSortMode(searchParameters);
        const nextExpandedCardId = getExpandedCardId(searchParameters);
        const nextHideNoDrops = getHideNoDrops(searchParameters);
        const nextHideLocked = getHideLocked(searchParameters);
        const nextHideCE = getHideCE(searchParameters);

        setSortMode(current => (current === nextSortMode ? current : nextSortMode));
        setExpandedCardId(current => (current === nextExpandedCardId ? current : nextExpandedCardId));
        setHideNoDrops(current => (current === nextHideNoDrops ? current : nextHideNoDrops));
        setHideLocked(current => (current === nextHideLocked ? current : nextHideLocked));
        setHideCE(current => (current === nextHideCE ? current : nextHideCE));
    }, [searchParameters]);

    useEffect(() => {
        setSearchParameters(
            current => {
                const next = new URLSearchParams(current);
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

                return next.toString() === current.toString() ? current : next;
            },
            { replace: true }
        );
    }, [expandedCardId, hideCE, hideLocked, hideNoDrops, setSearchParameters, sortMode]);

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
