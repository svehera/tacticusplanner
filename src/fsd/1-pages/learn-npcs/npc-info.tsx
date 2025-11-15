import React, { useMemo, useState } from 'react';

import { Faction } from '@/fsd/5-shared/model';
import { getImageUrl } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { FactionSelect } from '@/fsd/4-entities/faction';
import { INpcData, NpcService, NpcSelect, ProgressionIndexSelect } from '@/fsd/4-entities/npc';

export const NpcInfo: React.FC = () => {
    const [faction, setFaction] = useState<Faction>(Faction.Necrons);
    const [npc, setNpc] = useState<INpcData>(NpcService.npcDataFull.find(npc => npc.faction === faction)!);
    const [progressionIndex, setProgressionIndex] = useState<number>(0);

    const factions = useMemo(() => {
        return NpcService.npcDataFull
            .map(npc => npc.faction)
            .filter(faction => faction !== undefined)
            .reduce((acc: Faction[], faction: Faction) => {
                if (!acc.includes(faction)) {
                    acc.push(faction);
                }
                return acc;
            }, []);
    }, [NpcService.npcDataFull]);

    const npcs = useMemo(() => {
        return NpcService.npcDataFull.filter(npc => npc.faction === faction);
    }, [faction, NpcService.npcDataFull]);

    const onFactionChange = (newFaction: Faction) => {
        setFaction(newFaction);
        const npcs = NpcService.npcDataFull.filter(npc => npc.faction === newFaction);
        setNpc(npcs[0]);
        setProgressionIndex(0);
    };

    const onNpcChange = (newNpc: INpcData) => {
        setNpc(newNpc);
        setProgressionIndex(0);
    };

    const onProgressionIndexChange = (newIndex: number) => {
        setProgressionIndex(newIndex);
    };

    return (
        <div>
            <div className="flex gap-[3px] justify-left">
                <FactionSelect
                    label={'Faction'}
                    factions={factions}
                    faction={faction}
                    factionChanges={value => onFactionChange(value)}
                />
            </div>
            <div className="h-5 w-auto"></div>
            <div className="flex gap-[3px] justify-left">
                <NpcSelect label={'NPC'} npcs={npcs} npc={npc} npcChanges={value => onNpcChange(value)} />
            </div>
            <div className="h-5 w-auto"></div>
            <div className="flex gap-[3px] justify-left"></div>
            <ProgressionIndexSelect
                label={'NPC Level'}
                npc={npc}
                index={progressionIndex}
                indexChanges={value => onProgressionIndexChange(value)}
            />
            <div className="flex gap-[3px] justify-left items-center">
                <MiscIcon icon="health" />
                <span>{npc.stats[progressionIndex]?.health}</span>
            </div>
            <div className="flex gap-[3px] justify-left items-center">
                <MiscIcon icon="armour" />
                <span>{npc.stats[progressionIndex]?.armor}</span>
            </div>
            <div className="flex gap-[3px] justify-left items-center">
                <MiscIcon icon="damage" />
                <span>{npc.stats[progressionIndex]?.damage}</span>
            </div>
            <div className="flex gap-[3px] justify-left items-center">
                <MiscIcon icon="meleeAttack" />
                <MiscIcon icon={'damage' + npc.meleeDamage!} />
                <MiscIcon icon="hits" />
                <span>{npc.meleeHits!}</span>
            </div>
            {npc.rangeDamage !== undefined && (
                <div className="flex gap-[3px] justify-left items-center">
                    <MiscIcon icon="rangedAttack" />
                    <MiscIcon icon={'damage' + npc.rangeDamage!} />
                    <MiscIcon icon="hits" />
                    <span>{npc.rangeHits!}</span>
                </div>
            )}
            <div>
                {npc.traits.map(trait => {
                    const icon = NpcService.getTraitIcon(trait);
                    if (!icon) return null;
                    return (
                        <img
                            key={trait}
                            src={getImageUrl(icon)}
                            alt={trait}
                            title={trait}
                            style={{ height: 32, marginRight: 8 }}
                        />
                    );
                })}
            </div>
        </div>
    );
};
