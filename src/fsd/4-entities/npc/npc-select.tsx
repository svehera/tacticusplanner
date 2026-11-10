import React from 'react';

import { getImageUrl } from '@/fsd/5-shared/ui';

import { INpcData } from './model';

interface Props {
    npcs: INpcData[];
    npc: INpcData;
    npcChanges: (value: INpcData) => void;
}

/** Round portrait of an NPC, cropped to the face area of the tall in-game portrait. */
export const NpcRoundPortrait: React.FC<{ npc: INpcData; className?: string }> = ({ npc, className = 'size-14' }) => (
    <img
        src={getImageUrl(npc.icon)}
        alt={npc.name}
        loading="lazy"
        className={`${className} shrink-0 rounded-full bg-(--soft) object-cover object-top`}
    />
);

/** Grid of round NPC portraits; the selected one is ringed. */
export const NpcSelect: React.FC<Props> = ({ npcs, npc, npcChanges }) => (
    <div role="listbox" aria-label="NPC" className="flex flex-wrap gap-2">
        {npcs.map(option => {
            const selected = option.snowprintId === npc.snowprintId;
            return (
                <button
                    key={option.snowprintId}
                    type="button"
                    title={`${option.name} (${option.snowprintId})`}
                    role="option"
                    aria-selected={selected}
                    onClick={() => npcChanges(option)}
                    className={[
                        'flex w-20 cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 transition-colors',
                        selected
                            ? 'border-(--primary)/50 bg-(--primary)/15 text-(--fg)'
                            : 'border-transparent text-(--soft-fg) hover:border-(--primary)/40 hover:bg-(--primary)/10 hover:text-(--fg)',
                    ].join(' ')}>
                    <NpcRoundPortrait
                        npc={option}
                        className={`size-14 ${selected ? 'ring-2 ring-(--primary)' : 'ring-1 ring-(--border)'}`}
                    />
                    <span className="line-clamp-2 text-center text-[11px] leading-tight">{option.name}</span>
                </button>
            );
        })}
    </div>
);
