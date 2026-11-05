import { uniq } from 'lodash';
import { ReactNode, useMemo } from 'react';

import { useQueryState } from '@/fsd/5-shared/lib';
import { Card, CardContent } from '@/fsd/5-shared/ui';

import { Campaign, CampaignImage, CampaignLocation, CampaignsService } from '@/fsd/4-entities/campaign';

import { AllowedFactions } from './allowed-factions';
import { CampaignBattleCard } from './campaign-battle-card';
import { getCampaignSections } from './campaigns.utils';

const CampaignCardGrid = ({ children }: { children: ReactNode }) => (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] items-start gap-3">{children}</div>
);

const SectionLabel = ({ children }: { children: ReactNode }) => (
    <h3 className="text-xs font-bold tracking-widest text-(--soft-fg) uppercase">{children}</h3>
);

export const Campaigns = () => {
    const [campaign, setCampaign] = useQueryState(
        'campaign',
        initQueryParameter => initQueryParameter ?? Campaign.I,
        value => value.toString()
    );

    const sections = useMemo(() => getCampaignSections(Object.keys(CampaignsService.campaignsGrouped)), []);

    const rows = useMemo(() => CampaignsService.campaignsGrouped[campaign], [campaign]);

    const { allies } = useMemo(() => CampaignsService.getEnemiesAndAllies(campaign as Campaign), [campaign]);

    const threeSlotsNodes = uniq(rows.filter(x => x.slots === 3));

    return (
        <div className="space-y-6 py-6">
            <div>
                <h2>Campaigns</h2>
                <p className="text-sm text-(--soft-fg)">Battle rewards, enemies, and allowed factions per campaign.</p>
            </div>

            <Card>
                <CardContent className="space-y-4 p-5">
                    {sections.map(section => (
                        <section key={section.label} className="space-y-2">
                            <SectionLabel>{section.label}</SectionLabel>
                            <div role="listbox" aria-label={section.label} className="flex flex-wrap gap-1.5">
                                {section.campaigns.map(option => {
                                    const selected = option === campaign;
                                    return (
                                        <button
                                            key={option}
                                            type="button"
                                            role="option"
                                            aria-selected={selected}
                                            onClick={() => setCampaign(option)}
                                            className={[
                                                'flex cursor-pointer items-center gap-1.5 rounded-full border py-1 pr-3 pl-1.5 text-xs transition-colors',
                                                selected
                                                    ? 'border-(--primary)/50 bg-(--primary)/15 text-(--fg)'
                                                    : 'border-(--border) bg-transparent text-(--soft-fg) hover:border-(--primary)/40 hover:bg-(--primary)/10 hover:text-(--fg)',
                                            ].join(' ')}>
                                            <CampaignImage campaign={option} size={20} showTooltip={false} />
                                            <span>{option}</span>
                                            <span className="text-(--soft-fg) tabular-nums">
                                                {CampaignsService.campaignsGrouped[option].length}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardContent className="flex flex-col gap-4 p-5">
                    <div className="flex items-center gap-3">
                        <CampaignImage campaign={campaign} size={40} showTooltip={false} />
                        <div>
                            <div className="text-xl font-semibold">{campaign}</div>
                            <div className="text-sm text-(--soft-fg)">{rows.length} battles</div>
                        </div>
                    </div>

                    <AllowedFactions alliance={allies.alliance} factions={allies.factions} />

                    {threeSlotsNodes.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <SectionLabel>3 slots nodes</SectionLabel>
                            {threeSlotsNodes.map(x => (
                                <CampaignLocation key={x.id} location={x} unlocked={true} short={true} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <CampaignCardGrid>
                {rows.map(x => (
                    <CampaignBattleCard key={x.id} battle={x} />
                ))}
            </CampaignCardGrid>
        </div>
    );
};
