import React, { useMemo, useState } from 'react';

import { FactionId } from '@/fsd/5-shared/model';

import { FactionSelect } from '@/fsd/4-entities/faction';
import { INpcData, NpcSelect, NpcService, ProgressionIndexSelect } from '@/fsd/4-entities/npc';

import { NpcStats } from './npc-stats';

export const NpcInfo: React.FC = () => {
    const [faction, setFaction] = useState<FactionId>('Necrons');
    const [npc, setNpc] = useState<INpcData>(NpcService.npcDataFull.find(npc => npc.faction === faction)!);
    const [progressionIndex, setProgressionIndex] = useState<number>(0);

    const factions = useMemo(() => {
        return NpcService.npcDataFull
            .map(npc => npc.faction)
            .filter(faction => faction !== undefined)
            .reduce((acc: FactionId[], faction: FactionId) => {
                if (!acc.includes(faction)) {
                    acc.push(faction);
                }
                return acc;
            }, []);
    }, []);

    const npcs = useMemo(() => {
        return NpcService.npcDataFull.filter(npc => npc.faction === faction);
    }, [faction]);

    const onFactionChange = (newFaction: FactionId) => {
        setFaction(newFaction);
        const npcs = NpcService.npcDataFull.filter(npc => npc.faction === newFaction);
        setNpc(npcs[0]);
        setProgressionIndex(0);
    };

    const onNpcChange = (newNpc: INpcData) => {
        setNpc(newNpc);
        setProgressionIndex(0);
    };

    const currentStats = npc.stats[progressionIndex];

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            {/* Main Card Container */}
            <div className="bg-white dark:bg-[#1a2234] rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                {/* Header / Controls Section */}
                <div className="p-5 bg-gray-50 dark:bg-[#1e293b] border-b border-gray-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col">
                            <FactionSelect
                                label={'Faction'}
                                factions={factions}
                                faction={faction}
                                factionChanges={onFactionChange}
                            />
                        </div>
                        <div className="flex flex-col">
                            <NpcSelect label={'NPC'} npcs={npcs} npc={npc} npcChanges={onNpcChange} />
                        </div>
                        <div className="flex flex-col">
                            <ProgressionIndexSelect
                                label={'NPC Level'}
                                npc={npc}
                                index={progressionIndex}
                                indexChanges={setProgressionIndex}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <NpcStats npc={npc} currentStats={currentStats} />
            </div>
        </div>
    );
};
