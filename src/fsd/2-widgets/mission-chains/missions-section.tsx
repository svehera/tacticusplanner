import type { IEventMissions } from '@/fsd/4-entities/shops';

import { MissionChainCard, MissionRewardResolver } from './mission-chain-card';

const SECTION_LABELS: Record<keyof IEventMissions, string> = {
    daily: 'Daily',
    free: 'Free',
    premium: 'Premium',
    battlePass: 'Battle Pass',
};

interface Props {
    missions: IEventMissions;
    rewardInfo: MissionRewardResolver;
}

export function MissionsSection({ missions, rewardInfo }: Props) {
    const sections = (Object.keys(SECTION_LABELS) as (keyof IEventMissions)[])
        .map(key => ({ key, label: SECTION_LABELS[key], chains: missions[key] ?? [] }))
        .filter(section => section.chains.length > 0);

    if (sections.length === 0) {
        return (
            <div className="rounded-xl border border-(--border) bg-(--overlay) p-8 text-center text-(--soft-fg)">
                No missions for this event.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {sections.map(section => (
                <div key={section.key}>
                    <h3 className="mb-3 font-semibold">{section.label}</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {section.chains.map((chain, index) => (
                            <MissionChainCard key={chain.name || index} chain={chain} rewardInfo={rewardInfo} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
