import React, { useMemo } from 'react';

import { factionLookup } from '@/fsd/5-shared/lib';
import { FactionId } from '@/fsd/5-shared/model';

import { FactionImage } from '@/fsd/4-entities/faction';

import { groupFactionsByAlliance } from './npc-factions.utils';

interface Props {
    factions: FactionId[];
    faction: FactionId;
    factionChanges: (value: FactionId) => void;
}

/** Faction chips (icon + display name) grouped by alliance and sorted by name; the selected one is highlighted. */
export const NpcFactionPicker: React.FC<Props> = ({ factions, faction, factionChanges }) => {
    const groups = useMemo(() => groupFactionsByAlliance(factions), [factions]);

    return (
        <div role="listbox" aria-label="Faction" className="space-y-2">
            {groups.map(group => (
                <div key={group.alliance} className="flex flex-wrap items-center gap-1.5">
                    <span className="w-16 text-[10px] font-bold tracking-[.14em] text-(--soft-fg) uppercase">
                        {group.alliance}
                    </span>
                    {group.factions.map(option => {
                        const selected = option === faction;
                        return (
                            <button
                                key={option}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                onClick={() => factionChanges(option)}
                                className={[
                                    'flex cursor-pointer items-center gap-1.5 rounded-full border py-1 pr-3 pl-1.5 text-xs transition-colors',
                                    selected
                                        ? 'border-(--primary)/50 bg-(--primary)/15 text-(--fg)'
                                        : 'border-(--border) bg-transparent text-(--soft-fg) hover:border-(--primary)/40 hover:bg-(--primary)/10 hover:text-(--fg)',
                                ].join(' ')}>
                                <FactionImage faction={option} />
                                <span>{factionLookup[option].name}</span>
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};
