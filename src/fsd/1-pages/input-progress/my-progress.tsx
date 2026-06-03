/* eslint-disable import-x/no-internal-modules */
import { groupBy } from 'lodash';
import { useCallback, useContext, useMemo } from 'react';

import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { Campaign, CampaignsService, ICampaignModel } from '@/fsd/4-entities/campaign';

import { getMaxNodes } from './get-max-nodes';
import { StoryRow } from './story-row';

// Mirror campaign IDs — everything else in standard is "Normal"
const MIRROR_IDS = new Set<Campaign>([
    Campaign.IM,
    Campaign.IME,
    Campaign.FoCM,
    Campaign.FoCME,
    Campaign.OM,
    Campaign.OME,
    Campaign.SHM,
    Campaign.SHME,
]);

const getStats = (campaigns: ICampaignModel[], progress: Record<Campaign, number>) => {
    const maxTotal = campaigns.reduce((a, c) => a + getMaxNodes(c.difficulty), 0);
    const done = campaigns.reduce((a, c) => a + (progress[c.id] ?? 0), 0);
    const cleared = campaigns.filter(
        c => getMaxNodes(c.difficulty) > 0 && (progress[c.id] ?? 0) >= getMaxNodes(c.difficulty)
    ).length;
    return {
        pct: maxTotal > 0 ? Math.round((done / maxTotal) * 100) : 0,
        done,
        maxTotal,
        cleared,
        count: campaigns.length,
    };
};

// ─── SectionHeading ───────────────────────────────────────────────────────────

interface SectionHeadingProps {
    label: string;
    count: number;
    cleared: number;
}

const SectionHeading = ({ label, count, cleared }: SectionHeadingProps) => (
    <div className="flex items-center gap-2 border-b border-(--border) pb-2">
        <span className="text-[11px] font-bold tracking-[0.12em] text-(--fg) uppercase">{label}</span>
        <span className="rounded-full border border-(--border) bg-(--neutral) px-2 py-0.5 text-[10px] font-bold">
            {count}
        </span>
        <span className="flex-1" />
        <span className="text-[11px] text-(--soft-fg)">{cleared} cleared</span>
    </div>
);

// ─── StatBlock ────────────────────────────────────────────────────────────────

interface StatBlockProps {
    label: string;
    pct: number;
    done: number;
    maxTotal: number;
    cleared: number;
    count: number;
    accent?: boolean;
}

const StatBlock = ({ label, pct, done, maxTotal, cleared, count, accent }: StatBlockProps) => (
    <div className="flex flex-col gap-0.5 text-right">
        <p className="text-[10px] font-bold tracking-[0.14em] text-(--soft-fg) uppercase">{label}</p>
        <p
            className={`text-[32px] leading-none font-bold tracking-[-0.02em] tabular-nums ${accent ? 'text-(--primary)' : 'text-(--fg)'}`}>
            {pct}%
        </p>
        <p className="text-[11px] text-(--soft-fg) tabular-nums">
            {done}/{maxTotal} · {cleared}/{count} cleared
        </p>
    </div>
);

// ─── MyProgress ───────────────────────────────────────────────────────────────

export const MyProgress = () => {
    const { characters, campaignsProgress, dailyRaids } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const updateCampaignProgress = useCallback(
        (id: Campaign, value: number) => {
            dispatch.campaignsProgress({ type: 'Update', campaign: id, progress: value });
        },
        [dispatch]
    );

    // active goal campaigns derived from daily raids
    const activeGoalCampaigns = useMemo(
        () => new Set<Campaign>(dailyRaids.raidedLocations.map(r => r.campaign)),
        [dailyRaids.raidedLocations]
    );

    // partition standard campaigns into Normal and Mirror columns
    const normalCampaigns = useMemo(() => CampaignsService.standardCampaigns.filter(c => !MIRROR_IDS.has(c.id)), []);
    const mirrorCampaigns = useMemo(() => CampaignsService.standardCampaigns.filter(c => MIRROR_IDS.has(c.id)), []);
    const eventCampaigns = useMemo(() => CampaignsService.campaignEvents, []);

    // group by storyline (groupType)
    const normalByGroup = useMemo(() => Object.values(groupBy(normalCampaigns, 'groupType')), [normalCampaigns]);
    const mirrorByGroup = useMemo(() => Object.values(groupBy(mirrorCampaigns, 'groupType')), [mirrorCampaigns]);
    const eventsByGroup = useMemo(() => Object.values(groupBy(eventCampaigns, 'groupType')), [eventCampaigns]);

    // aggregate stats for the header
    const normalStats = useMemo(
        () => getStats(normalCampaigns, campaignsProgress),
        [normalCampaigns, campaignsProgress]
    );
    const mirrorStats = useMemo(
        () => getStats(mirrorCampaigns, campaignsProgress),
        [mirrorCampaigns, campaignsProgress]
    );
    const eventsStats = useMemo(() => getStats(eventCampaigns, campaignsProgress), [eventCampaigns, campaignsProgress]);

    return (
        <div className="space-y-8 py-6">
            {/* Summary stats */}
            <div className="flex flex-wrap gap-4 sm:gap-8">
                <StatBlock label="Normal" accent {...normalStats} />
                <StatBlock label="Mirror" {...mirrorStats} />
                <StatBlock label="Events" {...eventsStats} />
            </div>

            {/* Normal + Mirror side by side */}
            <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2">
                <section className="space-y-3">
                    <SectionHeading
                        label="Normal Campaigns"
                        count={normalCampaigns.length}
                        cleared={normalStats.cleared}
                    />
                    <div className="space-y-3">
                        {normalByGroup.map(campaigns => (
                            <StoryRow
                                key={campaigns[0].groupType}
                                campaigns={campaigns}
                                progress={campaignsProgress}
                                characters={characters}
                                activeGoals={activeGoalCampaigns}
                                onSet={updateCampaignProgress}
                            />
                        ))}
                    </div>
                </section>

                <section className="space-y-3">
                    <SectionHeading
                        label="Mirror Campaigns"
                        count={mirrorCampaigns.length}
                        cleared={mirrorStats.cleared}
                    />
                    <div className="space-y-3">
                        {mirrorByGroup.map(campaigns => (
                            <StoryRow
                                key={campaigns[0].groupType}
                                campaigns={campaigns}
                                progress={campaignsProgress}
                                characters={characters}
                                activeGoals={activeGoalCampaigns}
                                onSet={updateCampaignProgress}
                            />
                        ))}
                    </div>
                </section>
            </div>

            {/* Campaign Events — full width */}
            <section className="space-y-3">
                <SectionHeading label="Campaign Events" count={eventCampaigns.length} cleared={eventsStats.cleared} />
                <div className="space-y-3">
                    {eventsByGroup.map(campaigns => (
                        <StoryRow
                            key={campaigns[0].groupType}
                            campaigns={campaigns}
                            progress={campaignsProgress}
                            characters={characters}
                            activeGoals={activeGoalCampaigns}
                            onSet={updateCampaignProgress}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
};
