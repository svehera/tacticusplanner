import { JSX } from 'react';

import type { IMissionChain } from '@/fsd/4-entities/shops';

import { MissionTaskText } from './mission-task-text';

export interface MissionRewardInfo {
    icon: JSX.Element;
    label: string;
    qty: number | string | undefined;
}

export type MissionRewardResolver = (rewardId: string) => MissionRewardInfo;

interface Props {
    chain: IMissionChain;
    rewardInfo: MissionRewardResolver;
}

export function MissionChainCard({ chain, rewardInfo }: Props) {
    return (
        <div className="flex flex-col gap-2 rounded-xl border border-(--border) bg-(--overlay) p-4">
            <div className="flex flex-col gap-1">
                {chain.tasks.map((task, index) => (
                    <MissionTaskText key={index} task={task} />
                ))}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 border-t border-(--border) pt-2">
                {chain.rewards.map((reward, index) => {
                    const { icon, label, qty } = rewardInfo(reward);
                    return (
                        <div key={index} className="flex items-center gap-2">
                            <div className="flex size-8 shrink-0 items-center justify-center">{icon}</div>
                            <span className="text-sm text-(--fg)">
                                {qty !== undefined && <span className="mr-1 font-semibold tabular-nums">×{qty}</span>}
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
