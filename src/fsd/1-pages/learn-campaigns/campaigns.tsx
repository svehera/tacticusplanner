import { uniq } from 'lodash';
import { ReactNode, useMemo } from 'react';

import { useQueryState } from '@/fsd/5-shared/lib';
import { Select } from '@/fsd/5-shared/ui';

import { Campaign, CampaignLocation, CampaignsService } from '@/fsd/4-entities/campaign';

import { AllowedFactions } from './allowed-factions';
import { CampaignBattleCard } from './campaign-battle-card';

const CampaignCardGrid = ({ children }: { children: ReactNode }) => (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] items-start gap-3">{children}</div>
);

export const Campaigns = () => {
    const [campaign, setCampaign] = useQueryState(
        'campaign',
        initQueryParameter => initQueryParameter ?? Campaign.I,
        value => value.toString()
    );

    const campaignsOptions = useMemo(() => Object.keys(CampaignsService.campaignsGrouped).toSorted(), []);

    const rows = useMemo(() => CampaignsService.campaignsGrouped[campaign], [campaign]);

    const { allies } = useMemo(() => CampaignsService.getEnemiesAndAllies(campaign as Campaign), [campaign]);

    const threeSlotsNodes = uniq(rows.filter(x => x.slots === 3));

    return (
        <div className="space-y-8 py-6">
            <div>
                <h2>Campaigns</h2>
                <p className="text-sm text-(--soft-fg)">Battle rewards, enemies, and allowed factions per campaign.</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-(--border) bg-(--overlay)">
                <div className="flex flex-wrap items-end gap-4 px-3 py-2.5">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold tracking-[.14em] text-(--soft-fg) uppercase">
                            Campaign
                        </span>
                        <Select
                            options={campaignsOptions}
                            value={campaign}
                            onChange={setCampaign}
                            className="w-full md:w-64"
                            renderOption={value => (
                                <span>
                                    {value} ({CampaignsService.campaignsGrouped[value].length})
                                </span>
                            )}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-(--border) px-3 py-2.5">
                    <AllowedFactions alliance={allies.alliance} factions={allies.factions} />

                    {threeSlotsNodes.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold tracking-[.14em] text-(--soft-fg) uppercase">
                                3 Slots Nodes
                            </span>
                            {threeSlotsNodes.map(x => (
                                <CampaignLocation key={x.id} location={x} unlocked={true} short={true} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CampaignCardGrid>
                {rows.map(x => (
                    <CampaignBattleCard key={x.id} battle={x} />
                ))}
            </CampaignCardGrid>
        </div>
    );
};
