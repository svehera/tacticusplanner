/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { useMemo } from 'react';

import { cn } from '@/fsd/5-shared/lib';
import type { Rarity } from '@/fsd/5-shared/model';
import { Select } from '@/fsd/5-shared/ui/selects/select';

import {
    describeModifier,
    formatAbilityName,
    getModifierIcon,
    getModifierPortraitUrl,
    getModifierTitle,
    guildBossData,
    type GuildBossEncounterModifier,
} from '@/fsd/4-entities/guild_boss';

import { AbilityText } from '@/fsd/3-features/character-details/ability-text-renderer';

interface PrimeModifierPanelProps {
    portraitUrl?: string;
    displayName: string;
    encounterModifiers: GuildBossEncounterModifier[];
    totalHp: number;
    rarity: Rarity;
    selectedHpLost: number;
    onChange: (hpLost: number) => void;
}

function hpRemainingLabel(hpLost: number, totalHp: number): string {
    return `${Math.max(0, totalHp - hpLost).toLocaleString()} / ${totalHp.toLocaleString()} HP Remaining`;
}

export function PrimeModifierPanel({
    portraitUrl,
    displayName,
    encounterModifiers,
    totalHp,
    rarity,
    selectedHpLost,
    onChange,
}: PrimeModifierPanelProps) {
    const sortedModifiers = useMemo(
        () => encounterModifiers.toSorted((a, b) => a.hpLost - b.hpLost),
        [encounterModifiers]
    );

    const modifierByHpLost = useMemo(() => new Map(sortedModifiers.map(m => [m.hpLost, m])), [sortedModifiers]);

    const options = useMemo(() => [0, ...sortedModifiers.map(m => m.hpLost)], [sortedModifiers]);

    const renderModifierRow = (hpLost: number) => {
        const encounterModifier = modifierByHpLost.get(hpLost);
        if (!encounterModifier) {
            return (
                <div className="w-full py-1">
                    <span className="text-sm font-semibold text-(--fg)">{hpRemainingLabel(hpLost, totalHp)}</span>
                    <p className="text-xs text-(--fg-muted)">No modifiers active yet.</p>
                </div>
            );
        }

        const modifierDefinition = guildBossData.modifiers[encounterModifier.modifier];
        const description = modifierDefinition
            ? describeModifier(modifierDefinition)
            : formatAbilityName(encounterModifier.modifier);
        const portraitIconUrl = modifierDefinition ? getModifierPortraitUrl(modifierDefinition) : undefined;
        const abilityIcons = modifierDefinition ? getModifierIcon(modifierDefinition) : undefined;
        const title = modifierDefinition
            ? getModifierTitle(modifierDefinition)
            : formatAbilityName(encounterModifier.modifier);
        const isActive = encounterModifier.hpLost <= selectedHpLost;

        return (
            <div className={cn('w-full rounded-md bg-(--ability-panel) p-3', !isActive && 'opacity-50')}>
                <div className="flex items-start gap-3">
                    {portraitIconUrl ? (
                        <img src={portraitIconUrl} alt={title} className="h-12 w-12 shrink-0" />
                    ) : (
                        abilityIcons?.map((icon, index) => (
                            <img key={index} src={icon.file} alt={icon.name} className="h-12 w-12 shrink-0" />
                        ))
                    )}
                    <div className="flex-1">
                        <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-(--fg)">{title}</span>
                            <span className="shrink-0 text-xs text-(--fg-muted) tabular-nums">
                                {hpRemainingLabel(encounterModifier.hpLost, totalHp)}
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
    };

    return (
        <div className="flex items-center gap-3">
            {portraitUrl ? (
                <img src={portraitUrl} alt={displayName} className="size-14 shrink-0 rounded-full object-cover" />
            ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-(--bg-tertiary) text-xs text-(--fg-muted)">
                    ?
                </div>
            )}
            <Select<number>
                options={options}
                value={selectedHpLost}
                onChange={onChange}
                label={displayName}
                renderValue={hpLost => hpRemainingLabel(hpLost, totalHp)}
                renderOption={renderModifierRow}
                className="w-full"
                panelClassName="w-[min(34rem,90vw)] max-h-[30rem]"
            />
        </div>
    );
}
