// Or use your own Icon component/SVG

import { INpcData, INpcStats } from '@/fsd/4-entities/npc';

import { NpcStats } from './npc-stats';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    npc: INpcData | null;
    stats: INpcStats | null; // The specific level stats
}

export const NpcDetailModal: React.FC<Props> = ({ isOpen, onClose, npc, stats }: Props) => {
    if (!isOpen || !npc) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm transition-opacity">
            {/* Modal Container */}
            <div className="scrollbar-hide relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#1a2234]">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-[#1e293b]">
                    <div className="flex items-center gap-3">
                        {/* We can reuse NpcPortrait here if desired, or just the name */}
                        <div className="flex flex-col">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {npc.name || 'Unknown Enemy'}
                            </h2>
                            <span className="text-xs tracking-wider text-gray-500 uppercase">
                                {npc.faction} &bull; Rank {stats?.rank}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-white">
                        {/* Simple X icon */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Body - Reusing your existing NpcStats component */}
                <div className="p-2">
                    <NpcStats npc={npc} currentStats={stats!} />
                </div>
            </div>

            {/* Backdrop click to close */}
            <div className="absolute inset-0 -z-10" onClick={onClose}></div>
        </div>
    );
};
