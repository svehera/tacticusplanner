/* eslint-disable import-x/no-internal-modules */

import { useState } from 'react';

import { snowprintIcons } from '@/fsd/5-shared/assets';
import { getEnumValues } from '@/fsd/5-shared/lib';
import { calculateStat } from '@/fsd/5-shared/lib/stat-calculator';
import { Rank, Rarity, RarityMapper, RarityStars } from '@/fsd/5-shared/model';
import { getImageUrl, RankSelect, RaritySelect, StarsSelect } from '@/fsd/5-shared/ui';
import { abilityIcons } from '@/fsd/5-shared/ui/ability-icons';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/icon-list';
import { RankIcon } from '@/fsd/5-shared/ui/icons/rank.icon';
import { traitIcons } from '@/fsd/5-shared/ui/trait-icons';

import abilityDataJson from '@/fsd/4-entities/abilities/data/new-ability-data.json';
import characterData2Json from '@/fsd/4-entities/character/data/new-character-data2.json';
import { EquipmentIcon, EquipmentService } from '@/fsd/4-entities/equipment';
import type { IEquipment } from '@/fsd/4-entities/equipment';
import mowsData2Json from '@/fsd/4-entities/mow/data/new-mows-data2.json';
import traitsDataJson from '@/fsd/4-entities/traits/data/new-traits-data.json';
import { getTraitVariables } from '@/fsd/4-entities/traits/trait-variables';
import { IUnit } from '@/fsd/4-entities/unit';
import { isCharacter, isMow } from '@/fsd/4-entities/unit/units.functions';

import { AbilityText } from '@/fsd/3-features/character-details/ability-text-renderer';
import { AbilityVariablesChart } from '@/fsd/3-features/character-details/ability-variables-chart';
import { CharacterStatGrowthChart } from '@/fsd/3-features/character-details/character-stat-growth-chart';

// ── Static data ───────────────────────────────────────────────────────────────

interface AbilityEntry {
    id: string;
    text: { name: string; currentLevelDescription: string; nextLevelDescription: string };
    variables: Record<string, (string | number)[]>;
    constants?: Record<string, string>;
    variablesAffectedByRarityBonus?: string[];
}

const abilityById = new Map((abilityDataJson as unknown as AbilityEntry[]).map(a => [a.id, a]));

interface CharEntry {
    id: string;
    movement: number;
    activeAbilityId: string;
    passiveAbilityIds: string;
    traits: string[];
    initialStats: { damage: number; armor: number; health: number };
    meleeAttack: { hitCount: number; damageType: string };
    rangedAttack?: { hitCount: number; damageType: string; range?: number };
}

const charDataById = new Map(
    (
        characterData2Json as unknown as Array<{
            id: string;
            movement: number;
            activeAbilityId: string;
            passiveAbilityIds: string;
            traits?: string[];
            initialStats: { damage: number; armor: number; health: number };
            meleeAttack: { hitCount: number; pierce: string };
            rangedAttack?: { hitCount: number; pierce: string; range?: number };
        }>
    ).map(c => [
        c.id,
        {
            id: c.id,
            movement: c.movement,
            activeAbilityId: c.activeAbilityId,
            passiveAbilityIds: c.passiveAbilityIds,
            traits: c.traits ?? [],
            initialStats: c.initialStats,
            meleeAttack: { hitCount: c.meleeAttack.hitCount, damageType: c.meleeAttack.pierce },
            rangedAttack: c.rangedAttack
                ? { hitCount: c.rangedAttack.hitCount, damageType: c.rangedAttack.pierce, range: c.rangedAttack.range }
                : undefined,
        } satisfies CharEntry,
    ])
);

interface MowEntry {
    id: string;
    abilities: string[];
    mythicAbilities: string[];
}

const mowDataById = new Map((mowsData2Json as unknown as MowEntry[]).map(m => [m.id, m]));

interface TraitEntry {
    id: string;
    name: string;
    styledName: string;
    description: string;
}

const traitById = new Map((traitsDataJson as unknown as TraitEntry[]).map(t => [t.id, t]));

const relicByUnit = new Map<string, IEquipment>();
for (const equipment of EquipmentService.equipmentData) {
    if (equipment.isRelic) {
        for (const unitId of equipment.allowedUnits) {
            relicByUnit.set(unitId, equipment);
        }
    }
}

const MYTHIC_STAR_VALUES = getEnumValues(RarityStars).filter(
    x => x >= RarityStars.OneBlueStar && x <= RarityStars.MythicWings
);

// ── Sub-components ────────────────────────────────────────────────────────────

const AttackRow = ({ attack, type }: { attack: CharEntry['meleeAttack']; type: 'melee' | 'ranged' }) => {
    const rangedAttack = attack as CharEntry['rangedAttack'];
    const damageTypeIcon = tacticusIcons[`damage${attack.damageType}`];
    return (
        <div className="flex items-center gap-2">
            {type === 'melee' ? (
                <img src={tacticusIcons.meleeAttack.file} alt="Melee" className="h-7 w-7 shrink-0" />
            ) : (
                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center">
                    <img src={tacticusIcons.rangedAttack.file} alt="Range" className="absolute inset-0 h-full w-full" />
                    <span className="relative z-10 text-xs font-bold text-(--ability-range-text)">
                        {rangedAttack?.range}
                    </span>
                </div>
            )}
            {damageTypeIcon && <img src={damageTypeIcon.file} alt={attack.damageType} className="h-8 w-8 shrink-0" />}
            <span className="text-sm font-bold tracking-wide text-(--fg)">{attack.damageType.toUpperCase()}</span>
            <img src={tacticusIcons.hitsIcon.file} alt="Hits" className="h-5 w-5 shrink-0" />
            <span className="text-sm font-semibold text-(--fg)">{attack.hitCount}</span>
        </div>
    );
};

interface AbilityPanelProps {
    abilityId: string | undefined;
    label: string;
    level: number;
    onLevelChange?: (n: number) => void;
    levelControl?: React.ReactNode;
    rarity: Rarity;
    unitName: string;
    factionId: string;
    disableScaling?: boolean;
}

const AbilityPanel = ({
    abilityId,
    label,
    level,
    onLevelChange,
    levelControl,
    rarity,
    unitName,
    factionId,
    disableScaling = false,
}: AbilityPanelProps) => {
    const ability = abilityId ? abilityById.get(abilityId) : undefined;
    const icon = abilityId ? abilityIcons[abilityId] : undefined;
    const scaledVariableNames = disableScaling ? [] : (ability?.variablesAffectedByRarityBonus ?? []);

    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs text-(--soft-fg)">{label}</span>
            {ability ? (
                <div className="-mx-4 bg-(--ability-panel)">
                    {/* Description text — full width */}
                    <div className="px-4 py-2">
                        <AbilityText
                            text={ability.text.currentLevelDescription}
                            level={level}
                            variables={ability.variables}
                            constants={ability.constants ?? {}}
                            scaledVariableNames={scaledVariableNames}
                            rarity={rarity}
                            unitName={unitName}
                            factionId={factionId}
                        />
                        {ability.text.nextLevelDescription && (
                            <>
                                <div className="my-1.5 border-t border-(--ability-panel-divider)" />
                                <span className="text-xs font-semibold text-(--ability-panel-next-level)">
                                    Next Level
                                </span>
                                <AbilityText
                                    text={ability.text.nextLevelDescription}
                                    level={level + 1}
                                    variables={ability.variables}
                                    constants={ability.constants ?? {}}
                                    scaledVariableNames={scaledVariableNames}
                                    rarity={rarity}
                                    unitName={unitName}
                                    factionId={factionId}
                                />
                            </>
                        )}
                    </div>
                    {/* Icon + level control on LEFT, chart on RIGHT */}
                    <div className="flex items-start">
                        <div className="flex w-32 shrink-0 flex-col items-center gap-1 px-4 pb-2">
                            {icon ? (
                                <img src={icon.file} alt={icon.name} title={icon.name} className="h-12 w-12" />
                            ) : (
                                <span className="text-xs text-(--soft-fg)">{abilityId}</span>
                            )}
                            <span className="text-center text-xs text-(--fg)">{icon?.name ?? abilityId}</span>
                            {levelControl}
                            {onLevelChange && (
                                <select
                                    value={level}
                                    onChange={event_ => onLevelChange(Number(event_.target.value))}
                                    className="mt-1 w-full rounded border border-(--border) bg-(--overlay) px-1 py-0.5 text-xs text-(--fg)">
                                    {Array.from({ length: 60 }, (_, index) => index + 1).map(n => (
                                        <option key={n} value={n}>
                                            Level {n}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <AbilityVariablesChart
                                variables={ability.variables}
                                scaledVariableNames={scaledVariableNames}
                                rarity={rarity}
                                currentLevel={level}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                /* No ability data — show icon + controls standalone */
                <div className="flex flex-col items-center gap-1">
                    {icon ? (
                        <img src={icon.file} alt={icon.name} title={icon.name} className="h-12 w-12" />
                    ) : (
                        <span className="text-xs text-(--soft-fg)">{abilityId}</span>
                    )}
                    <span className="text-center text-xs text-(--fg)">{icon?.name ?? abilityId}</span>
                    {levelControl}
                    {onLevelChange && (
                        <select
                            value={level}
                            onChange={event_ => onLevelChange(Number(event_.target.value))}
                            className="mt-1 w-full rounded border border-(--border) bg-(--overlay) px-1 py-0.5 text-xs text-(--fg)">
                            {Array.from({ length: 60 }, (_, index) => index + 1).map(n => (
                                <option key={n} value={n}>
                                    Level {n}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
    unit: IUnit;
    prevUnit?: IUnit;
    nextUnit?: IUnit;
    onNavigate: (unit: IUnit) => void;
    onClose: () => void;
}

export const UnitDetailsPage = ({ unit, prevUnit, nextUnit, onNavigate, onClose }: Props) => {
    const char = isCharacter(unit) ? unit : undefined;
    const mow = isMow(unit) ? unit : undefined;

    const isLocked = char ? char.rank === Rank.Locked : false;

    const [rarity, setRarity] = useState<Rarity>(unit.rarity);
    const [stars, setStars] = useState<RarityStars>(unit.stars);
    const [rank, setRank] = useState<Rank>(isLocked ? Rank.Stone1 : (char?.rank ?? Rank.Stone1));
    const [activeLevel, setActiveLevel] = useState(isLocked ? 1 : (char?.activeAbilityLevel ?? 1));
    const [passiveLevel, setPassiveLevel] = useState(isLocked ? 1 : (char?.passiveAbilityLevel ?? 1));
    const [primaryLevel, setPrimaryLevel] = useState(mow?.primaryAbilityLevel ?? 1);
    const [secondaryLevel, setSecondaryLevel] = useState(mow?.secondaryAbilityLevel ?? 1);
    const equippedRelicEntry = char?.equipment.find(equip => equip.id.startsWith('R_'));
    const [relicLevel, setRelicLevel] = useState(equippedRelicEntry?.level ?? 1);
    const [mythicStars, setMythicStars] = useState<RarityStars>(
        Math.min(RarityStars.MythicWings, Math.max(unit.stars, RarityStars.OneBlueStar)) as RarityStars
    );

    const minStars = RarityMapper.toStars[rarity];
    const maxStars = RarityMapper.toMaxStars[rarity];
    const maxRank = RarityMapper.toMaxRank[rarity];
    const starsValues = getEnumValues(RarityStars).filter(x => x >= minStars && x <= maxStars);
    const rankValues = getEnumValues(Rank).filter(x => x >= Rank.Stone1 && x <= maxRank);

    const mythicLevel = mythicStars - RarityStars.OneBlueStar + 1;

    const handleRarityChange = (newRarity: Rarity) => {
        setRarity(newRarity);
        const newMin = RarityMapper.toStars[newRarity];
        const newMax = RarityMapper.toMaxStars[newRarity];
        setStars(Math.min(Math.max(stars, newMin), newMax) as RarityStars);
        if (char) {
            const newMaxRank = RarityMapper.toMaxRank[newRarity];
            if (rank > newMaxRank) setRank(newMaxRank);
        }
    };

    const charEntry = char ? charDataById.get(char.snowprintId) : undefined;
    const mowEntry = mow ? mowDataById.get(mow.snowprintId) : undefined;
    const charRelic = char ? relicByUnit.get(char.snowprintId) : undefined;
    const relicAbility = charRelic ? abilityById.get(charRelic.abilityId) : undefined;
    const relicStatVariables: Record<string, (string | number)[]> = {};
    if (charRelic) {
        for (const key of Object.keys(charRelic.levels[0].stats)) {
            relicStatVariables[key] = charRelic.levels.map(l => (l.stats as Record<string, number>)[key] ?? 0);
        }
    }
    const relicCombinedVariables = { ...relicAbility?.variables, ...relicStatVariables };

    const damage = charEntry ? calculateStat(charEntry.initialStats.damage, rank, stars) : 0;
    const health = charEntry ? calculateStat(charEntry.initialStats.health, rank, stars) : 0;
    const armor = charEntry ? calculateStat(charEntry.initialStats.armor, rank, stars) : 0;

    const rarityString = RarityMapper.rarityToRarityString(rarity).toLowerCase();
    const capitalizedRarity = rarityString.charAt(0).toUpperCase() + rarityString.slice(1);
    const frameUrl = mow
        ? (snowprintIcons[`mow${capitalizedRarity}Frame` as keyof typeof snowprintIcons]?.file ??
          snowprintIcons.mowCommonFrame.file)
        : (tacticusIcons[`${rarityString}Frame`]?.file ?? tacticusIcons.commonFrame.file);
    const portraitUrl = getImageUrl(unit.icon);

    const navButtonClass =
        'rounded-lg p-2 text-xl leading-none text-(--fg) transition-colors hover:bg-(--overlay) disabled:opacity-30';

    const portrait = (
        <div className="relative mx-auto" style={{ width: 192, height: 280 }}>
            <img
                src={portraitUrl}
                alt={unit.name}
                className="absolute"
                style={{ top: 34, left: 6, width: 180, height: 240 }}
            />
            <img
                src={frameUrl}
                alt=""
                aria-hidden="true"
                className="absolute z-10"
                style={{ top: 28, left: 0, width: 192, height: 252 }}
            />
        </div>
    );

    return (
        <div className="px-4 py-4">
            {/* ── Navigation header ─────────────────────────────────────────── */}
            <div className="mb-4 flex items-center gap-2">
                <button
                    className={navButtonClass}
                    onClick={() => prevUnit && onNavigate(prevUnit)}
                    disabled={!prevUnit}
                    title={prevUnit?.name}>
                    ←
                </button>
                <button
                    className={navButtonClass}
                    onClick={() => nextUnit && onNavigate(nextUnit)}
                    disabled={!nextUnit}
                    title={nextUnit?.name}>
                    →
                </button>
                <div className="flex-1" />
                <button className={navButtonClass} onClick={onClose} aria-label="Back to roster">
                    ✕
                </button>
            </div>

            {/* ── Character: three-column layout ────────────────────────────── */}
            {char && charEntry && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr_1fr]">
                    {/* Col 1: portrait */}
                    <div className="flex flex-col items-center gap-2">
                        <h1 className="text-xl font-bold text-(--fg)">{unit.name}</h1>
                        {portrait}
                    </div>

                    {/* Col 2: selects + stats */}
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-2">
                            <RaritySelect
                                label="Rarity"
                                rarityValues={getEnumValues(Rarity)}
                                value={rarity}
                                valueChanges={handleRarityChange}
                            />
                            <StarsSelect
                                label="Stars"
                                starsValues={starsValues}
                                value={stars}
                                valueChanges={value => setStars(value as RarityStars)}
                            />
                            <RankSelect
                                label="Rank"
                                rankValues={rankValues}
                                value={rank}
                                valueChanges={value => setRank(value as Rank)}
                            />
                        </div>
                        {/* Stat tiles: 2×2 then attacks */}
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { icon: tacticusIcons.health.file, value: health, label: 'Health' },
                                { icon: tacticusIcons.armour.file, value: armor, label: 'Armour' },
                                { icon: tacticusIcons.damage.file, value: damage, label: 'Damage' },
                                { icon: tacticusIcons.movement.file, value: charEntry.movement, label: 'Movement' },
                            ].map(({ icon, value, label }) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-2 rounded-md border border-(--border) px-2 py-1">
                                    <img src={icon} alt={label} className="h-7 w-7 shrink-0" />
                                    <span className="text-sm font-semibold text-(--fg)">{value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-1 border-t border-(--border) pt-2">
                            <AttackRow attack={charEntry.meleeAttack} type="melee" />
                            {charEntry.rangedAttack && <AttackRow attack={charEntry.rangedAttack} type="ranged" />}
                        </div>
                    </div>

                    {/* Col 3: traits */}
                    <div className="flex flex-col gap-2">
                        {charEntry.traits
                            .filter(id => id !== 'Hero')
                            .map(traitId => {
                                const trait = traitById.get(traitId);
                                if (!trait) return;
                                const traitVariables = getTraitVariables(traitId);
                                return (
                                    <div key={traitId} className="rounded-md bg-zinc-100 p-3 dark:bg-zinc-800">
                                        <div className="mb-1 flex items-center gap-2">
                                            {traitIcons[traitId] && (
                                                <img
                                                    src={traitIcons[traitId]}
                                                    alt={trait.name}
                                                    className="h-7 w-7 shrink-0"
                                                />
                                            )}
                                            <span className="text-sm font-semibold">
                                                <AbilityText
                                                    text={trait.styledName}
                                                    level={1}
                                                    variables={{}}
                                                    constants={{}}
                                                    scaledVariableNames={[]}
                                                    rarity={rarity}
                                                    unitName={unit.name}
                                                    factionId={unit.faction}
                                                />
                                            </span>
                                        </div>
                                        <div className="text-xs text-(--fg)">
                                            <AbilityText
                                                text={trait.description}
                                                level={1}
                                                variables={traitVariables}
                                                constants={{}}
                                                scaledVariableNames={[]}
                                                rarity={rarity}
                                                unitName={unit.name}
                                                factionId={unit.faction}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* ── Character: stat growth chart (desktop only) ────────────────── */}
            {char && charEntry && (
                <div className="-mx-4 mt-4 hidden border-t border-(--border) pt-3 lg:block">
                    <CharacterStatGrowthChart
                        baseDamage={charEntry.initialStats.damage}
                        baseHealth={charEntry.initialStats.health}
                        baseArmor={charEntry.initialStats.armor}
                        currentRank={rank}
                        stars={stars}
                        maxRank={maxRank}
                    />
                </div>
            )}

            {/* ── Character: stats by rank table (mobile only) ───────────────── */}
            {char && charEntry && (
                <details className="mt-4 border-t border-(--border) pt-3 lg:hidden">
                    <summary className="cursor-pointer rounded bg-(--overlay) px-2 py-1 text-xs text-(--soft-fg)">
                        Stats by rank
                    </summary>
                    <div className="mt-1 overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-(--border)">
                                    <th className="py-1 pr-3 text-left font-semibold text-(--soft-fg)">Rank</th>
                                    {[
                                        { file: tacticusIcons.health.file, alt: 'Health' },
                                        { file: tacticusIcons.armour.file, alt: 'Armour' },
                                        { file: tacticusIcons.damage.file, alt: 'Damage' },
                                    ].map(({ file, alt }) => (
                                        <th key={alt} className="py-1 pr-3 text-right">
                                            <img src={file} alt={alt} className="inline h-4 w-4" />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rankValues.map(r => (
                                    <tr key={r} className={r === rank ? 'bg-(--overlay) font-semibold' : ''}>
                                        <td className="py-0.5 pr-3">
                                            <RankIcon rank={r} size={14} />
                                        </td>
                                        <td className="py-0.5 pr-3 text-right text-(--fg) tabular-nums">
                                            {calculateStat(charEntry.initialStats.health, r, stars).toLocaleString()}
                                        </td>
                                        <td className="py-0.5 pr-3 text-right text-(--fg) tabular-nums">
                                            {calculateStat(charEntry.initialStats.armor, r, stars).toLocaleString()}
                                        </td>
                                        <td className="py-0.5 text-right text-(--fg) tabular-nums">
                                            {calculateStat(charEntry.initialStats.damage, r, stars).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </details>
            )}

            {/* ── Character: relic panel ────────────────────────────────────── */}
            {char && charRelic && relicAbility && (
                <div className="mt-4 border-t border-(--border) pt-4">
                    <span className="text-xs text-(--soft-fg)">Relic</span>
                    <div className="-mx-4 bg-(--ability-panel)">
                        <div className="px-4 py-2">
                            <AbilityText
                                text={relicAbility.text.currentLevelDescription}
                                level={relicLevel}
                                variables={relicCombinedVariables}
                                constants={relicAbility.constants ?? {}}
                                scaledVariableNames={[]}
                                rarity={rarity}
                                unitName={unit.name}
                                factionId={unit.faction}
                            />
                            {relicAbility.text.nextLevelDescription && relicLevel < 10 && (
                                <>
                                    <div className="my-1.5 border-t border-(--ability-panel-divider)" />
                                    <span className="text-xs font-semibold text-(--ability-panel-next-level)">
                                        Next Level
                                    </span>
                                    <AbilityText
                                        text={relicAbility.text.nextLevelDescription}
                                        level={relicLevel + 1}
                                        variables={relicCombinedVariables}
                                        constants={relicAbility.constants ?? {}}
                                        scaledVariableNames={[]}
                                        rarity={rarity}
                                        unitName={unit.name}
                                        factionId={unit.faction}
                                    />
                                </>
                            )}
                        </div>
                        <div className="flex items-start">
                            <div className="flex w-32 shrink-0 flex-col items-center gap-1 px-4 pb-2">
                                <EquipmentIcon equipment={charRelic} width={56} height={56} />
                                <span className="text-center text-xs text-(--fg)">{charRelic.name}</span>
                                <select
                                    value={relicLevel}
                                    onChange={event_ => setRelicLevel(Number(event_.target.value))}
                                    className="mt-1 w-full rounded border border-(--border) bg-(--overlay) px-1 py-0.5 text-xs text-(--fg)">
                                    {Array.from({ length: 10 }, (_, index) => index + 1).map(n => (
                                        <option key={n} value={n}>
                                            Level {n}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="min-w-0 flex-1">
                                <AbilityVariablesChart
                                    variables={relicCombinedVariables}
                                    scaledVariableNames={[]}
                                    rarity={rarity}
                                    currentLevel={relicLevel}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MoW: portrait + selects ────────────────────────────────────── */}
            {mow && (
                <>
                    <div className="mb-4 flex flex-col items-center gap-2">
                        <h1 className="text-xl font-bold text-(--fg)">{unit.name}</h1>
                        {portrait}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="min-w-0 flex-1">
                            <RaritySelect
                                label="Rarity"
                                rarityValues={getEnumValues(Rarity)}
                                value={rarity}
                                valueChanges={handleRarityChange}
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <StarsSelect
                                label="Stars"
                                starsValues={starsValues}
                                value={stars}
                                valueChanges={value => setStars(value as RarityStars)}
                            />
                        </div>
                    </div>
                </>
            )}

            {/* ── Abilities ─────────────────────────────────────────────────── */}
            <div className="mt-6 flex flex-col gap-6 border-t border-(--border) pt-4">
                {char && charEntry && (
                    <>
                        <AbilityPanel
                            abilityId={charEntry.activeAbilityId}
                            label="Active"
                            level={activeLevel}
                            onLevelChange={setActiveLevel}
                            rarity={rarity}
                            unitName={unit.name}
                            factionId={unit.faction}
                        />
                        <AbilityPanel
                            abilityId={charEntry.passiveAbilityIds}
                            label="Passive"
                            level={passiveLevel}
                            onLevelChange={setPassiveLevel}
                            rarity={rarity}
                            unitName={unit.name}
                            factionId={unit.faction}
                        />
                    </>
                )}
                {mow && mowEntry && (
                    <>
                        <AbilityPanel
                            abilityId={mowEntry.abilities[0]}
                            label="Primary"
                            level={primaryLevel}
                            onLevelChange={setPrimaryLevel}
                            rarity={rarity}
                            unitName={unit.name}
                            factionId={unit.faction}
                        />
                        <AbilityPanel
                            abilityId={mowEntry.abilities[1]}
                            label="Secondary"
                            level={secondaryLevel}
                            onLevelChange={setSecondaryLevel}
                            rarity={rarity}
                            unitName={unit.name}
                            factionId={unit.faction}
                        />
                        <AbilityPanel
                            abilityId={mowEntry.mythicAbilities[0]}
                            label="Mythic"
                            level={mythicLevel}
                            levelControl={
                                <div className="mt-1 w-full">
                                    <StarsSelect
                                        label="Stars"
                                        starsValues={MYTHIC_STAR_VALUES}
                                        value={mythicStars}
                                        valueChanges={v => setMythicStars(v as RarityStars)}
                                        hideText
                                    />
                                </div>
                            }
                            rarity={rarity}
                            unitName={unit.name}
                            factionId={unit.faction}
                            disableScaling
                        />
                    </>
                )}
            </div>
        </div>
    );
};
