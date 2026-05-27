/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import {
    AllCommunityModule,
    type ColDef,
    type GridApi,
    type ICellRendererParams,
    type RowDragEndEvent,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { cloneDeep } from 'lodash';
import {
    AlertTriangle,
    ArrowDown,
    ArrowRight,
    ArrowUp,
    Calendar,
    CheckCircle2,
    ChevronDown,
    Edit,
    ExternalLink,
    GripVertical,
    HelpCircle,
    Link2,
    Mail,
    Megaphone,
    Menu,
    RefreshCw,
    Search,
    Settings,
    Trash2,
    X,
} from 'lucide-react';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { StoreContext } from 'src/reducers/store.provider';
import { RaidUpgradeMaterialCard } from 'src/routes/tables/raid-upgrade-material-card';

import { FactionId, Rank, Rarity, RarityMapper, RarityStars } from '@/fsd/5-shared/model';
import { AccessibleTooltip, LazyTooltip, Button, ButtonPill } from '@/fsd/5-shared/ui';
import { Badge } from '@/fsd/5-shared/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/fsd/5-shared/ui/card';
import { MiscIcon, RarityIcon, RankIcon, StarsIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';
import { TextField } from '@/fsd/5-shared/ui/input/text-field';
import { Loader } from '@/fsd/5-shared/ui/loader';
import { Dialog } from '@/fsd/5-shared/ui/modal/dialog';
import { Modal } from '@/fsd/5-shared/ui/modal/modal';
import {
    ComboBox,
    FactionSelect,
    RankSelect,
    RaritySelect,
    Select,
    SelectMulti as SelectMultiPrimitive,
    StarsSelect,
} from '@/fsd/5-shared/ui/selects';
import { Separator } from '@/fsd/5-shared/ui/separator';
import { Slider } from '@/fsd/5-shared/ui/slider';
import { Switch } from '@/fsd/5-shared/ui/switch';

import { CampaignsService, ChipCampaignLocation, ICampaignBattleComposed } from '@/fsd/4-entities/campaign';
import { CharactersService, charsUnlockShards } from '@/fsd/4-entities/character';
import { PersonalGoalType } from '@/fsd/4-entities/goal';
import { LegendaryEventService } from '@/fsd/4-entities/lre';
import { IMow2, MowsService } from '@/fsd/4-entities/mow';
import { UpgradeImage, UpgradesService as UpgradeEntityService } from '@/fsd/4-entities/upgrade';

import { CharacterAbilitiesTotal } from '@/fsd/3-features/characters';
import { OrbsTotal } from '@/fsd/3-features/characters/components/orbs-total';
import { MowMaterialsTotal } from '@/fsd/3-features/goals';
import { type IGoalEstimate, type TypedGoalSelect } from '@/fsd/3-features/goals/goals.models';
import { GoalsService } from '@/fsd/3-features/goals/goals.service';
import { ShardsService } from '@/fsd/3-features/goals/shards.service';
import { UpgradesService } from '@/fsd/3-features/goals/upgrades.service';

import { GoalCard } from '@/fsd/1-pages/goals/goal-card';
import { DailyRaidsSection } from '@/fsd/1-pages/home/daily-raids-section';
import { GoalsSection } from '@/fsd/1-pages/home/goals-section';
import { LreSection } from '@/fsd/1-pages/home/lre-section';

// ─── nav ─────────────────────────────────────────────────────────────────────

const NAV_PRIMITIVES = [
    { id: 'colours', label: 'Colours' },
    { id: 'button', label: 'Button' },
    { id: 'button-pill', label: 'ButtonPill' },
    { id: 'text-field', label: 'TextField' },
    { id: 'switch', label: 'Switch' },
    { id: 'badge', label: 'Badge' },
    { id: 'card', label: 'Card' },
    { id: 'loader', label: 'Loader' },
    { id: 'modal', label: 'Modal' },
    { id: 'separator', label: 'Separator' },
    { id: 'tooltip', label: 'Tooltip' },
    { id: 'domain-selects', label: 'Domain selects' },
    { id: 'progress', label: 'Progress' },
    { id: 'accordion', label: 'Accordion' },
    { id: 'radio', label: 'Radio group' },
    { id: 'campaign-chips', label: 'Campaign chips' },
    { id: 'table', label: 'Table' },
    { id: 'filters', label: 'Filters' },
] as const;

const NAV_LIVE = [
    { id: 'home-cards', label: 'Home cards' },
    { id: 'goals', label: 'Goals' },
    { id: 'daily-raids', label: 'Daily Raids' },
] as const;

const navLink =
    'rounded px-2 py-0.5 text-(--soft-fg) transition-colors hover:bg-(--neutral) hover:text-(--fg) whitespace-nowrap';
const navChapter = 'text-xs font-bold tracking-widest uppercase text-(--soft-fg) select-none';

const UiKitNav = () => (
    <nav className="sticky top-0 z-10 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-(--border) bg-(--bg)/95 px-3 py-2 text-xs backdrop-blur-sm">
        <span className={navChapter}>Primitives</span>
        {NAV_PRIMITIVES.map(s => (
            <a key={s.id} href={`#${s.id}`} className={navLink}>
                {s.label}
            </a>
        ))}
        <Separator orientation="vertical" className="mx-1 h-4" />
        <span className={navChapter}>Live</span>
        {NAV_LIVE.map(s => (
            <a key={s.id} href={`#${s.id}`} className={navLink}>
                {s.label}
            </a>
        ))}
    </nav>
);

// ─── layout helpers ──────────────────────────────────────────────────────────

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <section id={id} className="scroll-mt-16 space-y-6">
        <p className="text-xs font-bold tracking-widest text-(--soft-fg) uppercase">{title}</p>
        {children}
    </section>
);

const ChapterDivider = ({ label }: { label: string }) => (
    <div className="flex items-center gap-4 py-2">
        <div className="h-px flex-1 bg-(--border)" />
        <span className="text-xs font-bold tracking-widest text-(--soft-fg) uppercase">{label}</span>
        <div className="h-px flex-1 bg-(--border)" />
    </div>
);

const Group = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-3">
        <p className="text-xs font-semibold text-(--soft-fg)">{label}</p>
        {children}
    </div>
);

const Row = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`flex flex-wrap items-center gap-3 ${className ?? ''}`}>{children}</div>
);

// ─── live: home page cards ───────────────────────────────────────────────────

const HomeLreCard = () => {
    const { leProgress, characters } = useContext(StoreContext);
    const nextEvent = useMemo(() => LegendaryEventService.getActiveEvent(), []);
    if (!nextEvent) return <p className="text-sm text-(--soft-fg)">No active legendary event.</p>;
    return <LreSection nextEvent={nextEvent} leProgress={leProgress} characters={characters} />;
};

// ─── live: goals ─────────────────────────────────────────────────────────────

const GoalCardShowcase = () => {
    const {
        goals,
        characters,
        mows,
        campaignsProgress,
        inventory,
        dailyRaids,
        dailyRaidsPreferences,
        gameModeTokens,
        xpIncome,
        xpUse,
    } = useContext(StoreContext);

    const resolvedChars = useMemo(() => CharactersService.resolveStoredCharacters(characters), [characters]);
    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(mows), [mows]);
    const units = useMemo(() => [...resolvedChars, ...resolvedMows], [resolvedChars, resolvedMows]);

    const { shardsGoals, upgradeRankOrMowGoals, upgradeMaterialGoals, upgradeAbilities, ascendGoals } = useMemo(
        () => GoalsService.prepareGoals(goals, units, false),
        [goals, units]
    );

    const onslaughtTokensToday = useMemo(
        () => UpgradesService.computeOnslaughtTokensToday(gameModeTokens),
        [gameModeTokens]
    );

    const estimatedUpgradesTotal = useMemo(
        () =>
            UpgradesService.getUpgradesEstimatedDays(
                {
                    dailyEnergy: dailyRaidsPreferences.dailyEnergy,
                    campaignsProgress,
                    preferences: dailyRaidsPreferences,
                    upgrades: inventory.upgrades,
                    completedLocations: dailyRaids.raidedLocations,
                    onslaughtTokensToday,
                },
                resolvedChars,
                resolvedMows,
                ...[upgradeMaterialGoals, upgradeRankOrMowGoals, shardsGoals].flat().filter(x => x.include)
            ),
        [
            dailyRaidsPreferences,
            campaignsProgress,
            inventory.upgrades,
            dailyRaids.raidedLocations,
            onslaughtTokensToday,
            resolvedChars,
            resolvedMows,
            upgradeMaterialGoals,
            upgradeRankOrMowGoals,
            shardsGoals,
        ]
    );

    const rawGoalsEstimates = useMemo(
        () =>
            GoalsService.buildGoalEstimates(
                estimatedUpgradesTotal,
                shardsGoals,
                upgradeMaterialGoals,
                upgradeRankOrMowGoals,
                upgradeAbilities,
                resolvedChars
            ),
        [
            estimatedUpgradesTotal,
            shardsGoals,
            upgradeMaterialGoals,
            upgradeRankOrMowGoals,
            upgradeAbilities,
            resolvedChars,
        ]
    );

    const goalsEstimates = GoalsService.adjustGoalEstimates(
        cloneDeep(goals),
        cloneDeep(rawGoalsEstimates),
        inventory,
        xpUse,
        upgradeRankOrMowGoals,
        ascendGoals,
        xpIncome
    ).goalEstimates;

    const samples = useMemo(
        () => [shardsGoals[0], upgradeRankOrMowGoals[0], upgradeMaterialGoals[0], upgradeAbilities[0]].filter(Boolean),
        [shardsGoals, upgradeRankOrMowGoals, upgradeMaterialGoals, upgradeAbilities]
    );

    if (samples.length === 0) {
        return (
            <p className="text-sm text-(--soft-fg)">
                No goals set — add goals of different types on the Goals page to see variations here.
            </p>
        );
    }

    return (
        <div className="flex flex-wrap gap-4">
            {samples.map(goal => (
                <GoalCard
                    key={goal.goalId}
                    goal={goal}
                    goalEstimate={goalsEstimates.find(estimate => estimate.goalId === goal.goalId)}
                    bgColor="rgba(0, 0, 0, 0)"
                    characters={characters}
                    mows={resolvedMows as IMow2[]}
                    bookRarity={Rarity.Legendary}
                    onToggleInclude={() => {}}
                    menuItemSelect={() => {}}
                />
            ))}
        </div>
    );
};

// ─── live: daily raids ────────────────────────────────────────────────────────

const RaidCardsShowcase = () => {
    const { goals, characters, mows, campaignsProgress, inventory, dailyRaids, dailyRaidsPreferences, gameModeTokens } =
        useContext(StoreContext);

    const resolvedChars = useMemo(() => CharactersService.resolveStoredCharacters(characters), [characters]);
    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(mows), [mows]);
    const units = useMemo(() => [...resolvedChars, ...resolvedMows], [resolvedChars, resolvedMows]);

    const { shardsGoals, upgradeRankOrMowGoals, upgradeMaterialGoals } = useMemo(
        () => GoalsService.prepareGoals(goals, units, true),
        [goals, units]
    );

    const onslaughtTokensToday = useMemo(
        () => UpgradesService.computeOnslaughtTokensToday(gameModeTokens),
        [gameModeTokens]
    );

    const estimatedRanks = useMemo(
        () =>
            UpgradesService.getUpgradesEstimatedDays(
                {
                    dailyEnergy: dailyRaidsPreferences.dailyEnergy,
                    campaignsProgress,
                    preferences: dailyRaidsPreferences,
                    upgrades: inventory.upgrades,
                    completedLocations: dailyRaids.raidedLocations,
                    onslaughtTokensToday,
                },
                resolvedChars,
                resolvedMows,
                ...upgradeMaterialGoals,
                ...upgradeRankOrMowGoals,
                ...shardsGoals
            ),
        [
            dailyRaidsPreferences,
            campaignsProgress,
            inventory.upgrades,
            dailyRaids.raidedLocations,
            onslaughtTokensToday,
            resolvedChars,
            resolvedMows,
            upgradeMaterialGoals,
            upgradeRankOrMowGoals,
            shardsGoals,
        ]
    );

    const inProgress = estimatedRanks.inProgressMaterials;
    const daily = estimatedRanks.upgradesRaids[0]?.raids ?? [];
    const blocked = estimatedRanks.blockedMaterials;

    if (inProgress.length === 0 && daily.length === 0 && blocked.length === 0) {
        return (
            <p className="text-sm text-(--soft-fg)">
                No active raid goals — enable goals on the Daily Raids page to see cards here.
            </p>
        );
    }

    return (
        <div className="space-y-6">
            {inProgress.length > 0 && (
                <Group label={`In progress (${inProgress.length})`}>
                    <div className="flex flex-wrap gap-3">
                        {inProgress.slice(0, 6).map(raid => (
                            <RaidUpgradeMaterialCard
                                key={raid.id}
                                upgradeEstimate={raid}
                                showRelatedCharacters={true}
                                showAdditionalInfo={true}
                                showPlannedRaidLocationsOnly={false}
                            />
                        ))}
                    </div>
                </Group>
            )}
            {daily.length > 0 && (
                <Group label={`Daily (${daily.length})`}>
                    <div className="flex flex-wrap gap-3">
                        {daily.slice(0, 6).map(raid => (
                            <RaidUpgradeMaterialCard
                                key={raid.id}
                                upgradeEstimate={raid}
                                showRelatedCharacters={false}
                                showAdditionalInfo={false}
                                showPlannedRaidLocationsOnly={true}
                            />
                        ))}
                    </div>
                </Group>
            )}
            {blocked.length > 0 && (
                <Group label={`Blocked (${blocked.length})`}>
                    <div className="flex flex-wrap gap-3">
                        {blocked.slice(0, 6).map(raid => (
                            <RaidUpgradeMaterialCard
                                key={raid.id}
                                upgradeEstimate={raid}
                                showRelatedCharacters={true}
                                showAdditionalInfo={false}
                                showPlannedRaidLocationsOnly={false}
                            />
                        ))}
                    </div>
                </Group>
            )}
        </div>
    );
};

// ─── domain selects showcase ─────────────────────────────────────────────────

const RARITY_VALUES = [Rarity.Common, Rarity.Uncommon, Rarity.Rare, Rarity.Epic, Rarity.Legendary, Rarity.Mythic];
const RANK_VALUES = [
    Rank.Stone1,
    Rank.Stone2,
    Rank.Stone3,
    Rank.Iron1,
    Rank.Iron2,
    Rank.Iron3,
    Rank.Bronze1,
    Rank.Bronze2,
    Rank.Bronze3,
    Rank.Silver1,
    Rank.Silver2,
    Rank.Silver3,
    Rank.Gold1,
    Rank.Gold2,
    Rank.Gold3,
    Rank.Diamond1,
    Rank.Diamond2,
    Rank.Diamond3,
    Rank.Adamantine1,
    Rank.Adamantine2,
    Rank.Adamantine3,
];
const STARS_VALUES = [
    RarityStars.None,
    RarityStars.OneStar,
    RarityStars.TwoStars,
    RarityStars.ThreeStars,
    RarityStars.FourStars,
    RarityStars.FiveStars,
    RarityStars.RedOneStar,
    RarityStars.RedTwoStars,
    RarityStars.RedThreeStars,
    RarityStars.RedFourStars,
    RarityStars.RedFiveStars,
];

const DomainSelectsShowcase = () => {
    const [rarity, setRarity] = useState<number>(Rarity.Epic);
    const [rank, setRank] = useState<number>(Rank.Gold1);
    const [stars, setStars] = useState<number>(RarityStars.FiveStars);
    const [factions, setFactions] = useState<FactionId[]>([]);

    const allFactions = useMemo<FactionId[]>(() => {
        const set = new Set<string>();
        for (const char of Object.values(CharactersService.charactersBySnowprintId)) {
            if (char?.faction) set.add(char.faction);
        }
        return [...set].toSorted() as FactionId[];
    }, []);

    return (
        <div className="flex flex-wrap gap-4">
            <div className="w-44">
                <RaritySelect label="Rarity" rarityValues={RARITY_VALUES} value={rarity} valueChanges={setRarity} />
            </div>
            <div className="w-64">
                <RankSelect label="Rank" rankValues={RANK_VALUES} value={rank} valueChanges={setRank} />
            </div>
            <div className="w-56">
                <StarsSelect label="Stars" starsValues={STARS_VALUES} value={stars} valueChanges={setStars} />
            </div>
            <div className="w-56">
                <FactionSelect
                    label="Faction"
                    factionValues={allFactions}
                    value={factions}
                    valueChanges={setFactions}
                />
            </div>
        </div>
    );
};

// ─── progress bar ────────────────────────────────────────────────────────────

const ProgressBar = ({
    value,
    max,
    label,
    intent = 'primary',
}: {
    value: number;
    max: number;
    label?: string;
    intent?: 'primary' | 'success' | 'warning' | 'danger';
}) => {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    const fill = {
        primary: 'bg-(--primary)',
        success: 'bg-(--success)',
        warning: 'bg-(--warning)',
        danger: 'bg-(--danger)',
    }[intent];
    return (
        <div className="w-full space-y-1">
            {label && (
                <div className="flex justify-between text-xs text-(--soft-fg)">
                    <span>{label}</span>
                    <span>{pct}%</span>
                </div>
            )}
            <div className="h-2 overflow-hidden rounded-full bg-(--neutral)">
                <div className={`h-full transition-all duration-500 ${fill}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

// ─── accordion ────────────────────────────────────────────────────────────────

const AccordionItem = ({
    title,
    children,
    defaultOpen = false,
    flush = false,
}: {
    title: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    /** Remove body padding — use when the child fills the full width (e.g. a data grid). */
    flush?: boolean;
}) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-t border-(--border) first:border-t-0">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-sm font-medium text-(--fg) transition-colors hover:bg-(--primary)/10">
                {title}
                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-(--soft-fg) transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {open && <div className={flush ? 'overflow-hidden' : 'px-4 pb-4 text-sm text-(--soft-fg)'}>{children}</div>}
        </div>
    );
};

// ─── radio group ─────────────────────────────────────────────────────────────

const RadioOption = ({
    name,
    value,
    checked,
    onChange,
    label,
}: {
    name: string;
    value: string;
    checked: boolean;
    onChange: () => void;
    label: string;
}) => (
    <label className="flex cursor-pointer items-center gap-2">
        <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
        <div
            className={[
                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                checked ? 'border-(--primary)' : 'border-(--input)',
            ].join(' ')}>
            {checked && <div className="h-2 w-2 rounded-full bg-(--primary)" />}
        </div>
        <span className="text-sm text-(--fg)">{label}</span>
    </label>
);

const RadioGroupShowcase = () => {
    const [section, setSection] = useState('alpha');
    const [sort, setSort] = useState('name');
    return (
        <div className="flex flex-wrap gap-12">
            <fieldset className="border-0 p-0">
                <legend className="mb-3 text-sm font-medium text-(--soft-fg)">LRE Section (inline)</legend>
                <div className="flex gap-4">
                    {[
                        { value: 'alpha', label: 'Alpha' },
                        { value: 'beta', label: 'Beta' },
                        { value: 'gamma', label: 'Gamma' },
                    ].map(opt => (
                        <RadioOption
                            key={opt.value}
                            name="lre-section"
                            value={opt.value}
                            checked={section === opt.value}
                            onChange={() => setSection(opt.value)}
                            label={opt.label}
                        />
                    ))}
                </div>
            </fieldset>
            <fieldset className="border-0 p-0">
                <legend className="mb-3 text-sm font-medium text-(--soft-fg)">Sort order (stacked)</legend>
                <div className="space-y-2">
                    {[
                        { value: 'name', label: 'Name' },
                        { value: 'rarity', label: 'Rarity' },
                        { value: 'rank', label: 'Rank' },
                    ].map(opt => (
                        <RadioOption
                            key={opt.value}
                            name="sort-order"
                            value={opt.value}
                            checked={sort === opt.value}
                            onChange={() => setSort(opt.value)}
                            label={opt.label}
                        />
                    ))}
                </div>
            </fieldset>
        </div>
    );
};

// ─── MUI multi-select demo ────────────────────────────────────────────────────

const COMBOBOX_UNITS = ['Bellator', 'Abraxas', 'Marneus Calgar', 'Ragnar', 'Sho\u2019syl', 'Thaddeus Noble', 'Certus'];

const ComboBoxDemo = () => {
    // eslint-disable-next-line unicorn/no-null -- Headless UI Combobox requires null for empty state
    const [selected, setSelected] = useState<string | null>(null);
    return (
        <div className="w-64">
            <ComboBox<string>
                options={COMBOBOX_UNITS}
                value={selected}
                onChange={setSelected}
                displayValue={v => v}
                label="ComboBox (single)"
                placeholder="Search units…"
            />
        </div>
    );
};

// ─── filter primitives ───────────────────────────────────────────────────────

const RARITY_ORDER = [Rarity.Mythic, Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon, Rarity.Common];

const SORT_OPTIONS = [
    { value: 'name', label: 'Name' },
    { value: 'rarity', label: 'Rarity' },
    { value: 'rank', label: 'Rank' },
    { value: 'power', label: 'Power' },
];
const CAMPAIGN_OPTIONS = [
    { value: 'ind', label: 'Indomitus' },
    { value: 'foc', label: 'Fall of Cadia' },
    { value: 'oct', label: 'Octarius' },
];
const TRAIT_OPTIONS = [
    { value: 'psyker', label: 'Psyker' },
    { value: 'flying', label: 'Flying' },
    { value: 'big-target', label: 'Big Target' },
    { value: 'ranged-specialist', label: 'Ranged Specialist' },
    { value: 'mechanical', label: 'Mechanical' },
    { value: 'crushing-strike', label: 'Crushing Strike' },
    { value: 'final-vengeance', label: 'Final Vengeance' },
    { value: 'parry', label: 'Parry' },
    { value: 'resilient', label: 'Resilient' },
];
const SORT_MODES = [
    { value: 'savings', label: 'Savings' },
    { value: 'payoff', label: 'Early Payoff' },
    { value: 'priority', label: 'Priority' },
];
const VIEW_MODES = [
    { value: 'table', label: 'Table' },
    { value: 'grid', label: 'Grid' },
];

interface SelectOption {
    value: string;
    label: string;
}

// ── Segmented control ─────────────────────────────────────────────────────────

const SegmentedControl = ({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (v: string) => void;
    options: SelectOption[];
}) => (
    <div className="inline-flex rounded-lg border border-(--border) bg-(--neutral) p-0.5">
        {options.map(opt => (
            <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={[
                    'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    opt.value === value ? 'bg-(--bg) text-(--fg) shadow-sm' : 'text-(--soft-fg) hover:text-(--fg)',
                ].join(' ')}>
                {opt.label}
            </button>
        ))}
    </div>
);

// ── individual showcases ──────────────────────────────────────────────────────

const TextSearchShowcase = () => {
    const [search, setSearch] = useState('');
    return (
        <TextField
            value={search}
            onChange={setSearch}
            placeholder="Search characters…"
            prefix={<Search className="size-4 text-(--soft-fg)" />}
            suffix={
                search ? (
                    <button
                        aria-label="Clear"
                        onMouseDown={event_ => {
                            event_.preventDefault();
                            setSearch('');
                        }}
                        className="cursor-pointer text-(--soft-fg) transition-colors hover:text-(--fg)">
                        <X className="size-4" />
                    </button>
                ) : undefined
            }
        />
    );
};

const SelectShowcase = () => {
    const [sort, setSort] = useState(SORT_OPTIONS[0].value);
    const [campaign, setCampaign] = useState(CAMPAIGN_OPTIONS[0].value);
    return (
        <div className="flex flex-wrap gap-4">
            <div className="w-44">
                <Select
                    value={sort}
                    onChange={setSort}
                    label="Sort by"
                    options={SORT_OPTIONS.map(o => o.value)}
                    renderOption={v => SORT_OPTIONS.find(o => o.value === v)?.label ?? v}
                />
            </div>
            <div className="w-48">
                <Select
                    value={campaign}
                    onChange={setCampaign}
                    label="Campaign"
                    options={CAMPAIGN_OPTIONS.map(o => o.value)}
                    renderOption={v => CAMPAIGN_OPTIONS.find(o => o.value === v)?.label ?? v}
                />
            </div>
        </div>
    );
};

const MultiSelectShowcase = () => {
    const [traits, setTraits] = useState<string[]>([]);
    return (
        <div className="w-52">
            <SelectMultiPrimitive
                value={traits}
                onChange={setTraits}
                label="Traits"
                options={TRAIT_OPTIONS.map(o => o.value)}
                renderOption={v => TRAIT_OPTIONS.find(o => o.value === v)?.label ?? v}
                placeholder="All traits"
            />
        </div>
    );
};

const ChipsShowcase = () => {
    const [selected, setSelected] = useState<Rarity[]>([]);
    const toggle = (r: Rarity) =>
        setSelected(previous => (previous.includes(r) ? previous.filter(x => x !== r) : [...previous, r]));
    return (
        <div className="flex flex-wrap gap-1.5">
            {RARITY_ORDER.map(rarity => {
                const active = selected.includes(rarity);
                return (
                    <button
                        key={rarity}
                        onClick={() => toggle(rarity)}
                        className={[
                            'flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                            active
                                ? 'border-(--primary)/50 bg-(--primary)/15 text-(--fg)'
                                : 'border-(--border) bg-transparent text-(--soft-fg) hover:border-(--primary)/40 hover:bg-(--primary)/10 hover:text-(--fg)',
                        ].join(' ')}>
                        <RarityIcon rarity={rarity} />
                        <span>{Rarity[rarity]}</span>
                    </button>
                );
            })}
        </div>
    );
};

const SegmentedShowcase = () => {
    const [sort, setSort] = useState('savings');
    const [view, setView] = useState('table');
    return (
        <div className="flex flex-wrap items-start gap-4">
            <SegmentedControl value={sort} onChange={setSort} options={SORT_MODES} />
            <SegmentedControl value={view} onChange={setView} options={VIEW_MODES} />
        </div>
    );
};

const RangeShowcase = () => {
    const [min, setMin] = useState('');
    const [max, setMax] = useState('');
    return (
        <div className="flex items-end gap-2">
            <TextField type="number" label="Min rank" placeholder="0" value={min} onChange={setMin} className="w-28" />
            <span className="mb-2.5 text-(--soft-fg)">–</span>
            <TextField type="number" label="Max rank" placeholder="∞" value={max} onChange={setMax} className="w-28" />
        </div>
    );
};

const SliderShowcase = () => {
    const [a, setA] = useState(30);
    const [b, setB] = useState(15);
    const [c, setC] = useState(3);
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <span className="text-xs text-(--soft-fg)">Default (primary) — max 75</span>
                <div className="flex items-center gap-3">
                    <Slider className="flex-1" value={a} max={75} onChange={setA} />
                    <span className="w-12 shrink-0 text-right text-sm tabular-nums">{a} / 75</span>
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-xs text-(--soft-fg)">Custom fill — max 40</span>
                <div className="flex items-center gap-3">
                    <Slider
                        className="flex-1"
                        value={b}
                        max={40}
                        onChange={setB}
                        fillClassName="bg-[var(--diff-elite)]"
                    />
                    <span className="w-12 shrink-0 text-right text-sm tabular-nums">{b} / 40</span>
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-xs text-(--soft-fg)">Event challenge — max 3</span>
                <div className="flex items-center gap-3">
                    <Slider
                        className="flex-1"
                        value={c}
                        max={3}
                        onChange={setC}
                        fillClassName="bg-[var(--diff-event-chal)]"
                    />
                    <span className="w-12 shrink-0 text-right text-sm tabular-nums">{c} / 3</span>
                </div>
            </div>
        </div>
    );
};

// ── combined filter bar ───────────────────────────────────────────────────────

const FilterBarShowcase = () => {
    const [search, setSearch] = useState('');
    const [selectedRarities, setSelectedRarities] = useState<Rarity[]>([]);
    const [onlyRelics, setOnlyRelics] = useState(false);
    const hasFilters = search !== '' || selectedRarities.length > 0 || onlyRelics;

    const toggleRarity = (r: Rarity) =>
        setSelectedRarities(previous => (previous.includes(r) ? previous.filter(x => x !== r) : [...previous, r]));

    return (
        <div className="overflow-hidden rounded-xl border border-(--border) bg-(--overlay)">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-(--border) px-4 py-2.5">
                <span className="text-[10px] font-bold tracking-[.14em] text-(--soft-fg) uppercase">Filters</span>
                <div className="flex flex-1 items-center justify-end gap-3">
                    <Switch isSelected={onlyRelics} onChange={setOnlyRelics}>
                        Only Relics
                    </Switch>
                    <Button
                        appearance="plain"
                        intent="primary"
                        size="extra-small"
                        isDisabled={!hasFilters}
                        onPress={() => {
                            setSearch('');
                            setSelectedRarities([]);
                            setOnlyRelics(false);
                        }}>
                        Clear
                    </Button>
                </div>
            </div>
            {/* Search */}
            <div className="border-b border-(--border) px-4 py-3">
                <TextField
                    value={search}
                    onChange={setSearch}
                    placeholder="Search characters…"
                    prefix={<Search className="size-4 text-(--soft-fg)" />}
                    suffix={
                        search ? (
                            <button
                                aria-label="Clear search"
                                onMouseDown={event_ => {
                                    event_.preventDefault();
                                    setSearch('');
                                }}
                                className="cursor-pointer text-(--soft-fg) transition-colors hover:text-(--fg)">
                                <X className="size-4" />
                            </button>
                        ) : undefined
                    }
                />
            </div>
            {/* Rarity chips */}
            <div className="flex flex-wrap items-center gap-1.5 px-4 py-3">
                {RARITY_ORDER.map(rarity => {
                    const active = selectedRarities.includes(rarity);
                    return (
                        <button
                            key={rarity}
                            onClick={() => toggleRarity(rarity)}
                            className={[
                                'flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                                active
                                    ? 'border-(--primary)/50 bg-(--primary)/15 text-(--fg)'
                                    : 'border-(--border) bg-transparent text-(--soft-fg) hover:border-(--primary)/40 hover:bg-(--primary)/10 hover:text-(--fg)',
                            ].join(' ')}>
                            <RarityIcon rarity={rarity} />
                            <span>{Rarity[rarity]}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ─── campaign chips ──────────────────────────────────────────────────────────

const firstBattle = (campaign: string): ICampaignBattleComposed | undefined =>
    Object.values(CampaignsService.campaignsComposed).find(b => b.campaign === campaign);

const CHIP_COMPACT: ICampaignBattleComposed[] = [
    firstBattle('Indomitus'),
    firstBattle('Indomitus Elite'),
    firstBattle('Fall of Cadia'),
    firstBattle('Fall of Cadia Mirror Elite'),
    firstBattle('Octarius'),
    firstBattle('Saim-Hann'),
    firstBattle('Adeptus Mechanicus Standard'),
    firstBattle('Tyranids Standard'),
    firstBattle('Onslaught'),
].filter((b): b is ICampaignBattleComposed => b !== undefined);

const CHIP_LOCKED: ICampaignBattleComposed[] = [
    firstBattle('Indomitus Mirror'),
    firstBattle('Fall of Cadia Elite'),
    firstBattle('Death Guard Standard'),
    firstBattle("T'au Empire Standard"),
].filter((b): b is ICampaignBattleComposed => b !== undefined);

const CHIP_FULL: ICampaignBattleComposed[] = [
    firstBattle('Adeptus Mechanicus Standard Challenge'),
    firstBattle('Adeptus Mechanicus Extremis Challenge'),
    firstBattle('Fall of Cadia Mirror Elite'),
    firstBattle('Indomitus'),
    firstBattle('Onslaught'),
].filter((b): b is ICampaignBattleComposed => b !== undefined);

const CampaignChipsShowcase = () => (
    <Section id="campaign-chips" title="Campaign chips">
        <Group label="Compact (clickable)">
            <div className="flex flex-wrap gap-2">
                {CHIP_COMPACT.map(loc => (
                    <ChipCampaignLocation key={loc.id} location={loc} unlocked compact clickable />
                ))}
            </div>
        </Group>
        <Group label="Compact (locked / unclickable)">
            <div className="flex flex-wrap gap-2">
                {CHIP_LOCKED.map(loc => (
                    <ChipCampaignLocation key={loc.id} location={loc} unlocked={false} compact clickable={false} />
                ))}
            </div>
        </Group>
        <Group label="Full width">
            <div className="flex w-64 flex-col gap-1.5">
                {CHIP_FULL.map(loc => (
                    <ChipCampaignLocation
                        key={loc.id}
                        location={loc}
                        unlocked
                        compact={false}
                        widthClass="w-full"
                        clickable
                    />
                ))}
            </div>
        </Group>
    </Section>
);

// ─── table ───────────────────────────────────────────────────────────────────

type TableDensity = 'compact' | 'default' | 'comfortable';

const TABLE_DENSITY_OPTIONS: { value: TableDensity; label: string }[] = [
    { value: 'compact', label: 'Compact' },
    { value: 'default', label: 'Default' },
    { value: 'comfortable', label: 'Comfortable' },
];

// ─── goal progress bar (have / need with colour flip at 100 %) ───────────────

const GoalBar = ({
    have,
    need,
    unit,
    bookRarity,
}: {
    have: number;
    need: number;
    unit: string;
    bookRarity?: Rarity;
}) => {
    const over = have >= need;
    const bookIconName = bookRarity === undefined ? undefined : Rarity[bookRarity].toLowerCase() + 'Book';
    return (
        <span
            className={`flex items-center gap-1 text-xs whitespace-nowrap tabular-nums ${over ? 'font-semibold text-(--success)' : 'text-(--soft-fg)'}`}>
            {have.toLocaleString()} / {need.toLocaleString()}
            {bookIconName ? <MiscIcon icon={bookIconName} className="book-icon" /> : ` ${unit}`}
            {over && ' ✓'}
        </span>
    );
};

// ─── sub-grid (one per section) ──────────────────────────────────────────────

type GoalsTableVariant = 'rank' | 'ascend' | 'abilities';

interface GoalsSectionGridProps {
    rows: TypedGoalSelect[];
    variant: GoalsTableVariant;
    goalsEstimates: IGoalEstimate[];
    densityClass: string;
    rowHeight: number;
}

const GoalsSectionGrid = ({ rows, variant, goalsEstimates, densityClass, rowHeight }: GoalsSectionGridProps) => {
    // Local ordered copy — updated by drag and arrow buttons for visual showcase
    const [orderedRows, setOrderedRows] = useState<TypedGoalSelect[]>(() => [...rows]);
    useEffect(() => setOrderedRows([...rows]), [rows]);

    /** Reassigns priority values to match the new visual order, preserving the same set of numbers. */
    const applyPriorities = (reordered: TypedGoalSelect[], original: TypedGoalSelect[]): TypedGoalSelect[] => {
        const sorted = [...original].map(r => r.priority).toSorted((a, b) => a - b);
        return reordered.map((row, index) => ({ ...row, priority: sorted[index] }));
    };

    const moveRow = (fromIndex: number, toIndex: number) => {
        setOrderedRows(previous => {
            const next = [...previous];
            const [item] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, item);
            return applyPriorities(next, previous);
        });
    };

    const toggleInclude = (goalId: string) => {
        setOrderedRows(previous =>
            previous.map(r => (r.goalId === goalId ? { ...r, include: r.include === false ? true : false } : r))
        );
    };

    const handleRowDragEnd = (event_: RowDragEndEvent<TypedGoalSelect>) => {
        const newOrder: TypedGoalSelect[] = [];
        event_.api.forEachNodeAfterFilterAndSort(node => {
            if (node.data) newOrder.push(node.data);
        });
        setOrderedRows(previous => applyPriorities(newOrder, previous));
    };

    // Stable refs so columnDefs closure is never stale — avoids
    // ag-Grid fully resetting columns on every orderedRows change.
    const moveRowReference = useRef(moveRow);
    moveRowReference.current = moveRow;
    const toggleIncludeReference = useRef(toggleInclude);
    toggleIncludeReference.current = toggleInclude;

    const gridApiReference = useRef<GridApi | null>(null);
    useEffect(() => {
        gridApiReference.current?.redrawRows();
    }, [goalsEstimates]);

    const columnDefs = useMemo<ColDef<TypedGoalSelect>[]>(() => {
        // ── Shared ────────────────────────────────────────────────────────────

        const dragGripCol: ColDef<TypedGoalSelect> = {
            headerName: '',
            width: 36,
            maxWidth: 36,
            rowDrag: true,
            cellRenderer: () => (
                <div className="flex h-full cursor-grab items-center justify-center text-(--soft-fg) opacity-40 transition-opacity duration-150 hover:opacity-80 active:cursor-grabbing">
                    <GripVertical className="size-4" />
                </div>
            ),
            suppressNavigable: true,
            sortable: false,
        };

        const prioCol: ColDef<TypedGoalSelect> = {
            headerName: 'Priority',
            width: 96,
            maxWidth: 96,
            valueGetter: params => params.data?.priority ?? 0,
            cellClass: 'prio-cell',
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                if (!params.data) return;
                const index = params.node.rowIndex ?? 0;
                const total = params.api.getDisplayedRowCount();
                const est = goalsEstimates.find(goal => goal.goalId === params.data?.goalId);
                return (
                    <div className="flex h-full w-full">
                        <div className="flex flex-1 items-center gap-1 px-3">
                            <span className="min-w-[20px] text-center text-sm font-medium text-(--soft-fg) tabular-nums">
                                {params.data.priority}
                            </span>
                            {est?.blocked && (
                                <span title="Blocked">
                                    <AlertTriangle className="size-3.5 text-(--danger)" aria-label="Blocked" />
                                </span>
                            )}
                        </div>
                        <div className="flex w-10 flex-col border-l border-(--border)">
                            <button
                                title="Move Up"
                                disabled={index <= 0}
                                onClick={() => moveRowReference.current(index, index - 1)}
                                className="flex w-full flex-1 cursor-pointer items-center justify-center text-(--soft-fg) transition-colors hover:bg-(--primary)/15 hover:text-(--primary) disabled:cursor-not-allowed disabled:opacity-25">
                                <ArrowUp className="size-3" />
                            </button>
                            <button
                                title="Move Down"
                                disabled={index >= total - 1}
                                onClick={() => moveRowReference.current(index, index + 1)}
                                className="flex w-full flex-1 cursor-pointer items-center justify-center text-(--soft-fg) transition-colors hover:bg-(--primary)/15 hover:text-(--primary) disabled:cursor-not-allowed disabled:opacity-25">
                                <ArrowDown className="size-3" />
                            </button>
                        </div>
                    </div>
                );
            },
        };

        const actionsCol: ColDef<TypedGoalSelect> = {
            headerName: '',
            width: 200,
            maxWidth: 200,
            sortable: false,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const { data } = params;
                if (!data) return;
                const showRaidsLink =
                    data.type === PersonalGoalType.UpgradeRank ||
                    data.type === PersonalGoalType.MowAbilities ||
                    data.type === PersonalGoalType.UpgradeMaterial;
                const raidsUnitId =
                    data.type === PersonalGoalType.UpgradeMaterial
                        ? (data.upgradeMaterialId ?? data.goalId)
                        : data.unitId;
                const isActive = data.include !== false;
                return (
                    <div className="flex h-full items-center justify-end gap-1.5 leading-normal">
                        <button
                            title={isActive ? 'Active — click to exclude' : 'Inactive — click to include'}
                            onClick={event_ => {
                                event_.stopPropagation();
                                toggleIncludeReference.current(data.goalId);
                            }}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${isActive ? 'bg-(--success)' : 'bg-(--input)'}`}>
                            <span
                                className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                        </button>
                        {showRaidsLink && (
                            <Link
                                to={`/plan/dailyRaids?charSnowprintId=${encodeURIComponent(raidsUnitId)}`}
                                title="Go to Raids Table"
                                onClick={event_ => event_.stopPropagation()}
                                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded text-(--soft-fg) transition-colors hover:bg-(--primary)/15 hover:text-(--fg)">
                                <ExternalLink className="size-4" />
                            </Link>
                        )}
                        <button
                            title="Edit"
                            onClick={event_ => event_.stopPropagation()}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded text-(--soft-fg) transition-colors hover:bg-(--primary)/15 hover:text-(--fg)">
                            <Edit className="size-4" />
                        </button>
                        <button
                            title="Delete"
                            onClick={event_ => event_.stopPropagation()}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded text-(--soft-fg) transition-colors hover:bg-(--danger)/10 hover:text-(--danger)">
                            <Trash2 className="size-4" />
                        </button>
                    </div>
                );
            },
        };

        const characterCol: ColDef<TypedGoalSelect> = {
            headerName: 'Character',
            flex: 2,
            minWidth: 180,
            valueGetter: params => {
                const data = params.data;
                if (!data) return '';
                return data.type === PersonalGoalType.UpgradeMaterial ? data.upgradeMaterialId : data.unitName;
            },
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const { data } = params;
                if (!data) return;
                let portrait: React.ReactNode;
                let name: string;
                let subline: string;
                if (data.type === PersonalGoalType.UpgradeMaterial) {
                    const mat = UpgradeEntityService.getUpgradeMaterial(data.upgradeMaterialId);
                    portrait = mat ? (
                        <UpgradeImage
                            material={mat.snowprintId}
                            iconPath={mat.icon ?? ''}
                            size={30}
                            rarity={RarityMapper.stringToRarityString(mat.rarity)}
                            tooltip={mat.label ?? ''}
                        />
                    ) : undefined;
                    name = mat?.label ?? '';
                    subline = 'Material';
                } else {
                    portrait = (
                        <UnitShardIcon icon={data.unitRoundIcon} height={30} width={30} tooltip={data.unitName} />
                    );
                    name = data.unitName ?? '';
                    subline = '';
                }
                return (
                    <div className="flex h-full min-w-0 items-center gap-2.5 leading-normal">
                        <div className="shrink-0">{portrait}</div>
                        <div className="flex min-w-0 flex-col leading-tight">
                            <span className="truncate text-sm font-medium text-(--fg)">{name}</span>
                            {subline && <span className="truncate text-xs text-(--soft-fg)">{subline}</span>}
                        </div>
                    </div>
                );
            },
        };

        const daysCol: ColDef<TypedGoalSelect> = {
            headerName: 'Days',
            width: 72,
            maxWidth: 72,
            headerClass: 'ag-right-aligned-header',
            valueGetter: params => goalsEstimates.find(x => x.goalId === params.data?.goalId)?.daysTotal ?? 0,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const v = goalsEstimates.find(x => x.goalId === params.data?.goalId)?.daysTotal;
                return (
                    <div className="flex h-full w-full items-center justify-end gap-1.5 text-sm leading-normal tabular-nums">
                        {v ? (
                            <>
                                {v.toLocaleString()}
                                <Calendar className="size-3.5 shrink-0 text-(--soft-fg)" />
                            </>
                        ) : (
                            <span className="text-(--soft-fg) opacity-50">—</span>
                        )}
                    </div>
                );
            },
        };

        const estimateCol: ColDef<TypedGoalSelect> = {
            headerName: 'Done By',
            flex: 1,
            minWidth: 110,
            valueGetter: params => {
                const est = goalsEstimates.find(x => x.goalId === params.data?.goalId);
                if (!est) return;
                return est.daysLeft > 0 ? est.daysLeft : (est.xpDaysLeft ?? 0) > 0 ? est.xpDaysLeft : undefined;
            },
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const est = goalsEstimates.find(x => x.goalId === params.data?.goalId);
                const daysLeft =
                    est && est.daysLeft > 0
                        ? est.daysLeft
                        : est && est.xpDaysLeft !== undefined && est.xpDaysLeft > 0
                          ? est.xpDaysLeft
                          : undefined;
                if (!daysLeft) {
                    return (
                        <div className="flex h-full items-center text-sm leading-normal text-(--soft-fg) opacity-50">
                            —
                        </div>
                    );
                }
                const d = new Date();
                d.setDate(d.getDate() + Math.ceil(daysLeft) - 1);
                const shortDate = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
                return (
                    <div className="flex h-full min-w-0 flex-col justify-center gap-0.5 leading-normal">
                        <span className="text-sm font-medium text-(--fg)">{shortDate}</span>
                        <span className="text-xs text-(--soft-fg)">in {daysLeft} days</span>
                    </div>
                );
            },
        };

        const notesCol: ColDef<TypedGoalSelect> = {
            field: 'notes',
            headerName: 'Notes',
            flex: 1,
            minWidth: 120,
            maxWidth: 200,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const notes = params.data?.notes ?? '';
                return (
                    <div
                        className="flex h-full items-center truncate text-xs leading-normal text-(--soft-fg)"
                        title={notes}>
                        {notes}
                    </div>
                );
            },
        };

        // ── Variant: rank (UpgradeRank + MowAbilities + UpgradeMaterial) ──────

        const rankGoalCol: ColDef<TypedGoalSelect> = {
            headerName: 'Goal',
            flex: 1.5,
            minWidth: 140,
            sortable: false,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const { data } = params;
                const est = goalsEstimates.find(x => x.goalId === data?.goalId);
                if (!data || !est) return;
                let transition: React.ReactNode;
                switch (data.type) {
                    case PersonalGoalType.UpgradeRank: {
                        transition = (
                            <div className="flex items-center gap-1.5">
                                <RankIcon rank={data.rankStart} rankPoint5={data.rankStartPoint5} />
                                <ArrowRight className="size-3 text-(--soft-fg)" />
                                <RankIcon rank={data.rankEnd} rankPoint5={data.rankPoint5} />
                                {data.upgradesRarity.length > 0 && (
                                    <div className="ml-1 flex items-center gap-0.5">
                                        {data.upgradesRarity.map((r, index) => (
                                            <RarityIcon key={index} rarity={r} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );

                        break;
                    }
                    case PersonalGoalType.MowAbilities: {
                        transition = (
                            <div className="flex flex-col gap-0.5 text-xs">
                                {data.primaryEnd > data.primaryStart && (
                                    <div className="flex items-center gap-1">
                                        <span>Primary:</span> <b>{data.primaryStart}</b>
                                        <ArrowRight className="inline size-3" />
                                        <b>{data.primaryEnd}</b>
                                    </div>
                                )}
                                {data.secondaryEnd > data.secondaryStart && (
                                    <div className="flex items-center gap-1">
                                        <span>Secondary:</span> <b>{data.secondaryStart}</b>
                                        <ArrowRight className="inline size-3" />
                                        <b>{data.secondaryEnd}</b>
                                    </div>
                                )}
                                {data.upgradesRarity.length > 0 && (
                                    <div className="flex items-center gap-0.5">
                                        {data.upgradesRarity.map((r, index) => (
                                            <RarityIcon key={index} rarity={r} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );

                        break;
                    }
                    case PersonalGoalType.UpgradeMaterial: {
                        transition = <span className="text-sm">{data.quantity}×</span>;

                        break;
                    }
                    // No default
                }
                return (
                    <div className="flex h-full min-w-0 items-center gap-1.5 leading-normal">
                        <div className="flex flex-wrap items-center gap-1 text-xs">{transition}</div>
                        {est.completed && (
                            <CheckCircle2 className="size-3.5 shrink-0 text-(--success)" aria-label="Completed" />
                        )}
                    </div>
                );
            },
        };

        const rankBooksCol: ColDef<TypedGoalSelect> = {
            headerName: 'Books',
            flex: 1,
            minWidth: 120,
            valueGetter: params => goalsEstimates.find(x => x.goalId === params.data?.goalId)?.xpBooksTotal ?? 0,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const { data } = params;
                const est = goalsEstimates.find(x => x.goalId === data?.goalId);
                if (!data || !est) return;
                if (data.type === PersonalGoalType.UpgradeRank && est.xpBooksTotal > 0) {
                    const rarity = est.xpEstimate?.bookRarity;
                    const iconName = rarity === undefined ? undefined : Rarity[rarity].toLowerCase() + 'Book';
                    const levelRange = est.xpEstimate
                        ? `Lv ${est.xpEstimate.currentLevel} → ${est.xpEstimate.targetLevel}`
                        : undefined;
                    return (
                        <div className="flex h-full min-w-0 flex-col justify-center gap-0.5 py-2 leading-normal">
                            <span className="flex items-center gap-1.5 text-sm font-medium text-(--fg) tabular-nums">
                                {est.xpBooksTotal.toLocaleString()}
                                {iconName && <MiscIcon icon={iconName} className="book-icon" />}
                            </span>
                            {levelRange && <span className="text-xs text-(--soft-fg)">{levelRange}</span>}
                        </div>
                    );
                }
                if (data.type === PersonalGoalType.MowAbilities && est.mowEstimate) {
                    return (
                        <div className="flex h-full min-w-0 flex-col justify-center gap-1 py-2 leading-normal">
                            <MowMaterialsTotal total={est.mowEstimate} mowAlliance={data.unitAlliance} size="small" />
                        </div>
                    );
                }
                return (
                    <div className="flex h-full items-center text-sm leading-normal text-(--soft-fg) opacity-50">—</div>
                );
            },
        };

        const energyCol: ColDef<TypedGoalSelect> = {
            headerName: 'Energy',
            width: 90,
            maxWidth: 90,
            headerClass: 'ag-right-aligned-header',
            valueGetter: params => goalsEstimates.find(x => x.goalId === params.data?.goalId)?.energyTotal ?? 0,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const v = goalsEstimates.find(x => x.goalId === params.data?.goalId)?.energyTotal;
                return (
                    <div className="flex h-full w-full items-center justify-end gap-1.5 text-sm leading-normal tabular-nums">
                        {v ? (
                            <>
                                {v.toLocaleString()}
                                <MiscIcon icon="energy" width={15} height={18} />
                            </>
                        ) : (
                            <span className="text-(--soft-fg) opacity-50">—</span>
                        )}
                    </div>
                );
            },
        };

        const rankGoldCol: ColDef<TypedGoalSelect> = {
            headerName: 'Gold',
            width: 90,
            maxWidth: 90,
            headerClass: 'ag-right-aligned-header',
            valueGetter: params => {
                const est = goalsEstimates.find(x => x.goalId === params.data?.goalId);
                return params.data?.type === PersonalGoalType.UpgradeRank
                    ? (est?.xpEstimate?.gold ?? 0)
                    : params.data?.type === PersonalGoalType.MowAbilities
                      ? (est?.mowEstimate?.gold ?? 0)
                      : 0;
            },
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const { data } = params;
                const est = goalsEstimates.find(x => x.goalId === data?.goalId);
                const gold =
                    data?.type === PersonalGoalType.UpgradeRank
                        ? est?.xpEstimate?.gold
                        : data?.type === PersonalGoalType.MowAbilities
                          ? est?.mowEstimate?.gold
                          : undefined;
                return (
                    <div className="flex h-full w-full items-center justify-end gap-1.5 text-sm leading-normal tabular-nums">
                        {gold ? (
                            <>
                                {gold.toLocaleString()}
                                <MiscIcon icon="coin" width={16} height={16} />
                            </>
                        ) : (
                            <span className="text-(--soft-fg) opacity-50">—</span>
                        )}
                    </div>
                );
            },
        };

        // ── Variant: ascend (Ascend + Unlock) ─────────────────────────────────

        const ascendGoalCol: ColDef<TypedGoalSelect> = {
            headerName: 'Goal',
            flex: 1.5,
            minWidth: 140,
            sortable: false,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const { data } = params;
                const est = goalsEstimates.find(x => x.goalId === data?.goalId);
                if (!data || !est) return;
                let transition: React.ReactNode;
                if (data.type === PersonalGoalType.Ascend) {
                    const isSameRarity = data.rarityStart === data.rarityEnd;
                    const farmBadgeClass =
                        data.farmType === 'onslaught'
                            ? 'bg-(--accent)/20 text-(--accent-fg)'
                            : data.farmType === 'energy'
                              ? 'bg-(--primary)/15 text-(--primary)'
                              : 'bg-(--soft) text-(--soft-fg)';
                    transition = (
                        <div className="flex flex-wrap items-center gap-1">
                            {isSameRarity ? (
                                <>
                                    <StarsIcon stars={data.starsStart} />
                                    <ArrowRight className="size-3 text-(--soft-fg)" />
                                    <StarsIcon stars={data.starsEnd} />
                                </>
                            ) : (
                                <>
                                    <RarityIcon rarity={data.rarityStart} />
                                    <ArrowRight className="size-3 text-(--soft-fg)" />
                                    <RarityIcon rarity={data.rarityEnd} />
                                    <StarsIcon stars={data.starsEnd} />
                                </>
                            )}
                            {data.farmType && (
                                <span
                                    className={`rounded px-1 py-0.5 text-[10px] font-medium capitalize ${farmBadgeClass}`}>
                                    {data.farmType}
                                </span>
                            )}
                        </div>
                    );
                } else {
                    transition = <span className="text-xs text-(--soft-fg)">Unlock</span>;
                }
                return (
                    <div className="flex h-full min-w-0 items-center gap-1.5 leading-normal">
                        <div className="flex flex-wrap items-center gap-1 text-xs">{transition}</div>
                        {est.completed && (
                            <CheckCircle2 className="size-3.5 shrink-0 text-(--success)" aria-label="Completed" />
                        )}
                    </div>
                );
            },
        };

        const ascendProgressCol: ColDef<TypedGoalSelect> = {
            headerName: 'Progress',
            flex: 1.5,
            minWidth: 140,
            valueGetter: params => {
                const data = params.data;
                if (!data) return 0;
                if (data.type === PersonalGoalType.Ascend) {
                    const target = ShardsService.getTargetShards(data) || ShardsService.getTargetMythicShards(data);
                    const have = ShardsService.getTargetShards(data) > 0 ? data.shards : data.mythicShards;
                    return target > 0 ? have / target : 0;
                }
                if (data.type === PersonalGoalType.Unlock) {
                    const target = charsUnlockShards[data.rarity] ?? 0;
                    return target > 0 ? data.shards / target : 0;
                }
                return 0;
            },
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const { data } = params;
                if (!data) return;
                if (data.type === PersonalGoalType.Ascend) {
                    const targetShards = ShardsService.getTargetShards(data);
                    const targetMythicShards = ShardsService.getTargetMythicShards(data);
                    if (targetShards > 0) {
                        return (
                            <div className="flex h-full min-w-0 flex-col justify-center gap-1 py-2 leading-normal">
                                <GoalBar have={data.shards} need={targetShards} unit="shards" />
                            </div>
                        );
                    }
                    if (targetMythicShards > 0) {
                        return (
                            <div className="flex h-full min-w-0 flex-col justify-center gap-1 py-2 leading-normal">
                                <GoalBar have={data.mythicShards} need={targetMythicShards} unit="mythic shards" />
                            </div>
                        );
                    }
                } else if (data.type === PersonalGoalType.Unlock) {
                    const targetShards = charsUnlockShards[data.rarity];
                    return (
                        <div className="flex h-full min-w-0 flex-col justify-center gap-1 py-2 leading-normal">
                            <GoalBar have={data.shards} need={targetShards} unit="shards" />
                        </div>
                    );
                }
                return (
                    <div className="flex h-full items-center text-sm leading-normal text-(--soft-fg) opacity-50">—</div>
                );
            },
        };

        const orbsCol: ColDef<TypedGoalSelect> = {
            headerName: 'Orbs',
            flex: 1.5,
            minWidth: 120,
            sortable: false,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const { data } = params;
                const est = goalsEstimates.find(x => x.goalId === data?.goalId);
                if (!data || !est?.orbsEstimate || data.type === PersonalGoalType.UpgradeMaterial) {
                    return (
                        <div className="flex h-full items-center text-sm leading-normal text-(--soft-fg) opacity-50">
                            —
                        </div>
                    );
                }
                const neededOrbs = Object.fromEntries(Object.entries(est.orbsEstimate.orbs).filter(([, n]) => n > 0));
                if (Object.keys(neededOrbs).length === 0) {
                    return (
                        <div className="flex h-full items-center text-sm leading-normal text-(--soft-fg) opacity-50">
                            —
                        </div>
                    );
                }
                return (
                    <div className="flex h-full min-w-0 flex-col justify-center py-2 leading-normal">
                        <OrbsTotal
                            alliance={data.unitAlliance}
                            orbs={est.orbsEstimate.orbs}
                            displayOrbs={neededOrbs}
                            size={20}
                        />
                    </div>
                );
            },
        };

        const tokensCol: ColDef<TypedGoalSelect> = {
            headerName: 'Tokens',
            width: 90,
            maxWidth: 90,
            headerClass: 'ag-right-aligned-header',
            valueGetter: params => goalsEstimates.find(x => x.goalId === params.data?.goalId)?.oTokensTotal ?? 0,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const v = goalsEstimates.find(x => x.goalId === params.data?.goalId)?.oTokensTotal;
                return (
                    <div className="flex h-full w-full items-center justify-end text-sm leading-normal tabular-nums">
                        {v ? v.toLocaleString() : <span className="text-(--soft-fg) opacity-50">—</span>}
                    </div>
                );
            },
        };

        // ── Variant: abilities (CharacterAbilities) ───────────────────────────

        const abilitiesGoalCol: ColDef<TypedGoalSelect> = {
            headerName: 'Goal',
            flex: 1.5,
            minWidth: 140,
            sortable: false,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const { data } = params;
                const est = goalsEstimates.find(x => x.goalId === data?.goalId);
                if (!data || !est || data.type !== PersonalGoalType.CharacterAbilities) return;
                return (
                    <div className="flex h-full min-w-0 items-center gap-1.5 leading-normal">
                        <div className="flex flex-col gap-0.5 text-xs">
                            {data.activeEnd > data.activeStart && (
                                <div className="flex items-center gap-1">
                                    <span>Active:</span> <b>{data.activeStart}</b>
                                    <ArrowRight className="inline size-3" />
                                    <b>{data.activeEnd}</b>
                                </div>
                            )}
                            {data.passiveEnd > data.passiveStart && (
                                <div className="flex items-center gap-1">
                                    <span>Passive:</span> <b>{data.passiveStart}</b>
                                    <ArrowRight className="inline size-3" />
                                    <b>{data.passiveEnd}</b>
                                </div>
                            )}
                        </div>
                        {est.completed && (
                            <CheckCircle2 className="size-3.5 shrink-0 text-(--success)" aria-label="Completed" />
                        )}
                    </div>
                );
            },
        };

        const badgesCol: ColDef<TypedGoalSelect> = {
            headerName: 'Badges',
            flex: 1.5,
            minWidth: 140,
            sortable: false,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const est = goalsEstimates.find(x => x.goalId === params.data?.goalId);
                if (!est?.abilitiesEstimate) {
                    return (
                        <div className="flex h-full items-center text-sm leading-normal text-(--soft-fg) opacity-50">
                            —
                        </div>
                    );
                }
                return (
                    <div className="flex h-full min-w-0 flex-col justify-center py-2 leading-normal">
                        <CharacterAbilitiesTotal {...est.abilitiesEstimate} />
                    </div>
                );
            },
        };

        const abilitiesBooksCol: ColDef<TypedGoalSelect> = {
            headerName: 'Books',
            flex: 1,
            minWidth: 120,
            valueGetter: params => goalsEstimates.find(x => x.goalId === params.data?.goalId)?.xpBooksTotal ?? 0,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const est = goalsEstimates.find(x => x.goalId === params.data?.goalId);
                if (!est || est.xpBooksTotal === 0) {
                    return (
                        <div className="flex h-full items-center text-sm leading-normal text-(--soft-fg) opacity-50">
                            —
                        </div>
                    );
                }
                const xpEst = est.xpEstimateAbilities ?? est.xpEstimate;
                const rarity = xpEst?.bookRarity;
                const iconName = rarity === undefined ? undefined : Rarity[rarity].toLowerCase() + 'Book';
                const levelRange = xpEst ? `Lv ${xpEst.currentLevel} → ${xpEst.targetLevel}` : undefined;
                return (
                    <div className="flex h-full min-w-0 flex-col justify-center gap-0.5 py-2 leading-normal">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-(--fg) tabular-nums">
                            {est.xpBooksTotal.toLocaleString()}
                            {iconName && <MiscIcon icon={iconName} className="book-icon" />}
                        </span>
                        {levelRange && <span className="text-xs text-(--soft-fg)">{levelRange}</span>}
                    </div>
                );
            },
        };

        const abilitiesGoldCol: ColDef<TypedGoalSelect> = {
            headerName: 'Gold',
            width: 90,
            maxWidth: 90,
            headerClass: 'ag-right-aligned-header',
            valueGetter: params =>
                goalsEstimates.find(x => x.goalId === params.data?.goalId)?.abilitiesEstimate?.gold ?? 0,
            cellRenderer: (params: ICellRendererParams<TypedGoalSelect>) => {
                const gold = goalsEstimates.find(x => x.goalId === params.data?.goalId)?.abilitiesEstimate?.gold;
                return (
                    <div className="flex h-full w-full items-center justify-end gap-1.5 text-sm leading-normal tabular-nums">
                        {gold ? (
                            <>
                                {gold.toLocaleString()}
                                <MiscIcon icon="coin" width={16} height={16} />
                            </>
                        ) : (
                            <span className="text-(--soft-fg) opacity-50">—</span>
                        )}
                    </div>
                );
            },
        };

        // ── Assemble ──────────────────────────────────────────────────────────

        const variantCols =
            variant === 'rank'
                ? [rankGoalCol, rankBooksCol, energyCol, rankGoldCol]
                : variant === 'ascend'
                  ? [ascendGoalCol, ascendProgressCol, orbsCol, energyCol, tokensCol]
                  : [abilitiesGoalCol, badgesCol, abilitiesBooksCol, abilitiesGoldCol];

        return [dragGripCol, prioCol, characterCol, ...variantCols, daysCol, estimateCol, actionsCol, notesCol];
        // orderedRows intentionally omitted: moveRowReference/toggleIncludeReference keep callbacks fresh
    }, [goalsEstimates, variant]);

    return (
        <div
            className={`ag-theme-material ${densityClass} w-full`}
            style={{ height: Math.max(200, orderedRows.length * rowHeight + 42) }}>
            <AgGridReact
                modules={[AllCommunityModule]}
                theme="legacy"
                columnDefs={columnDefs}
                rowData={orderedRows}
                defaultColDef={{ suppressMovable: false, sortable: true }}
                rowHeight={rowHeight}
                rowDragManaged={true}
                animateRows={true}
                getRowId={params => params.data.goalId}
                getRowClass={params => {
                    const isActive = params.data?.include !== false;
                    if (!isActive) return 'row-goal row-inactive';
                    const completed = goalsEstimates.find(g => g.goalId === params.data?.goalId)?.completed;
                    return completed ? 'row-goal row-active row-completed' : 'row-goal row-active';
                }}
                onGridReady={event_ => {
                    gridApiReference.current = event_.api;
                }}
                onRowDragEnd={handleRowDragEnd}
                onRowDataUpdated={event_ => event_.api.redrawRows()}
            />
        </div>
    );
};

const GoalsTableShowcase = () => {
    const [density, setDensity] = useState<TableDensity>('default');

    const {
        goals,
        characters,
        mows,
        campaignsProgress,
        inventory,
        dailyRaids,
        dailyRaidsPreferences,
        gameModeTokens,
        xpIncome,
        xpUse,
    } = useContext(StoreContext);

    const resolvedChars = useMemo(() => CharactersService.resolveStoredCharacters(characters), [characters]);
    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(mows), [mows]);
    const units = useMemo(() => [...resolvedChars, ...resolvedMows], [resolvedChars, resolvedMows]);

    const { allGoals, shardsGoals, upgradeRankOrMowGoals, upgradeMaterialGoals, upgradeAbilities, ascendGoals } =
        useMemo(() => GoalsService.prepareGoals(goals, units, false), [goals, units]);

    const onslaughtTokensToday = useMemo(
        () => UpgradesService.computeOnslaughtTokensToday(gameModeTokens),
        [gameModeTokens]
    );

    const estimatedUpgradesTotal = useMemo(
        () =>
            UpgradesService.getUpgradesEstimatedDays(
                {
                    dailyEnergy: dailyRaidsPreferences.dailyEnergy,
                    campaignsProgress,
                    preferences: dailyRaidsPreferences,
                    upgrades: inventory.upgrades,
                    completedLocations: dailyRaids.raidedLocations,
                    onslaughtTokensToday,
                },
                resolvedChars,
                resolvedMows,
                ...[upgradeMaterialGoals, upgradeRankOrMowGoals, shardsGoals].flat().filter(x => x.include)
            ),
        [
            dailyRaidsPreferences,
            campaignsProgress,
            inventory.upgrades,
            dailyRaids.raidedLocations,
            onslaughtTokensToday,
            resolvedChars,
            resolvedMows,
            upgradeMaterialGoals,
            upgradeRankOrMowGoals,
            shardsGoals,
        ]
    );

    const rawGoalsEstimates = useMemo(
        () =>
            GoalsService.buildGoalEstimates(
                estimatedUpgradesTotal,
                shardsGoals,
                upgradeMaterialGoals,
                upgradeRankOrMowGoals,
                upgradeAbilities,
                resolvedChars
            ),
        [
            estimatedUpgradesTotal,
            shardsGoals,
            upgradeMaterialGoals,
            upgradeRankOrMowGoals,
            upgradeAbilities,
            resolvedChars,
        ]
    );

    const goalsEstimates = GoalsService.adjustGoalEstimates(
        cloneDeep(goals),
        cloneDeep(rawGoalsEstimates),
        inventory,
        xpUse,
        upgradeRankOrMowGoals,
        ascendGoals,
        xpIncome
    ).goalEstimates;

    const sortedUpgrades = useMemo(
        () => [...upgradeMaterialGoals, ...upgradeRankOrMowGoals].toSorted((a, b) => a.priority - b.priority),
        [upgradeMaterialGoals, upgradeRankOrMowGoals]
    );
    const sortedShards = useMemo(() => shardsGoals.toSorted((a, b) => a.priority - b.priority), [shardsGoals]);
    const sortedAbilities = useMemo(
        () => upgradeAbilities.toSorted((a, b) => a.priority - b.priority),
        [upgradeAbilities]
    );

    const densityClass =
        density === 'compact' ? 'density-compact' : density === 'comfortable' ? 'density-comfortable' : '';
    const rowHeight = density === 'compact' ? 36 : density === 'comfortable' ? 96 : 80;

    if (allGoals.length === 0) {
        return <p className="text-sm text-(--soft-fg)">No goals — add some on the Goals page to see them here.</p>;
    }

    const gridProps: Omit<GoalsSectionGridProps, 'rows' | 'variant'> = {
        goalsEstimates,
        densityClass,
        rowHeight,
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                <span className="text-xs text-(--soft-fg)">Density</span>
                <div className="inline-flex rounded-lg border border-(--border) bg-(--neutral) p-0.5">
                    {TABLE_DENSITY_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setDensity(opt.value)}
                            className={[
                                'cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                density === opt.value
                                    ? 'bg-(--bg) text-(--fg) shadow-sm'
                                    : 'text-(--soft-fg) hover:text-(--fg)',
                            ].join(' ')}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-(--border)">
                {sortedUpgrades.length > 0 && (
                    <AccordionItem title="Upgrade rank / MoW" defaultOpen flush>
                        <GoalsSectionGrid rows={sortedUpgrades} variant="rank" {...gridProps} />
                    </AccordionItem>
                )}
                {sortedShards.length > 0 && (
                    <AccordionItem title="Ascend / Promote / Unlock" defaultOpen flush>
                        <GoalsSectionGrid rows={sortedShards} variant="ascend" {...gridProps} />
                    </AccordionItem>
                )}
                {sortedAbilities.length > 0 && (
                    <AccordionItem title="Character Abilities" defaultOpen flush>
                        <GoalsSectionGrid rows={sortedAbilities} variant="abilities" {...gridProps} />
                    </AccordionItem>
                )}
            </div>
        </div>
    );
};

// ─── colours ─────────────────────────────────────────────────────────────────

interface SwatchProps {
    token: string;
    label: string;
    fg?: string;
}
const Swatch = ({ token, label, fg }: SwatchProps) => (
    <div className="flex min-w-[80px] flex-col gap-1.5">
        <div
            className="h-14 w-full rounded-lg border border-(--border) shadow-sm"
            style={{ background: `var(${token})` }}
        />
        {fg && (
            <div
                className="flex h-6 items-center justify-center rounded-md text-xs font-medium"
                style={{ background: `var(${token})`, color: `var(${fg})` }}>
                Aa
            </div>
        )}
        <p className="font-mono text-xs leading-tight text-(--soft-fg)">{token}</p>
        <p className="text-xs leading-tight text-(--fg)">{label}</p>
    </div>
);

const SEMANTIC_PAIRS: Array<{ token: string; fg: string; label: string }> = [
    { token: '--primary', fg: '--primary-fg', label: 'Primary' },
    { token: '--secondary', fg: '--secondary-fg', label: 'Secondary' },
    { token: '--neutral', fg: '--neutral-fg', label: 'Neutral' },
    { token: '--accent', fg: '--accent-fg', label: 'Accent' },
    { token: '--success', fg: '--success-fg', label: 'Success' },
    { token: '--warning', fg: '--warning-fg', label: 'Warning' },
    { token: '--danger', fg: '--danger-fg', label: 'Danger' },
    { token: '--soft', fg: '--soft-fg', label: 'Soft' },
    { token: '--overlay', fg: '--overlay-fg', label: 'Overlay' },
    { token: '--sidebar', fg: '--sidebar-fg', label: 'Sidebar' },
    { token: '--bg', fg: '--fg', label: 'Background' },
];

const CARD_TOKENS: Array<{ token: string; label: string }> = [
    { token: '--card-bg', label: 'Card bg' },
    { token: '--card-border', label: 'Card border' },
    { token: '--card-fg', label: 'Card fg' },
];

const BORDER_TOKENS: Array<{ token: string; label: string }> = [
    { token: '--border', label: 'Border' },
    { token: '--input', label: 'Input' },
    { token: '--ring', label: 'Ring' },
];

const CHART_TOKENS = [1, 2, 3, 4, 5].map(n => ({
    token: `--chart-${n}` as string,
    label: `Chart ${n}`,
}));

const RARITY_TOKENS: Array<{ token: string; label: string }> = [
    { token: '--rarity-common', label: 'Common' },
    { token: '--rarity-uncommon', label: 'Uncommon' },
    { token: '--rarity-rare', label: 'Rare' },
    { token: '--rarity-epic', label: 'Epic' },
    { token: '--rarity-legendary', label: 'Legendary' },
    { token: '--rarity-mythic', label: 'Mythic' },
];

const RANK_GROUPS = [
    { label: 'Stone', tokens: ['--rank-stone1', '--rank-stone2', '--rank-stone3'] },
    { label: 'Iron', tokens: ['--rank-iron1', '--rank-iron2', '--rank-iron3'] },
    { label: 'Bronze', tokens: ['--rank-bronze1', '--rank-bronze2', '--rank-bronze3'] },
    { label: 'Silver', tokens: ['--rank-silver1', '--rank-silver2', '--rank-silver3'] },
    { label: 'Gold', tokens: ['--rank-gold1', '--rank-gold2', '--rank-gold3'] },
    { label: 'Diamond', tokens: ['--rank-diamond1', '--rank-diamond2', '--rank-diamond3'] },
    { label: 'Adamantine', tokens: ['--rank-adamantine1', '--rank-adamantine2', '--rank-adamantine3'] },
];

const ColoursSection = () => (
    <Section id="colours" title="Colours">
        <Group label="Semantic pairs (background + foreground)">
            <div className="flex flex-wrap gap-4">
                {SEMANTIC_PAIRS.map(({ token, fg, label }) => (
                    <Swatch key={token} token={token} fg={fg} label={label} />
                ))}
            </div>
        </Group>
        <Group label="Card surface">
            <div className="flex flex-wrap gap-4">
                {CARD_TOKENS.map(({ token, label }) => (
                    <Swatch key={token} token={token} label={label} />
                ))}
            </div>
        </Group>
        <Group label="Border / input / ring">
            <div className="flex flex-wrap gap-4">
                {BORDER_TOKENS.map(({ token, label }) => (
                    <Swatch key={token} token={token} label={label} />
                ))}
            </div>
        </Group>
        <Group label="Chart palette">
            <div className="flex flex-wrap gap-4">
                {CHART_TOKENS.map(({ token, label }) => (
                    <Swatch key={token} token={token} label={label} />
                ))}
            </div>
        </Group>
        <Group label="Rarity">
            <div className="flex flex-wrap gap-4">
                {RARITY_TOKENS.map(({ token, label }) => (
                    <Swatch key={token} token={token} label={label} />
                ))}
            </div>
        </Group>
        <Group label="Rank tiers">
            <div className="space-y-3">
                {RANK_GROUPS.map(({ label, tokens }) => (
                    <div key={label} className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-xs font-medium text-(--soft-fg)">{label}</span>
                        <div className="flex gap-2">
                            {tokens.map(token => (
                                <div
                                    key={token}
                                    title={token}
                                    className="h-8 w-16 rounded-md border border-(--border) shadow-sm"
                                    style={{ background: `var(${token})` }}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </Group>
    </Section>
);

// ─── page ────────────────────────────────────────────────────────────────────

export const UiKitPage = () => {
    const [switchA, setSwitchA] = useState(true);
    const [switchB, setSwitchB] = useState(false);

    return (
        <div className="space-y-12 py-6">
            <div>
                <h2 className="text-2xl leading-tight font-bold text-(--fg)">UI Kit</h2>
                <p className="text-sm text-(--soft-fg)">Live components and design primitives</p>
            </div>

            <UiKitNav />

            {/* ── Primitives ───────────────────────────────────────────── */}

            <ColoursSection />

            <Separator />

            <Section id="button" title="Button">
                <Group label="Intents & appearances">
                    <Row>
                        <Button intent="primary">Primary</Button>
                        <Button intent="secondary">Secondary</Button>
                        <Button intent="success">Success</Button>
                        <Button intent="warning">Warning</Button>
                        <Button intent="danger">Danger</Button>
                        <Separator orientation="vertical" className="h-8" />
                        <Button intent="primary" appearance="outline">
                            Outline
                        </Button>
                        <Button intent="primary" appearance="plain">
                            Plain
                        </Button>
                    </Row>
                </Group>
                <Group label="Sizes">
                    <Row className="items-end">
                        <Button size="extra-small">XS</Button>
                        <Button size="small">Small</Button>
                        <Button size="medium">Medium</Button>
                        <Button size="large">Large</Button>
                    </Row>
                </Group>
                <Group label="States">
                    <Row>
                        <Button isDisabled>Disabled</Button>
                        <Button isPending>Pending</Button>
                    </Row>
                </Group>
                <ChapterDivider label="Real-world examples" />
                <Group label="App bar (replaces MUI IconButton)">
                    <Row className="rounded-lg border border-(--border) bg-(--sidebar) px-3 py-2">
                        <Button size="square-petite" appearance="plain" intent="secondary">
                            <HelpCircle data-slot="icon" />
                        </Button>
                        <Button size="square-petite" appearance="plain" intent="secondary">
                            <ExternalLink data-slot="icon" />
                        </Button>
                        <Button size="square-petite" appearance="plain" intent="secondary">
                            <RefreshCw data-slot="icon" />
                        </Button>
                        <Button size="square-petite" appearance="plain" intent="secondary">
                            <Megaphone data-slot="icon" />
                        </Button>
                        <Button size="square-petite" appearance="plain" intent="secondary">
                            <Menu data-slot="icon" />
                        </Button>
                    </Row>
                </Group>
                <Group label="Goal card actions">
                    <Row>
                        <Button size="square-petite" appearance="plain" intent="secondary">
                            <ArrowUp data-slot="icon" />
                        </Button>
                        <Button size="square-petite" appearance="plain" intent="secondary">
                            <ArrowDown data-slot="icon" />
                        </Button>
                        <Button size="square-petite" appearance="plain" intent="secondary">
                            <Edit data-slot="icon" />
                        </Button>
                        <Button size="square-petite" appearance="plain" intent="danger">
                            <Trash2 data-slot="icon" />
                        </Button>
                        <Separator orientation="vertical" className="h-8" />
                        <Button size="small" intent="success" appearance="outline">
                            <CheckCircle2 data-slot="icon" />
                            Active
                        </Button>
                        <Button size="small" intent="danger" appearance="outline">
                            <X data-slot="icon" />
                            Inactive
                        </Button>
                        <Separator orientation="vertical" className="h-8" />
                        <Button size="small" intent="secondary" appearance="outline">
                            <Link2 data-slot="icon" />
                            Go to Raids Table
                        </Button>
                    </Row>
                </Group>
                <Group label="Goals / Raids header">
                    <Row>
                        <Button size="small" intent="primary">
                            <Link2 data-slot="icon" />
                            Go to Goals
                        </Button>
                        <Button size="small" intent="secondary" appearance="outline">
                            <Settings data-slot="icon" />
                            Raids Settings
                        </Button>
                        <Button size="small" intent="primary">
                            <RefreshCw data-slot="icon" />
                            Sync
                        </Button>
                        <Button size="small" intent="success">
                            <RefreshCw data-slot="icon" />
                            Refresh
                        </Button>
                        <Button size="small" intent="danger">
                            <X data-slot="icon" />
                            Reset day
                        </Button>
                        <Button size="small" intent="danger">
                            <Trash2 data-slot="icon" />
                            Delete all
                        </Button>
                    </Row>
                </Group>
                <Group label="LRE dialogs">
                    <Row>
                        <Button size="small" intent="primary" appearance="plain">
                            Save
                        </Button>
                        <Button size="small" intent="secondary" appearance="plain">
                            Cancel
                        </Button>
                        <Button size="small" intent="danger">
                            Delete
                        </Button>
                        <Button size="small" intent="secondary" appearance="plain">
                            Clear all
                        </Button>
                        <Button size="small" intent="primary" appearance="plain">
                            Add top 5
                        </Button>
                    </Row>
                </Group>
            </Section>

            <Separator />

            <Section id="button-pill" title="ButtonPill">
                <Group label="Widths">
                    <Row>
                        <ButtonPill>Compact</ButtonPill>
                        <ButtonPill widthClass="w-36">Wider</ButtonPill>
                        <ButtonPill compact={false} widthClass="w-full max-w-xs">
                            Full width
                        </ButtonPill>
                    </Row>
                </Group>
                <Group label="States">
                    <Row>
                        <ButtonPill>Default</ButtonPill>
                        <ButtonPill disabled>Disabled</ButtonPill>
                    </Row>
                </Group>
            </Section>

            <Separator />

            <Section id="text-field" title="TextField">
                <Group label="Basic">
                    <div className="flex flex-wrap gap-4">
                        <TextField placeholder="Placeholder text" className="w-56" />
                        <TextField label="Label" placeholder="With label" className="w-56" />
                        <TextField
                            label="With description"
                            placeholder="Enter value"
                            description="Helper text shown below the field."
                            className="w-56"
                        />
                    </div>
                </Group>
                <Group label="States">
                    <div className="flex flex-wrap gap-4">
                        <TextField label="Disabled" placeholder="Cannot edit" isDisabled className="w-56" />
                        <TextField
                            label="Invalid"
                            placeholder="Bad value"
                            isInvalid
                            errorMessage="This field is required."
                            className="w-56"
                        />
                        <TextField label="Pending" placeholder="Loading…" isPending className="w-56" />
                    </div>
                </Group>
                <Group label="Variants">
                    <div className="flex flex-wrap gap-4">
                        <TextField
                            label="With prefix"
                            placeholder="Username"
                            prefix={<Mail className="size-4 text-(--soft-fg)" />}
                            className="w-56"
                        />
                        <TextField
                            label="With suffix"
                            placeholder="Search…"
                            suffix={<Search className="size-4 text-(--soft-fg)" />}
                            className="w-56"
                        />
                        <TextField
                            label="Password"
                            type="password"
                            isRevealable
                            placeholder="••••••••"
                            className="w-56"
                        />
                    </div>
                </Group>
            </Section>

            <Separator />

            <Section id="switch" title="Switch">
                <Group label="Interactive">
                    <Row>
                        <Switch isSelected={switchA} onChange={setSwitchA}>
                            {switchA ? 'On' : 'Off'}
                        </Switch>
                        <Switch isSelected={switchB} onChange={setSwitchB}>
                            {switchB ? 'Enabled' : 'Disabled'}
                        </Switch>
                        <Switch isSelected={switchA} onChange={setSwitchA} aria-label="No label" />
                    </Row>
                </Group>
                <Group label="Disabled">
                    <Row>
                        <Switch isSelected={true} isDisabled>
                            Always on
                        </Switch>
                        <Switch isSelected={false} isDisabled>
                            Always off
                        </Switch>
                    </Row>
                </Group>
            </Section>

            <Separator />

            <Section id="badge" title="Badge">
                <Group label="Solid">
                    <Row>
                        <Badge>Default</Badge>
                        <Badge intent="primary">Primary</Badge>
                        <Badge intent="success">Success</Badge>
                        <Badge intent="warning">Warning</Badge>
                        <Badge intent="danger">Danger</Badge>
                    </Row>
                </Group>
                <Group label="Outline">
                    <Row>
                        <Badge appearance="outline">Default</Badge>
                        <Badge intent="primary" appearance="outline">
                            Primary
                        </Badge>
                        <Badge intent="success" appearance="outline">
                            Success
                        </Badge>
                        <Badge intent="warning" appearance="outline">
                            Warning
                        </Badge>
                        <Badge intent="danger" appearance="outline">
                            Danger
                        </Badge>
                    </Row>
                </Group>
            </Section>

            <Separator />

            <Section id="card" title="Card">
                <Group label="Header + content">
                    <div className="flex flex-wrap items-start gap-4">
                        <Card className="w-72">
                            <CardHeader>
                                <CardTitle>Daily Raids</CardTitle>
                                <span className="text-sm text-(--soft-fg)">3 locations</span>
                            </CardHeader>
                            <CardContent className="text-xs text-(--soft-fg)">Location list goes here.</CardContent>
                        </Card>
                        <Card className="w-72">
                            <CardHeader>
                                <CardTitle>Your Goals</CardTitle>
                                <Badge intent="primary">450 ⚡</Badge>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-(--soft-fg)">Goal rows go here.</p>
                            </CardContent>
                        </Card>
                    </div>
                </Group>
                <Group label="Header + content + footer">
                    <Card className="w-72">
                        <CardHeader>
                            <CardTitle>Edit goal</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-(--soft-fg)">Form fields go here.</p>
                        </CardContent>
                        <CardFooter>
                            <Button size="small" intent="primary">
                                Save
                            </Button>
                            <Button size="small" appearance="outline">
                                Cancel
                            </Button>
                        </CardFooter>
                    </Card>
                </Group>
                <Group label="Minimal">
                    <Card className="w-72 p-4">
                        <p className="font-medium">Inline content</p>
                        <p className="mt-1 text-xs text-(--soft-fg)">Skip slots, use p-* directly.</p>
                    </Card>
                </Group>
            </Section>

            <Separator />

            <Section id="loader" title="Loader">
                <Group label="Variants">
                    <Row className="items-center">
                        <Loader variant="spin" size="medium" />
                        <Loader variant="bars" size="medium" />
                        <Loader variant="ring" size="medium" />
                    </Row>
                </Group>
                <Group label="Sizes (spin)">
                    <Row className="items-center">
                        <Loader variant="spin" size="small" />
                        <Loader variant="spin" size="medium" />
                        <Loader variant="spin" size="large" />
                        <Loader variant="spin" size="extra-large" />
                    </Row>
                </Group>
            </Section>

            <Separator />

            <Section id="slider" title="Slider">
                <SliderShowcase />
            </Section>

            <Separator />

            <Section id="modal" title="Modal">
                <Group label="Variants">
                    <Row>
                        <Modal>
                            <Button intent="secondary" appearance="outline">
                                Info
                            </Button>
                            <Modal.Content size="sm">
                                <Dialog.Header title="About this feature" description="Here's what you need to know." />
                                <Dialog.Body>
                                    <p className="text-sm text-(--soft-fg)">Closes on click-away or Escape.</p>
                                </Dialog.Body>
                                <Dialog.Footer>
                                    <Dialog.Close intent="primary">Got it</Dialog.Close>
                                </Dialog.Footer>
                            </Modal.Content>
                        </Modal>

                        <Modal>
                            <Button intent="danger" appearance="outline">
                                Danger confirm
                            </Button>
                            <Modal.Content size="sm">
                                <Dialog.Header title="Delete goal?" description="This action cannot be undone." />
                                <Dialog.Body>
                                    <p className="text-sm text-(--soft-fg)">
                                        The goal and all associated progress will be permanently removed.
                                    </p>
                                </Dialog.Body>
                                <Dialog.Footer>
                                    <Dialog.Close appearance="outline">Cancel</Dialog.Close>
                                    <Dialog.Close intent="danger">Delete</Dialog.Close>
                                </Dialog.Footer>
                            </Modal.Content>
                        </Modal>
                    </Row>
                </Group>
            </Section>

            <Separator />

            <Section id="separator" title="Separator">
                <Group label="Horizontal">
                    <Separator />
                </Group>
                <Group label="With text">
                    <Separator>Section Label</Separator>
                </Group>
                <Group label="Vertical">
                    <div className="flex h-6 items-center gap-3 text-sm">
                        <span>Raids</span>
                        <Separator orientation="vertical" />
                        <span>Goals</span>
                        <Separator orientation="vertical" />
                        <span>Progress</span>
                    </div>
                </Group>
            </Section>

            <Separator />

            <Section id="tooltip" title="Tooltip">
                <Group label="Wrapping interactive elements">
                    <Row>
                        <AccessibleTooltip title="Applies all pending changes">
                            <Button intent="primary">Save</Button>
                        </AccessibleTooltip>
                        <AccessibleTooltip title="Permanently deletes this goal — cannot be undone">
                            <Button intent="danger" appearance="outline">
                                Delete
                            </Button>
                        </AccessibleTooltip>
                        <AccessibleTooltip title="Days until completion: 14">
                            <span tabIndex={0}>
                                <Badge intent="warning">450 ⚡</Badge>
                            </span>
                        </AccessibleTooltip>
                    </Row>
                </Group>
                <Group label="Rich content">
                    <AccessibleTooltip
                        title={
                            <div className="space-y-0.5 text-xs">
                                <div className="font-semibold">Bolter Executioner</div>
                                <div>Damage: 450 · Range: 2</div>
                                <div>Faction: Ultramarines</div>
                            </div>
                        }>
                        <Button intent="secondary" appearance="outline">
                            Unit info
                        </Button>
                    </AccessibleTooltip>
                </Group>
                <Group label="LazyTooltip (mounts on first hover only)">
                    <Row>
                        <LazyTooltip title="Mounts only on first hover for performance">
                            <Button intent="secondary" appearance="outline">
                                Hover me
                            </Button>
                        </LazyTooltip>
                        <LazyTooltip title="Another lazy tooltip">
                            <span tabIndex={0}>
                                <Badge intent="success">Optimised</Badge>
                            </span>
                        </LazyTooltip>
                    </Row>
                </Group>
            </Section>

            <Separator />

            <Section id="domain-selects" title="Domain selects">
                <Group label="Rarity · Rank · Stars · Faction">
                    <DomainSelectsShowcase />
                </Group>
                <Group label="ComboBox (searchable single-select)">
                    <ComboBoxDemo />
                </Group>
            </Section>

            <Separator />

            <Section id="progress" title="Progress">
                <Group label="Intents">
                    <div className="w-full max-w-md space-y-4">
                        <ProgressBar label="Primary" value={72} max={100} intent="primary" />
                        <ProgressBar label="Success" value={100} max={100} intent="success" />
                        <ProgressBar label="Warning" value={45} max={100} intent="warning" />
                        <ProgressBar label="Danger" value={18} max={100} intent="danger" />
                    </div>
                </Group>
                <Group label="Without label">
                    <div className="w-full max-w-md space-y-2">
                        <ProgressBar value={60} max={100} intent="primary" />
                        <ProgressBar value={30} max={100} intent="danger" />
                    </div>
                </Group>
            </Section>

            <Separator />

            <Section id="accordion" title="Accordion">
                <Group label="Interactive">
                    <div className="w-full max-w-lg overflow-hidden rounded-lg border border-(--border)">
                        <AccordionItem title="Daily Raids" defaultOpen>
                            3 locations planned · 420 energy · Est. 14 days to next rank
                        </AccordionItem>
                        <AccordionItem title="Goals summary">
                            5 active goals · 2 completed this week · Next: Marneus Calgar → Gold 3
                        </AccordionItem>
                        <AccordionItem title="Campaign progress">
                            Indomitus: 12/30 · Fall of Cadia: 5/24 · Octarius: 0/18
                        </AccordionItem>
                    </div>
                </Group>
            </Section>

            <Separator />

            <Section id="radio" title="Radio group">
                <Group label="Fieldsets">
                    <RadioGroupShowcase />
                </Group>
            </Section>

            <Separator />

            <CampaignChipsShowcase />

            <Separator />

            <Section id="table" title="Table">
                <Group label="Goals (live data · density variants)">
                    <GoalsTableShowcase />
                </Group>
            </Section>

            <Separator />

            <Section id="filters" title="Filters">
                <Group label="Text search">
                    <div className="w-72">
                        <TextSearchShowcase />
                    </div>
                </Group>
                <Group label="Select (single)">
                    <SelectShowcase />
                </Group>
                <Group label="Select (multi)">
                    <MultiSelectShowcase />
                </Group>
                <Group label="Toggle chips">
                    <ChipsShowcase />
                </Group>
                <Group label="Segmented control">
                    <SegmentedShowcase />
                </Group>
                <Group label="Number range">
                    <RangeShowcase />
                </Group>
                <Group label="Combined">
                    <div className="max-w-2xl">
                        <FilterBarShowcase />
                    </div>
                </Group>
            </Section>

            {/* ── Live ─────────────────────────────────────────────────── */}

            <ChapterDivider label="Live" />

            <Section id="home-cards" title="Home page cards">
                <div className="flex flex-wrap items-start gap-4">
                    <DailyRaidsSection />
                    <HomeLreCard />
                    <GoalsSection />
                </div>
            </Section>

            <Separator />

            <Section id="goals" title="Goals">
                <GoalCardShowcase />
            </Section>

            <Separator />

            <Section id="daily-raids" title="Daily Raids">
                <RaidCardsShowcase />
            </Section>
        </div>
    );
};
