/* eslint-disable import-x/no-internal-modules */
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Rank, Rarity, RarityMapper, RarityStars } from '@/fsd/5-shared/model';
import { abilityIcons } from '@/fsd/5-shared/ui/ability-icons';
import { AttackProfileRow } from '@/fsd/5-shared/ui/attack-profile-row';
import { getImageUrl } from '@/fsd/5-shared/ui/get-image-url';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/icon-list';
import { traitIcons } from '@/fsd/5-shared/ui/trait-icons';
import { ISnapshotCharacter, UnitPortraitAssetsProvider } from '@/fsd/5-shared/ui/unit-portrait';

import abilityDataJson from '@/fsd/4-entities/abilities/data/new-ability-data.json';
import {
    applyAbilityAdjustments,
    applyAbilityConstantAdjustments,
    applyStatAdjustment,
    applyUnitRemovals,
    bossPortraitMap,
    computeAbilityVariableAdjustments,
    computeStatAdjustments,
    encounterStatsIndex,
    findEncounterLocation,
    getActiveModifierDefinitions,
    getFieldEnemies,
    getSeasonConfig,
    getSetPrimeEncounters,
    getStatsAtIndex,
    getTierRarity,
    getUnitDisplayName,
    getUnitRemovals,
    getUnitSet,
    getUnitSetId,
    isRangedWeapon,
    resolvePrimeDisplayName,
    resolvePrimePortraitPath,
    resolvePrimeRegularPortraitPath,
    scaleModifierHpLost,
} from '@/fsd/4-entities/guild_boss';
import type { GuildBossModifierDefinition, GuildBossWeapon } from '@/fsd/4-entities/guild_boss';
import traitsDataJson from '@/fsd/4-entities/traits/data/new-traits-data.json';
import { getTraitVariables } from '@/fsd/4-entities/traits/trait-variables';

import { AbilityText } from '@/fsd/3-features/character-details/ability-text-renderer';
import {
    BattlefieldEnemies,
    ModifiersSection,
    PrimeModifierPanel,
    ProgressionSelector,
} from '@/fsd/3-features/guild-boss-reference';
import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings';

import { RosterSnapshotsUnit } from '@/fsd/2-widgets/roster-snapshots-unit';

interface AbilityEntry {
    id: string;
    text: { name: string; currentLevelDescription: string; nextLevelDescription: string };
    variables: Record<string, (string | number)[]>;
    variablesAffectedByRarityBonus?: string[];
    constants?: Record<string, string>;
}

interface TraitEntry {
    id: string;
    name: string;
    styledName: string;
    description: string;
}

const abilityById = new Map((abilityDataJson as unknown as AbilityEntry[]).map(a => [a.id, a]));
const traitById = new Map((traitsDataJson as unknown as TraitEntry[]).map(t => [t.id, t]));

const never = RosterSnapshotShowVariableSettings.Never;

const WeaponRow = ({ weapon, hitsAdjustment = 0 }: { weapon: GuildBossWeapon; hitsAdjustment?: number }) => {
    const hits = Math.max(0, weapon.hits + hitsAdjustment);
    return (
        <AttackProfileRow
            hits={hits}
            damageType={weapon.DamageProfile}
            range={isRangedWeapon(weapon) ? weapon.Range : undefined}
        />
    );
};

interface BossAbilityPanelProps {
    abilityId: string;
    label: string;
    level: number;
    rarity: Rarity;
    unitName: string;
    factionId: string;
    activeModifierDefs: GuildBossModifierDefinition[];
}

const BossAbilityPanel = ({
    abilityId,
    label,
    level,
    rarity,
    unitName,
    factionId,
    activeModifierDefs,
}: BossAbilityPanelProps) => {
    const ability = abilityById.get(abilityId);
    const icon = abilityIcons[abilityId as keyof typeof abilityIcons];
    const adjustments = computeAbilityVariableAdjustments(activeModifierDefs, abilityId);
    const adjustedVariables = ability ? applyAbilityAdjustments(ability.variables, adjustments) : {};
    const adjustedConstants = ability ? applyAbilityConstantAdjustments(ability.constants ?? {}, adjustments) : {};

    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs text-(--soft-fg)">{label}</span>
            {ability ? (
                <div className="-mx-4 flex bg-(--ability-panel)">
                    <div className="flex w-32 shrink-0 flex-col items-center gap-1 px-4 pb-2">
                        {icon ? (
                            <img src={icon.file} alt={icon.name} className="h-12 w-12" />
                        ) : (
                            <span className="text-xs text-(--soft-fg)">{abilityId}</span>
                        )}
                        <span className="text-center text-xs text-(--fg)">{icon?.name ?? abilityId}</span>
                    </div>
                    <div className="min-w-0 px-4 py-2">
                        <AbilityText
                            text={ability.text.currentLevelDescription}
                            level={level}
                            variables={adjustedVariables}
                            constants={adjustedConstants}
                            scaledVariableNames={ability.variablesAffectedByRarityBonus ?? []}
                            rarity={rarity}
                            unitName={unitName}
                            factionId={factionId}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-1">
                    {icon ? (
                        <img src={icon.file} alt={icon.name} className="h-12 w-12" />
                    ) : (
                        <span className="text-xs text-(--soft-fg)">{abilityId}</span>
                    )}
                    <span className="text-center text-xs text-(--fg)">{icon?.name ?? abilityId}</span>
                </div>
            )}
        </div>
    );
};

export function GuildBossDetail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const rawUnitId = searchParams.get('unit') ?? '';
    const unitSetId = getUnitSetId(rawUnitId);
    const explicitSeasonId = searchParams.get('season');
    const location = explicitSeasonId
        ? {
              seasonId: explicitSeasonId,
              tier: Number(searchParams.get('tier') ?? '0'),
              set: Number(searchParams.get('set') ?? '0'),
              encounterIndex: Number(searchParams.get('encounter') ?? '0'),
          }
        : findEncounterLocation(unitSetId);
    const seasonId = location?.seasonId ?? '';
    const tier = location?.tier ?? 0;
    const set = location?.set ?? 0;
    const encounterIndex = location?.encounterIndex ?? 0;

    const unitSet = getUnitSet(rawUnitId);
    const config = getSeasonConfig(seasonId);
    const setEncounters = config?.tiers[tier]?.sets[set]?.encounters ?? [];
    const encounter = setEncounters[encounterIndex];
    const [leftPrimeEnc, rightPrimeEnc] = getSetPrimeEncounters(setEncounters);

    const defaultStatIndex = encounterStatsIndex(rawUnitId);
    const [statIndex, setStatIndex] = useState(defaultStatIndex);
    const [leftHpLost, setLeftHpLost] = useState(0);
    const [rightHpLost, setRightHpLost] = useState(0);

    if (!unitSet) {
        return (
            <div className="p-6">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mb-4 text-sm text-(--primary) hover:underline">
                    ← Back
                </button>
                <p className="text-(--fg-muted)">Boss not found.</p>
            </div>
        );
    }

    const isBoss = !/(?:MiniBoss|Minion)\d/.test(unitSetId);
    const portraitPath = isBoss
        ? (bossPortraitMap[unitSetId] ?? resolvePrimePortraitPath(unitSetId))
        : (resolvePrimeRegularPortraitPath(unitSetId, unitSet.questUnitId) ?? resolvePrimePortraitPath(unitSetId));
    const portraitUrl = portraitPath ? getImageUrl(portraitPath) : undefined;
    const displayName = getUnitDisplayName(unitSetId);
    const stats = getStatsAtIndex(unitSet, statIndex);
    const rarity = RarityMapper.stringToRarity(stats.BaseRarity) ?? getTierRarity(tier);

    const leftPrimeUnitSet = leftPrimeEnc ? getUnitSet(leftPrimeEnc.unitId) : undefined;
    const rightPrimeUnitSet = rightPrimeEnc ? getUnitSet(rightPrimeEnc.unitId) : undefined;
    const leftPrimeTotalHp = leftPrimeUnitSet ? getStatsAtIndex(leftPrimeUnitSet, statIndex).Health : 0;
    const rightPrimeTotalHp = rightPrimeUnitSet ? getStatsAtIndex(rightPrimeUnitSet, statIndex).Health : 0;
    const leftScaledModifiers = scaleModifierHpLost(leftPrimeEnc?.modifiers ?? [], leftPrimeTotalHp);
    const rightScaledModifiers = scaleModifierHpLost(rightPrimeEnc?.modifiers ?? [], rightPrimeTotalHp);

    const leftActiveDefs = getActiveModifierDefinitions(leftScaledModifiers, leftHpLost);
    const rightActiveDefs = getActiveModifierDefinitions(rightScaledModifiers, rightHpLost);
    const activeModifierDefs = isBoss ? [...leftActiveDefs, ...rightActiveDefs] : [];
    const statAdjustments = computeStatAdjustments(activeModifierDefs);

    // A prime's unitAmountDecrease modifiers remove reinforcements from the boss's own board, not from
    // that prime's own board — each board's own enemies are otherwise shown exactly as authored.
    const ownFieldEnemies = encounter
        ? applyUnitRemovals(getFieldEnemies(encounter), getUnitRemovals(activeModifierDefs))
        : [];

    const fakeChar: ISnapshotCharacter = {
        id: 'boss',
        rank: (stats.Rank + 1) as Rank,
        rarity,
        stars: stats.StarLevel as RarityStars,
        shards: 0,
        mythicShards: 0,
        activeAbilityLevel: stats.AbilityLevel,
        passiveAbilityLevel: stats.AbilityLevel,
        xpLevel: 0,
    };

    const HIDDEN_ABILITY_IDS = new Set(['GuildBossRunAway']);

    const allAbilities = [
        ...(unitSet.activeAbilities ?? []).map(id => ({ id, label: 'Active Ability' })),
        ...(unitSet.passiveAbilities ?? []).map(id => ({ id, label: 'Passive Ability' })),
        ...(unitSet.relicAbilities ?? []).map(id => ({ id, label: 'Relic Ability' })),
    ].filter(({ id }) => !HIDDEN_ABILITY_IDS.has(id));

    return (
        <div className="flex flex-col gap-6 p-6">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="self-start text-sm text-(--primary) hover:underline">
                ← Back
            </button>

            {/* Three-column layout */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr_1fr]">
                {/* Col 1: portrait */}
                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-xl font-bold text-(--fg)">{displayName}</h1>
                    <UnitPortraitAssetsProvider>
                        <div style={{ width: 220, height: 400, overflow: 'hidden' }}>
                            <div style={{ transform: 'scale(2)', transformOrigin: 'top left' }}>
                                <RosterSnapshotsUnit
                                    char={fakeChar}
                                    customPortraitUrl={portraitUrl}
                                    showShards={never}
                                    showMythicShards={never}
                                    showXpLevel={never}
                                    showAbilities={never}
                                    showEquipment={never}
                                    showTooltip={false}
                                    isEnabled={true}
                                />
                            </div>
                        </div>
                    </UnitPortraitAssetsProvider>
                </div>

                {/* Col 2: progression selector + stat tiles + weapons */}
                <div className="flex flex-col gap-4">
                    <ProgressionSelector unitSet={unitSet} value={statIndex} onChange={setStatIndex} />
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { icon: tacticusIcons.health.file, value: stats.Health, label: 'Health', statKey: 'hp' },
                            {
                                icon: tacticusIcons.armour.file,
                                value: stats.FixedArmor,
                                label: 'Armour',
                                statKey: 'fixedArmor',
                            },
                            {
                                icon: tacticusIcons.damage.file,
                                value: stats.Damage,
                                label: 'Damage',
                                statKey: 'dmg',
                            },
                            {
                                icon: tacticusIcons.movement.file,
                                value: unitSet.Movement,
                                label: 'Movement',
                                statKey: 'movement',
                            },
                        ].map(({ icon, value, label, statKey }) => (
                            <div
                                key={label}
                                className="flex items-center gap-2 rounded-md border border-(--border) px-2 py-1">
                                <img src={icon} alt={label} className="h-7 w-7 shrink-0" />
                                <span className="text-sm font-semibold text-(--fg)">
                                    {applyStatAdjustment(value, statKey, statAdjustments)}
                                </span>
                            </div>
                        ))}
                        {stats.BlockChance !== undefined && (
                            <div className="flex items-center gap-2 rounded-md border border-(--border) px-2 py-1">
                                <span className="text-xs text-(--fg-muted)">Block</span>
                                <span className="text-sm font-semibold text-(--fg)">
                                    {applyStatAdjustment(stats.BlockChance, 'blockChance', statAdjustments)}%
                                </span>
                            </div>
                        )}
                        {stats.CritChance !== undefined && (
                            <div className="flex items-center gap-2 rounded-md border border-(--border) px-2 py-1">
                                <img src={tacticusIcons.critDamage.file} alt="Crit" className="h-7 w-7 shrink-0" />
                                <img src={tacticusIcons.chance.file} alt="Chance" className="h-7 w-7 shrink-0" />
                                <span className="text-sm font-semibold text-(--fg)">
                                    {applyStatAdjustment(stats.CritChance, 'critChance', statAdjustments)}%
                                </span>
                            </div>
                        )}
                        {stats.CritDamage !== undefined && (
                            <div className="flex items-center gap-2 rounded-md border border-(--border) px-2 py-1">
                                <img
                                    src={tacticusIcons.critDamage.file}
                                    alt="Crit Damage"
                                    className="h-7 w-7 shrink-0"
                                />
                                <span className="text-sm font-semibold text-(--fg)">
                                    {applyStatAdjustment(stats.CritDamage, 'critDmg', statAdjustments)}
                                </span>
                            </div>
                        )}
                    </div>
                    {unitSet.weapons && unitSet.weapons.length > 0 && (
                        <div className="space-y-2 border-t border-(--border) pt-2">
                            {unitSet.weapons.map((weapon, index) => (
                                <WeaponRow
                                    key={index}
                                    weapon={weapon}
                                    hitsAdjustment={statAdjustments.flatByStat.hits ?? 0}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Col 3: traits */}
                <div className="flex flex-col gap-2">
                    {(unitSet.traits ?? []).map(traitId => {
                        const trait = traitById.get(traitId);
                        if (!trait) return;
                        const traitVariables = getTraitVariables(traitId);
                        return (
                            <div key={traitId} className="rounded-md bg-(--neutral) p-3">
                                <div className="mb-1 flex items-center gap-2">
                                    {traitIcons[traitId as keyof typeof traitIcons] && (
                                        <img
                                            src={traitIcons[traitId as keyof typeof traitIcons]}
                                            alt={trait.name}
                                            className="h-7 w-7 shrink-0"
                                        />
                                    )}
                                    <div className="text-sm font-semibold">
                                        <AbilityText
                                            text={trait.styledName}
                                            level={1}
                                            variables={{}}
                                            constants={{}}
                                            scaledVariableNames={[]}
                                            rarity={rarity}
                                            unitName={displayName}
                                            factionId={unitSet.FactionId}
                                        />
                                    </div>
                                </div>
                                <div className="text-xs text-(--fg)">
                                    <AbilityText
                                        text={trait.description}
                                        level={1}
                                        variables={traitVariables}
                                        constants={{}}
                                        scaledVariableNames={[]}
                                        rarity={rarity}
                                        unitName={displayName}
                                        factionId={unitSet.FactionId}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Field enemies */}
            <BattlefieldEnemies enemyIds={ownFieldEnemies} title="Boss Field Enemies" />

            {/* Modifiers */}
            {isBoss ? (
                <div className="flex flex-col gap-6 border-t border-(--border) pt-4">
                    <h2 className="text-base font-semibold text-(--fg)">Prime Modifiers</h2>
                    {(
                        [
                            {
                                primeEncounter: leftPrimeEnc,
                                primeUnitSet: leftPrimeUnitSet,
                                totalHp: leftPrimeTotalHp,
                                scaledModifiers: leftScaledModifiers,
                                selectedHpLost: leftHpLost,
                                onChange: setLeftHpLost,
                            },
                            {
                                primeEncounter: rightPrimeEnc,
                                primeUnitSet: rightPrimeUnitSet,
                                totalHp: rightPrimeTotalHp,
                                scaledModifiers: rightScaledModifiers,
                                selectedHpLost: rightHpLost,
                                onChange: setRightHpLost,
                            },
                        ] as const
                    ).map(({ primeEncounter, primeUnitSet, totalHp, scaledModifiers, selectedHpLost, onChange }) => {
                        if (!primeEncounter || !primeUnitSet) return;
                        const primeUnitSetId = getUnitSetId(primeEncounter.unitId);
                        const primePortraitPath = resolvePrimePortraitPath(primeUnitSetId);
                        const primePortraitUrl = primePortraitPath ? getImageUrl(primePortraitPath) : undefined;
                        const primeDisplayName =
                            resolvePrimeDisplayName(primeUnitSetId) ?? getUnitDisplayName(primeUnitSetId);
                        return (
                            <PrimeModifierPanel
                                key={primeEncounter.encounterIndex}
                                portraitUrl={primePortraitUrl}
                                displayName={primeDisplayName}
                                encounterModifiers={scaledModifiers}
                                totalHp={totalHp}
                                rarity={rarity}
                                selectedHpLost={selectedHpLost}
                                onChange={onChange}
                            />
                        );
                    })}
                </div>
            ) : (
                <ModifiersSection
                    modifiers={scaleModifierHpLost(encounter?.modifiers ?? [], stats.Health)}
                    totalHp={stats.Health}
                    rarity={rarity}
                />
            )}

            {/* Abilities */}
            {allAbilities.length > 0 && (
                <div className="flex flex-col gap-4 border-t border-(--border) pt-4">
                    {allAbilities.map(({ id, label }) => (
                        <BossAbilityPanel
                            key={id}
                            abilityId={id}
                            label={label}
                            level={stats.AbilityLevel}
                            rarity={rarity}
                            unitName={displayName}
                            factionId={unitSet.FactionId}
                            activeModifierDefs={activeModifierDefs}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
