/* eslint-disable import-x/no-internal-modules */

import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { getEnumValues } from '@/fsd/5-shared/lib';
import { calculateStat } from '@/fsd/5-shared/lib/stat-calculator';
import { Rank, Rarity, RarityMapper, RarityStars } from '@/fsd/5-shared/model';
import { getImageUrl, RankSelect, RaritySelect, StarsSelect } from '@/fsd/5-shared/ui';
import { abilityIcons } from '@/fsd/5-shared/ui/ability-icons';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/icon-list';
import { RankIcon } from '@/fsd/5-shared/ui/icons/rank.icon';

import abilityDataJson from '@/fsd/4-entities/abilities/data/new-ability-data.json';
import { ICharacter2 } from '@/fsd/4-entities/character';
import characterData2Json from '@/fsd/4-entities/character/data/new-character-data2.json';

import { AbilityText } from '@/fsd/3-features/character-details/ability-text-renderer';
import { AbilityVariablesChart } from '@/fsd/3-features/character-details/ability-variables-chart';
import { CharacterStatGrowthChart } from '@/fsd/3-features/character-details/character-stat-growth-chart';

interface AttackProfile {
    hitCount: number;
    damageType: string;
    range?: number;
}

interface CharData2Entry {
    id: string;
    movement: number;
    activeAbilityId: string;
    passiveAbilityIds: string;
    initialStats: { damage: number; armor: number; health: number };
    meleeAttack: AttackProfile;
    rangedAttack?: AttackProfile;
}

const characterData2 = (
    characterData2Json as unknown as Array<{
        id: string;
        movement: number;
        activeAbilityId: string;
        passiveAbilityIds: string;
        initialStats: { damage: number; armor: number; health: number };
        meleeAttack: { hitCount: number; pierce: string };
        rangedAttack?: { hitCount: number; pierce: string; range?: number };
    }>
).map(c => ({
    id: c.id,
    movement: c.movement,
    activeAbilityId: c.activeAbilityId,
    passiveAbilityIds: c.passiveAbilityIds,
    initialStats: c.initialStats,
    meleeAttack: { hitCount: c.meleeAttack.hitCount, damageType: c.meleeAttack.pierce },
    rangedAttack: c.rangedAttack
        ? { hitCount: c.rangedAttack.hitCount, damageType: c.rangedAttack.pierce, range: c.rangedAttack.range }
        : undefined,
})) satisfies CharData2Entry[];

interface AbilityEntry {
    id: string;
    text: { name: string; currentLevelDescription: string; nextLevelDescription: string };
    variables: Record<string, (string | number)[]>;
    constants?: Record<string, string>;
    variablesAffectedByRarityBonus?: string[];
}

const abilityData = abilityDataJson as unknown as AbilityEntry[];
const abilityById = new Map(abilityData.map(a => [a.id, a]));

const AttackRow = ({ attack, type }: { attack: AttackProfile; type: 'melee' | 'ranged' }) => {
    const damageTypeIcon = tacticusIcons[`damage${attack.damageType}`];
    return (
        <div className="flex items-center gap-2">
            {type === 'melee' ? (
                <img src={tacticusIcons.meleeAttack.file} alt="Melee" className="h-7 w-7 shrink-0" />
            ) : (
                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center">
                    <img src={tacticusIcons.rangedAttack.file} alt="Range" className="absolute inset-0 h-full w-full" />
                    <span className="relative z-10 text-xs font-bold text-white">{attack.range}</span>
                </div>
            )}
            {damageTypeIcon && <img src={damageTypeIcon.file} alt={attack.damageType} className="h-8 w-8 shrink-0" />}
            <span className="text-sm font-bold tracking-wide text-(--fg)">{attack.damageType.toUpperCase()}</span>
            <img src={tacticusIcons.hitsIcon.file} alt="Hits" className="h-5 w-5 shrink-0" />
            <span className="text-sm font-semibold text-(--fg)">{attack.hitCount}</span>
        </div>
    );
};

interface Props {
    char: ICharacter2;
    prevChar?: ICharacter2;
    nextChar?: ICharacter2;
}

export const CharacterDetailsPage = ({ char, prevChar, nextChar }: Props) => {
    const [, setSearchParameters] = useSearchParams();

    const [rarity, setRarity] = useState<Rarity>(char.rarity);
    const [stars, setStars] = useState<RarityStars>(char.stars);
    const [rank, setRank] = useState<Rank>(char.rank === Rank.Locked ? Rank.Stone1 : char.rank);
    const isLocked = char.rank === Rank.Locked;
    const [activeLevel, setActiveLevel] = useState(isLocked ? 1 : char.activeAbilityLevel);
    const [passiveLevel, setPassiveLevel] = useState(isLocked ? 1 : char.passiveAbilityLevel);

    const minStars = RarityMapper.toStars[rarity];
    const maxStars = RarityMapper.toMaxStars[rarity];
    const maxRank = RarityMapper.toMaxRank[rarity];
    const starsValues = getEnumValues(RarityStars).filter(x => x >= minStars && x <= maxStars);
    const rankValues = getEnumValues(Rank).filter(x => x >= Rank.Stone1 && x <= maxRank);

    const handleRarityChange = (newRarity: Rarity) => {
        setRarity(newRarity);
        const newMin = RarityMapper.toStars[newRarity];
        const newMax = RarityMapper.toMaxStars[newRarity];
        setStars(Math.min(Math.max(stars, newMin), newMax) as RarityStars);
        const newMaxRank = RarityMapper.toMaxRank[newRarity];
        if (rank > newMaxRank) setRank(newMaxRank);
    };

    const entry = characterData2.find(c => c.id === char.snowprintId);
    const damage = calculateStat(entry?.initialStats.damage ?? char.damage, rank, stars);
    const health = calculateStat(entry?.initialStats.health ?? char.health, rank, stars);
    const armor = calculateStat(entry?.initialStats.armor ?? char.armour, rank, stars);

    const rarityString = RarityMapper.rarityToRarityString(rarity).toLowerCase();
    const frameUrl = tacticusIcons[`${rarityString}Frame`]?.file ?? tacticusIcons.commonFrame.file;
    const portraitUrl = getImageUrl(char.icon);

    const abilities = useMemo(
        () =>
            entry
                ? ([
                      { id: entry.activeAbilityId, label: 'Active', level: activeLevel, setLevel: setActiveLevel },
                      { id: entry.passiveAbilityIds, label: 'Passive', level: passiveLevel, setLevel: setPassiveLevel },
                  ] as const)
                : [],
        [entry, activeLevel, passiveLevel]
    );

    const goToChar = (c: ICharacter2) => setSearchParameters({ character: c.snowprintId });
    const closeDetails = () =>
        setSearchParameters(previous => {
            const next = new URLSearchParams(previous);
            next.delete('character');
            return next;
        });

    const navButtonClass =
        'rounded-lg p-2 text-xl leading-none text-(--fg) transition-colors hover:bg-(--overlay) disabled:opacity-30';

    return (
        <div className="px-4 py-4">
            {/* ── Navigation header ───────────────────────────────────────── */}
            <div className="mb-6 flex items-center gap-2">
                <button
                    className={navButtonClass}
                    onClick={() => prevChar && goToChar(prevChar)}
                    disabled={!prevChar}
                    title={prevChar?.name}>
                    ←
                </button>
                <h1 className="flex-1 text-center text-xl font-bold text-(--fg)">{char.name}</h1>
                <button
                    className={navButtonClass}
                    onClick={() => nextChar && goToChar(nextChar)}
                    disabled={!nextChar}
                    title={nextChar?.name}>
                    →
                </button>
                <button className={navButtonClass} onClick={closeDetails} aria-label="Back to roster">
                    ✕
                </button>
            </div>

            {/* ── Portrait ────────────────────────────────────────────────── */}
            <div className="relative mx-auto mb-4" style={{ width: 192, height: 280 }}>
                <img
                    src={portraitUrl}
                    alt={char.name}
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

            {/* ── Selects: row on sm+, stacked on mobile ──────────────────── */}
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
                <div className="min-w-0 flex-1">
                    <RankSelect
                        label="Rank"
                        rankValues={rankValues}
                        value={rank}
                        valueChanges={value => setRank(value as Rank)}
                    />
                </div>
            </div>

            {/* ── Stat tiles: 2 cols on mobile, 4 on sm+ ──────────────────── */}
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                {[
                    { icon: tacticusIcons.health.file, value: health, label: 'Health' },
                    { icon: tacticusIcons.armour.file, value: armor, label: 'Armour' },
                    { icon: tacticusIcons.damage.file, value: damage, label: 'Damage' },
                    ...(entry ? [{ icon: tacticusIcons.movement.file, value: entry.movement, label: 'Movement' }] : []),
                ].map(({ icon, value, label }) => (
                    <div key={label} className="flex items-center gap-2 rounded-md border border-(--border) px-2 py-1">
                        <img src={icon} alt={label} className="h-7 w-7 shrink-0" />
                        <span className="text-sm font-semibold text-(--fg)">{value}</span>
                    </div>
                ))}
            </div>

            {/* ── Attack rows ─────────────────────────────────────────────── */}
            {entry && (
                <div className="mt-4 space-y-1 border-t border-(--border) pt-3">
                    <AttackRow attack={entry.meleeAttack} type="melee" />
                    {entry.rangedAttack && <AttackRow attack={entry.rangedAttack} type="ranged" />}
                </div>
            )}

            {/* ── Stat growth chart: full width, desktop only ──────────────── */}
            <div className="-mx-4 mt-4 hidden border-t border-(--border) pt-3 sm:block">
                <CharacterStatGrowthChart
                    baseDamage={entry?.initialStats.damage ?? char.damage}
                    baseHealth={entry?.initialStats.health ?? char.health}
                    baseArmor={entry?.initialStats.armor ?? char.armour}
                    currentRank={rank}
                    stars={stars}
                    maxRank={maxRank}
                    maxStars={maxStars}
                />
            </div>

            {/* ── Stats by rank table: mobile only ────────────────────────── */}
            <details className="mt-4 border-t border-(--border) pt-3 sm:hidden">
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
                                        {calculateStat(
                                            entry?.initialStats.health ?? char.health,
                                            r,
                                            stars
                                        ).toLocaleString()}
                                    </td>
                                    <td className="py-0.5 pr-3 text-right text-(--fg) tabular-nums">
                                        {calculateStat(
                                            entry?.initialStats.armor ?? char.armour,
                                            r,
                                            stars
                                        ).toLocaleString()}
                                    </td>
                                    <td className="py-0.5 text-right text-(--fg) tabular-nums">
                                        {calculateStat(
                                            entry?.initialStats.damage ?? char.damage,
                                            r,
                                            stars
                                        ).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>

            {/* ── Abilities ───────────────────────────────────────────────── */}
            {entry && (
                <div className="mt-6 flex flex-col gap-6 border-t border-(--border) pt-4">
                    {abilities.map(({ id, label, level, setLevel }) => {
                        const icon = abilityIcons[id];
                        const ability = abilityById.get(id);
                        return (
                            <div key={label} className="flex flex-col items-center gap-1">
                                <span className="text-xs text-(--soft-fg)">{label}</span>
                                {icon ? (
                                    <img src={icon.file} alt={icon.name} title={icon.name} className="h-12 w-12" />
                                ) : (
                                    <span className="text-xs text-(--soft-fg)">{id}</span>
                                )}
                                <span className="text-center text-xs text-(--fg)">{icon?.name ?? id}</span>
                                <select
                                    value={level}
                                    onChange={event_ => setLevel(Number(event_.target.value))}
                                    className="mt-1 w-full rounded border border-(--border) bg-(--overlay) px-1 py-0.5 text-xs text-(--fg)">
                                    {Array.from({ length: 60 }, (_, index) => index + 1).map(n => (
                                        <option key={n} value={n}>
                                            Level {n}
                                        </option>
                                    ))}
                                </select>
                                {ability && (
                                    <div className="-mx-4 mt-1" style={{ backgroundColor: '#06111e' }}>
                                        <div className="px-4 py-2">
                                            <AbilityText
                                                text={ability.text.currentLevelDescription}
                                                level={level}
                                                variables={ability.variables}
                                                constants={ability.constants ?? {}}
                                                scaledVariableNames={ability.variablesAffectedByRarityBonus ?? []}
                                                rarity={rarity}
                                                unitName={char.name}
                                                factionId={char.faction}
                                            />
                                            {ability.text.nextLevelDescription && (
                                                <>
                                                    <div className="my-1.5 border-t border-blue-800" />
                                                    <span className="text-xs font-semibold text-blue-400">
                                                        Next Level
                                                    </span>
                                                    <AbilityText
                                                        text={ability.text.nextLevelDescription}
                                                        level={level + 1}
                                                        variables={ability.variables}
                                                        constants={ability.constants ?? {}}
                                                        scaledVariableNames={
                                                            ability.variablesAffectedByRarityBonus ?? []
                                                        }
                                                        rarity={rarity}
                                                        unitName={char.name}
                                                        factionId={char.faction}
                                                    />
                                                </>
                                            )}
                                        </div>
                                        <AbilityVariablesChart
                                            variables={ability.variables}
                                            scaledVariableNames={ability.variablesAffectedByRarityBonus ?? []}
                                            rarity={rarity}
                                            currentLevel={level}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
