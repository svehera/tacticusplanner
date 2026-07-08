/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { cn } from '@/fsd/5-shared/lib';
import type { Rarity } from '@/fsd/5-shared/model';

import { resolveModifierDisplay, type GuildBossEncounterModifier } from '@/fsd/4-entities/guild_boss';

import { AbilityText } from '@/fsd/3-features/character-details/ability-text-renderer';

interface ModifiersSectionProps {
    modifiers?: GuildBossEncounterModifier[];
    totalHp: number;
    rarity: Rarity;
}

export function ModifiersSection({ modifiers, totalHp, rarity }: ModifiersSectionProps) {
    if (!modifiers || modifiers.length === 0) return;

    return (
        <div>
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-(--fg-muted) uppercase">Modifiers</h3>
            <div className="flex flex-col gap-2">
                {modifiers.map((encounterModifier, index) => {
                    const { title, description, portraitUrl, abilityIcons } = resolveModifierDisplay(
                        encounterModifier.modifier
                    );
                    const hpRemaining = totalHp - encounterModifier.hpLost;
                    const isInactive = hpRemaining <= 0;

                    return (
                        <div
                            key={index}
                            className={cn('rounded-md bg-(--ability-panel) p-3', isInactive && 'opacity-50')}>
                            <div className="flex items-start gap-3">
                                {portraitUrl ? (
                                    <img src={portraitUrl} alt={title} className="h-12 w-12 shrink-0" />
                                ) : (
                                    abilityIcons?.map((icon, iconIndex) => (
                                        <img
                                            key={iconIndex}
                                            src={icon.file}
                                            alt={icon.name}
                                            className="h-12 w-12 shrink-0"
                                        />
                                    ))
                                )}
                                <div className="flex-1">
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                        <span className="text-sm font-semibold text-(--fg)">{title}</span>
                                        <span className="shrink-0 text-xs text-(--fg-muted) tabular-nums">
                                            {Math.max(0, hpRemaining).toLocaleString()} / {totalHp.toLocaleString()} HP
                                            Remaining
                                        </span>
                                    </div>
                                    <AbilityText
                                        text={description}
                                        level={1}
                                        variables={{}}
                                        constants={{}}
                                        scaledVariableNames={[]}
                                        rarity={rarity}
                                        unitName=""
                                        factionId=""
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
