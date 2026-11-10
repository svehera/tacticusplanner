/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import React from 'react';

import { abilityIcons } from '@/fsd/5-shared/ui/ability-icons';

import { AbilityText } from '@/fsd/3-features/character-details/ability-text-renderer';

import { INpcData, INpcStats } from './model';
import { getNpcAbilityEntries } from './npc-abilities.utils';
import { NpcService } from './npc-service';

interface Props {
    npc: INpcData;
    currentStats?: INpcStats;
    /** Tailwind classes for the abilities grid; defaults to two columns on wide screens. */
    gridClassName?: string;
}

/** Active and passive abilities of an NPC, rendered at the ability level tied to its current progression index. */
export const NpcAbilities: React.FC<Props> = ({ npc, currentStats, gridClassName = 'grid-cols-1 lg:grid-cols-2' }) => {
    const entries = getNpcAbilityEntries(npc);
    if (entries.length === 0 || !currentStats) return;

    const rarity = NpcService.resolveRarityFromStars(currentStats.rarityStars);

    return (
        <section className="space-y-3">
            <div className="flex items-baseline justify-between">
                <h3 className="text-xs font-bold tracking-widest text-(--soft-fg) uppercase">Abilities</h3>
                <span className="text-xs text-(--soft-fg) tabular-nums">Ability level {currentStats.abilityLevel}</span>
            </div>
            <div className={`grid gap-3 ${gridClassName}`}>
                {entries.map(({ kind, id, ability }) => {
                    const icon = abilityIcons[id];
                    return (
                        <div key={`${kind}-${id}`} className="flex flex-col gap-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-xs text-(--soft-fg)">{kind}</span>
                                <span className="text-sm font-semibold text-(--fg)">{ability?.text.name ?? id}</span>
                            </div>
                            <div className="flex items-start gap-3 rounded-md bg-(--ability-panel) px-3 py-2">
                                {icon && <img src={icon.file} alt={icon.name} title={icon.name} className="size-12" />}
                                <div className="min-w-0 flex-1">
                                    {ability ? (
                                        <AbilityText
                                            text={ability.text.currentLevelDescription}
                                            level={currentStats.abilityLevel}
                                            variables={ability.variables}
                                            constants={ability.constants ?? {}}
                                            scaledVariableNames={[]}
                                            rarity={rarity}
                                            unitName={npc.name}
                                            factionId={npc.faction ?? ''}
                                        />
                                    ) : (
                                        <span className="text-xs text-(--soft-fg)">No description available.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
