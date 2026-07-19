import { PortalDialog } from '@/fsd/5-shared/ui';

import { INpcData, INpcStats } from './model';
import { NpcStats } from './npc-stats';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    npc: INpcData | undefined;
    stats: INpcStats | undefined; // The specific level stats
}

export const NpcDetailModal: React.FC<Props> = ({ isOpen, onClose, npc, stats }: Props) => {
    if (!npc) return;

    return (
        <PortalDialog open={isOpen} onClose={onClose} aria-label={npc.name || 'Unknown Enemy'} size="lg">
            <PortalDialog.Header>
                <div className="flex flex-col">
                    <span>{npc.name || 'Unknown Enemy'}</span>
                    <span className="text-xs font-normal tracking-wider text-(--soft-fg) uppercase">
                        {npc.faction} &bull; Rank {stats?.rank}
                    </span>
                </div>
            </PortalDialog.Header>
            <PortalDialog.Body className="pb-6">
                <NpcStats npc={npc} currentStats={stats} />
            </PortalDialog.Body>
        </PortalDialog>
    );
};
