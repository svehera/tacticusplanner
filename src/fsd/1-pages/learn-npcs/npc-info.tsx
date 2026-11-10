import { uniq } from 'lodash';
import React, { useMemo, useState } from 'react';

import { filterMap } from '@/fsd/5-shared/lib';
import { FactionId } from '@/fsd/5-shared/model';
import { Card, CardContent } from '@/fsd/5-shared/ui';

import { FactionImage } from '@/fsd/4-entities/faction';
import {
    INpcData,
    NpcAbilities,
    NpcLevelSlider,
    NpcRoundPortrait,
    NpcSelect,
    NpcService,
    NpcStats,
} from '@/fsd/4-entities/npc';

import { NpcFactionPicker } from './npc-faction-picker';

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="mb-2 text-xs font-bold tracking-widest text-(--soft-fg) uppercase">{children}</h3>
);

export const NpcInfo: React.FC = () => {
    const [faction, setFaction] = useState<FactionId>('Necrons');
    const [npc, setNpc] = useState<INpcData>(NpcService.npcDataFull.find(npc => npc.faction === faction)!);
    const [progressionIndex, setProgressionIndex] = useState<number>(0);

    const factions = useMemo(() => uniq(filterMap(NpcService.npcDataFull, npc => npc.faction)), []);

    const npcs = useMemo(() => {
        return NpcService.npcDataFull.filter(npc => npc.faction === faction);
    }, [faction]);

    const onFactionChange = (newFaction: FactionId) => {
        setFaction(newFaction);
        const foundNpc = NpcService.npcDataFull.find(npc => npc.faction === newFaction);
        if (!foundNpc) return;
        setNpc(foundNpc);
        setProgressionIndex(0);
    };

    const onNpcChange = (newNpc: INpcData) => {
        setNpc(newNpc);
        setProgressionIndex(0);
    };

    const currentStats = npc.stats[progressionIndex];

    return (
        <div className="space-y-6 py-6">
            <div>
                <h2>NPCs</h2>
                <p className="text-sm text-(--soft-fg)">Browse enemy stats, attacks and traits at every level.</p>
            </div>

            <Card>
                <CardContent className="space-y-5 p-5">
                    <section>
                        <SectionLabel>Faction</SectionLabel>
                        <NpcFactionPicker factions={factions} faction={faction} factionChanges={onFactionChange} />
                    </section>
                    <section>
                        <SectionLabel>NPC</SectionLabel>
                        <NpcSelect npcs={npcs} npc={npc} npcChanges={onNpcChange} />
                    </section>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="space-y-6 p-5">
                    <div className="flex items-center gap-4">
                        <NpcRoundPortrait npc={npc} className="size-20 ring-2 ring-(--primary)" />
                        <div>
                            <div className="text-xl font-semibold">{npc.name}</div>
                            <div className="mt-1 flex items-center gap-2 text-sm text-(--soft-fg)">
                                {npc.faction && <FactionImage faction={npc.faction} />}
                                <span>{npc.faction}</span>
                                {npc.alliance && <span>&bull; {npc.alliance}</span>}
                            </div>
                        </div>
                    </div>
                    <NpcLevelSlider npc={npc} index={progressionIndex} indexChanges={setProgressionIndex} />
                    <NpcStats npc={npc} currentStats={currentStats} />
                    <NpcAbilities npc={npc} currentStats={currentStats} />
                </CardContent>
            </Card>
        </div>
    );
};
