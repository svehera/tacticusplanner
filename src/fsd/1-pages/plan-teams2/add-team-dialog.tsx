/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { uniq } from 'lodash';
import { X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { Alliance, DamageType, FactionId, Rank, Rarity, Trait } from '@/fsd/5-shared/model';
import { AccessibleTooltip, Button, Select, SelectMulti } from '@/fsd/5-shared/ui';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';
import { RaritySelect } from '@/fsd/5-shared/ui/selects';

import { CampaignImage } from '@/fsd/4-entities/campaign';
import { CharactersService, ICharacter2 } from '@/fsd/4-entities/character';
import { IMow2 } from '@/fsd/4-entities/mow';

import { CharacterSelectGrid, MowSelectGrid } from '@/fsd/2-widgets/unit-select-grid';

import { RosterSnapshotsMagnificationSlider } from '../input-roster-snapshots/roster-snapshots-magnification-slider';

import {
    campaignStorylineIcon,
    campaignStorylineLabel,
    campaignStorylineOptions,
    campaignStorylineUsableFactionIds,
    campaignStorylineUsableFactions,
} from './campaign.constants';
import { incursionMowDeployableAlliance } from './incursion.constants';
import { IUnitFilterCriteria } from './models';
import { TeamFlow } from './team-flow';
import { Teams2Service } from './teams2.service';
import { UnitFilter } from './unit-filter';

interface Props {
    chars: ICharacter2[];
    mows: IMow2[];
    selectedChars: string[];
    selectedMows: string[];
    flexIndex?: number;
    allowLockedUnits: boolean;
    searchText: string;
    minRarity: Rarity;
    maxRarity: Rarity;
    rarityCap: Rarity;
    minRank: Rank;
    maxRank: Rank;
    factions: FactionId[];
    traits: Trait[];
    alliance: Alliance[];
    attackType: string;
    minHits: number | '';
    maxHits: number | '';
    movement: number | '';
    minRange: number | '';
    maxRange: number | '';
    damageTypes: DamageType[];
    notes: string;
    zoom: number;
    setZoom: (value: number) => void;
    onAddChar: (snowprintId: string) => void;
    onAddMow: (snowprintId: string) => void;
    onCharClicked: (char: ICharacter2) => void;
    onMowClicked: (mow: IMow2) => void;
    onAllowLockedUnitsChange: (allow: boolean) => void;
    onSearchTextChange: (text: string) => void;
    onMinRarityChange: (rarity: Rarity) => void;
    onMaxRarityChange: (rarity: Rarity) => void;
    onMinRankChange: (rank: Rank) => void;
    onMaxRankChange: (rank: Rank) => void;
    onFactionsChange: (factions: FactionId[]) => void;
    onTraitsChange: (traits: Trait[]) => void;
    onAllianceChange: (alliance: Alliance[]) => void;
    onAttackTypeChange: (attackType: string) => void;
    onMinHitsChange: (hits: number | '') => void;
    onMaxHitsChange: (hits: number | '') => void;
    onMovementChange: (movement: number | '') => void;
    onMinRangeChange: (range: number | '') => void;
    onMaxRangeChange: (range: number | '') => void;
    onDamageTypesChange: (damageTypes: DamageType[]) => void;
    onRarityCapChanged: (rarity: Rarity) => void;
    deployedCharIds: string[];
    deployedMowIds: string[];

    saveAllowed: boolean;
    saveDisallowedMessage: string | undefined;
    warDisallowedMessage: string | undefined;
    tournamentArenaDisallowedMessage: string | undefined;
    warOffenseSelected: boolean;
    warDefenseSelected: boolean;
    guildRaidSelected: boolean;
    tournamentArenaSelected: boolean;
    hordeModeSelected: boolean;
    campaignSelected: boolean;
    campaignStoryline: string | undefined;
    incursionSelected: boolean;
    incursionMows: string[];
    teamName: string;
    onWarOffenseChanged: (offense: boolean) => void;
    onWarDefenseChanged: (defense: boolean) => void;
    onGuildRaidChanged: (guildRaid: boolean) => void;
    onTournamentArenaChanged: (tournamentArena: boolean) => void;
    onHordeModeChanged: (hordeMode: boolean) => void;
    onCampaignChanged: (campaign: boolean) => void;
    onCampaignStorylineChanged: (storyline: string | undefined) => void;
    onIncursionChanged: (incursion: boolean) => void;
    onIncursionMowsChanged: (mowIds: string[]) => void;
    onTeamNameChanged: (teamName: string) => void;
    onNotesChanged: (notes: string) => void;
    onCancel: () => void;
    onSave: () => void;
}
export const AddTeamDialog: React.FC<Props> = ({
    chars,
    mows,
    selectedChars,
    selectedMows,
    flexIndex,
    allowLockedUnits,
    searchText,
    minRarity,
    maxRarity,
    minRank,
    maxRank,
    factions,
    traits,
    alliance,
    attackType,
    minHits,
    maxHits,
    movement,
    minRange,
    maxRange,
    damageTypes,
    notes,
    zoom,
    rarityCap,
    setZoom,
    onAddChar,
    onAddMow,
    onCharClicked,
    onMowClicked,
    onAllowLockedUnitsChange,
    onSearchTextChange,
    onMinRarityChange,
    onMaxRarityChange,
    onMinRankChange,
    onMaxRankChange,
    onFactionsChange,
    onTraitsChange,
    onAllianceChange,
    onAttackTypeChange,
    onMinHitsChange,
    onMaxHitsChange,
    onMovementChange,
    onMinRangeChange,
    onMaxRangeChange,
    onDamageTypesChange,
    onRarityCapChanged,
    deployedCharIds,
    deployedMowIds,
    onCancel,
    onSave,

    saveAllowed,
    saveDisallowedMessage,
    warDisallowedMessage,
    tournamentArenaDisallowedMessage,
    warOffenseSelected: warOffense,
    warDefenseSelected: warDefense,
    guildRaidSelected: guildRaid,
    tournamentArenaSelected: tournamentArena,
    hordeModeSelected,
    campaignSelected,
    campaignStoryline,
    incursionSelected,
    incursionMows,
    teamName,
    onWarOffenseChanged,
    onWarDefenseChanged,
    onGuildRaidChanged,
    onTournamentArenaChanged,
    onHordeModeChanged,
    onCampaignChanged,
    onCampaignStorylineChanged,
    onIncursionChanged,
    onIncursionMowsChanged,
    onTeamNameChanged,
    onNotesChanged,
}: Props) => {
    const [mowWidth, setMowWidth] = useState<number>(250);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const startResizing = useCallback(() => {
        setIsDragging(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsDragging(false);
    }, []);

    const resizeGrids = useCallback(
        (event: MouseEvent) => {
            if (isDragging) {
                const newWidth = window.innerWidth - event.clientX;
                if (newWidth > 200 && newWidth < window.innerWidth * 0.5) {
                    setMowWidth(newWidth);
                }
            }
        },
        [isDragging]
    );

    useEffect(() => {
        if (isDragging) {
            globalThis.addEventListener('mousemove', resizeGrids);
            globalThis.addEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'col-resize';
        } else {
            document.body.style.cursor = 'default';
        }
        return () => {
            globalThis.removeEventListener('mousemove', resizeGrids);
            globalThis.removeEventListener('mouseup', stopResizing);
        };
    }, [isDragging, resizeGrids, stopResizing]);

    const allFactions: FactionId[] = uniq([...chars.map(c => c.faction), ...mows.map(m => m.faction)]).toSorted(
        (a, b) => a.localeCompare(b)
    );

    const allTraits: Trait[] = CharactersService.getTraitsOptions(chars);
    const hitsOptions = CharactersService.getHitsOptions(chars);
    const movementOptions = CharactersService.getMovementOptions(chars);
    const rangeOptions = CharactersService.getRangeOptions(chars);
    const damageTypesOptions = CharactersService.getDamageTypesOptions(chars);

    const filterCriteria: IUnitFilterCriteria = {
        allowLockedUnits,
        minRank,
        maxRank,
        minRarity,
        maxRarity,
        factions,
        traits,
        alliance,
        attackType,
        minHits,
        maxHits,
        movement,
        minRange,
        maxRange,
        damageTypes,
        searchText,
    };

    // When a campaign is selected, only its usable factions can be fielded.
    const campaignFactions =
        campaignSelected && campaignStoryline ? campaignStorylineUsableFactionIds(campaignStoryline) : undefined;

    // Union, not intersection: a roster can serve several Incursions sharing an alliance at once.
    const incursionAlliances = incursionSelected
        ? uniq(incursionMows.map(id => incursionMowDeployableAlliance(id)).filter(a => a !== undefined))
        : [];

    // Narrow the dropdown to MoWs sharing an already-selected alliance, so every pick stays compatible.
    const incursionMowOptions =
        incursionAlliances.length === 0
            ? mows
            : mows.filter(m => {
                  const alliance = incursionMowDeployableAlliance(m.snowprintId);
                  return alliance !== undefined && incursionAlliances.includes(alliance);
              });

    const filteredChars = chars
        .filter(c => !selectedChars.includes(c.snowprintId))
        .filter(c => !campaignFactions?.length || campaignFactions.includes(c.faction))
        .filter(c => CharactersService.passesAllianceFilter(c.alliance, incursionAlliances))
        .filter(c => Teams2Service.passesCharacterFilter(c, filterCriteria))
        .toSorted((a, b) => {
            if (b.rank !== a.rank) return b.rank - a.rank;
            const powerA = Math.pow(a.activeAbilityLevel ?? 0, 2) + Math.pow(a.passiveAbilityLevel ?? 0, 2);
            const powerB = Math.pow(b.activeAbilityLevel ?? 0, 2) + Math.pow(b.passiveAbilityLevel ?? 0, 2);
            if (powerB !== powerA) return powerB - powerA;
            return b.rarity - a.rarity;
        })
        .map(a => Teams2Service.capCharacterAtRarity(a, rarityCap));

    const filteredMows = mows
        .filter(mow => !selectedMows.includes(mow.snowprintId))
        .filter(mow => Teams2Service.passesMowFilter(mow, filterCriteria))
        .toSorted((a, b) => {
            const powerA = Math.pow(a.primaryAbilityLevel ?? 0, 2) + Math.pow(a.secondaryAbilityLevel ?? 0, 2);
            const powerB = Math.pow(b.primaryAbilityLevel ?? 0, 2) + Math.pow(b.secondaryAbilityLevel ?? 0, 2);
            if (powerB !== powerA) return powerB - powerA;
            return b.rarity - a.rarity;
        })
        .map(a => Teams2Service.capMowAtRarity(a, rarityCap));

    // Campaign and Incursion are exclusive with the other modes and each other.
    const otherModeSelected = warOffense || warDefense || guildRaid || tournamentArena || hordeModeSelected;
    const campaignDisabled = (otherModeSelected || incursionSelected) && !campaignSelected;
    const incursionDisabled = (otherModeSelected || campaignSelected) && !incursionSelected;
    const exclusivityMessage = "Campaign and Incursion teams can't be combined with other modes.";

    return (
        <div className="relative isolate flex w-full flex-col rounded-xl border border-(--border) bg-(--overlay) shadow-2xl">
            {/* STATIC HEADER */}
            <div className="z-30 flex flex-shrink-0 items-center justify-between border-b border-(--border) bg-(--neutral) p-4">
                <div className="justify-left flex flex-wrap items-center gap-6">
                    <h3>Assemble Team</h3>
                    <RosterSnapshotsMagnificationSlider zoom={zoom} setZoom={setZoom} />
                    {/* RARITY CAP */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-(--soft-fg)">Rarity Cap</span>
                        <div className="min-w-[180px]">
                            <RaritySelect
                                rarityValues={[
                                    Rarity.Common,
                                    Rarity.Uncommon,
                                    Rarity.Rare,
                                    Rarity.Epic,
                                    Rarity.Legendary,
                                    Rarity.Mythic,
                                ]}
                                value={rarityCap}
                                valueChanges={onRarityCapChanged}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex-2"></div>
                <Button appearance="plain" size="square-petite" onPress={onCancel}>
                    <X data-slot="icon" />
                </Button>
            </div>

            <div className="flex flex-col gap-6 p-6">
                {/* UNIT FILTER SECTION */}
                <section className="rounded-lg border border-(--border) bg-(--card) shadow-inner">
                    <details className="group space-y-6 p-6">
                        <summary className="cursor-pointer list-none text-lg font-semibold outline-none focus:text-(--primary)">
                            <div className="flex items-center justify-between">
                                <span>Unit Filter</span>
                                <span className="transition group-open:rotate-180">▼</span>
                            </div>
                        </summary>
                        <UnitFilter
                            allowLockedUnits={allowLockedUnits}
                            searchText={searchText}
                            minRarity={minRarity}
                            maxRarity={maxRarity}
                            minRank={minRank}
                            maxRank={maxRank}
                            factions={factions}
                            allFactions={allFactions}
                            traits={traits}
                            allTraits={allTraits}
                            alliance={alliance}
                            attackType={attackType}
                            minHits={minHits}
                            maxHits={maxHits}
                            hitsOptions={hitsOptions}
                            movement={movement}
                            movementOptions={movementOptions}
                            minRange={minRange}
                            maxRange={maxRange}
                            rangeOptions={rangeOptions}
                            damageTypes={damageTypes}
                            damageTypesOptions={damageTypesOptions}
                            onAllowLockedUnitsChange={onAllowLockedUnitsChange}
                            onSearchTextChange={onSearchTextChange}
                            onMinRarityChange={onMinRarityChange}
                            onMaxRarityChange={onMaxRarityChange}
                            onMinRankChange={onMinRankChange}
                            onMaxRankChange={onMaxRankChange}
                            onFactionsChange={onFactionsChange}
                            onTraitsChange={onTraitsChange}
                            onAllianceChange={onAllianceChange}
                            onAttackTypeChange={onAttackTypeChange}
                            onMinHitsChange={onMinHitsChange}
                            onMaxHitsChange={onMaxHitsChange}
                            onMovementChange={onMovementChange}
                            onMinRangeChange={onMinRangeChange}
                            onMaxRangeChange={onMaxRangeChange}
                            onDamageTypesChange={onDamageTypesChange}
                        />
                    </details>
                </section>

                {/* TEAM DETAILS SECTION */}
                <section className="rounded-lg border border-(--border) bg-(--card) shadow-inner">
                    <details open className="group space-y-6 p-6">
                        <summary className="cursor-pointer list-none text-lg font-semibold outline-none focus:text-(--primary)">
                            <div className="flex items-center justify-between">
                                <span>Team Details</span>
                                <span className="transition group-open:rotate-180">▼</span>
                            </div>
                        </summary>
                        <div>
                            <div className="mb-2 flex items-end justify-between">
                                <label className="text-sm font-medium text-(--soft-fg)">Team Name</label>
                                {!saveAllowed && (
                                    <span className="text-xs text-(--danger) italic">{saveDisallowedMessage}</span>
                                )}
                            </div>
                            <input
                                type="text"
                                value={teamName}
                                onChange={event => onTeamNameChanged(event.target.value)}
                                placeholder="Enter team name..."
                                className="w-full rounded-lg border border-(--input-border) bg-(--bg) px-4 py-2 text-(--fg) transition-all outline-none focus:ring-2 focus:ring-(--ring)"
                            />
                        </div>

                        {/* min-h-16 reserves room for the absolutely-positioned "Usable:" hint below. */}
                        <div className="flex min-h-16 flex-wrap items-center gap-6">
                            <div className="flex flex-wrap items-center gap-6">
                                <label className="flex cursor-pointer items-center gap-2 text-(--soft-fg)">
                                    <AccessibleTooltip
                                        title={
                                            warDisallowedMessage ??
                                            ((campaignSelected || incursionSelected) && !warOffense
                                                ? exclusivityMessage
                                                : '')
                                        }>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={!warDisallowedMessage && warOffense}
                                                disabled={
                                                    !!warDisallowedMessage ||
                                                    ((campaignSelected || incursionSelected) && !warOffense)
                                                }
                                                onChange={() => onWarOffenseChanged(!warOffense)}
                                                className="h-4 w-4 rounded border-(--input-border) text-(--primary) focus:ring-(--ring) disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <span>War Offense</span>
                                        </div>
                                    </AccessibleTooltip>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-(--soft-fg)">
                                    <AccessibleTooltip
                                        title={
                                            warDisallowedMessage ??
                                            ((campaignSelected || incursionSelected) && !warDefense
                                                ? exclusivityMessage
                                                : '')
                                        }>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={!warDisallowedMessage && warDefense}
                                                disabled={
                                                    !!warDisallowedMessage ||
                                                    ((campaignSelected || incursionSelected) && !warDefense)
                                                }
                                                onChange={() => onWarDefenseChanged(!warDefense)}
                                                className="h-4 w-4 rounded border-(--input-border) text-(--primary) focus:ring-(--ring) disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <span>War Defense</span>
                                        </div>
                                    </AccessibleTooltip>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-(--soft-fg)">
                                    <AccessibleTooltip
                                        title={
                                            (campaignSelected || incursionSelected) && !guildRaid
                                                ? exclusivityMessage
                                                : ''
                                        }>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={guildRaid}
                                                disabled={(campaignSelected || incursionSelected) && !guildRaid}
                                                onChange={() => onGuildRaidChanged(!guildRaid)}
                                                className="h-4 w-4 rounded border-(--input-border) text-(--primary) focus:ring-(--ring) disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <span>Guild Raid</span>
                                        </div>
                                    </AccessibleTooltip>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-(--soft-fg)">
                                    <AccessibleTooltip
                                        title={
                                            tournamentArenaDisallowedMessage ??
                                            ((campaignSelected || incursionSelected) && !tournamentArena
                                                ? exclusivityMessage
                                                : '')
                                        }>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={!tournamentArenaDisallowedMessage && tournamentArena}
                                                disabled={
                                                    !!tournamentArenaDisallowedMessage ||
                                                    ((campaignSelected || incursionSelected) && !tournamentArena)
                                                }
                                                onChange={() => onTournamentArenaChanged(!tournamentArena)}
                                                className="h-4 w-4 rounded border-(--input-border) text-(--primary) focus:ring-(--ring) disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <span>Tournament Arena</span>
                                        </div>
                                    </AccessibleTooltip>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-(--soft-fg)">
                                    <AccessibleTooltip
                                        title={
                                            (campaignSelected || incursionSelected) && !hordeModeSelected
                                                ? exclusivityMessage
                                                : ''
                                        }>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={hordeModeSelected}
                                                disabled={(campaignSelected || incursionSelected) && !hordeModeSelected}
                                                onChange={() => onHordeModeChanged(!hordeModeSelected)}
                                                className="h-4 w-4 rounded border-(--input-border) text-(--primary) focus:ring-(--ring) disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <span>Horde Mode</span>
                                        </div>
                                    </AccessibleTooltip>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-(--soft-fg)">
                                    <AccessibleTooltip title={campaignDisabled ? exclusivityMessage : ''}>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={campaignSelected}
                                                disabled={campaignDisabled}
                                                onChange={() => onCampaignChanged(!campaignSelected)}
                                                className="h-4 w-4 rounded border-(--input-border) text-(--primary) focus:ring-(--ring) disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <span>Campaign</span>
                                        </div>
                                    </AccessibleTooltip>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-(--soft-fg)">
                                    <AccessibleTooltip title={incursionDisabled ? exclusivityMessage : ''}>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={incursionSelected}
                                                disabled={incursionDisabled}
                                                onChange={() => onIncursionChanged(!incursionSelected)}
                                                className="h-4 w-4 rounded border-(--input-border) text-(--primary) focus:ring-(--ring) disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <span>Incursion</span>
                                        </div>
                                    </AccessibleTooltip>
                                </label>
                            </div>
                            {campaignSelected && (
                                // Fixed width (not min-w) and relative (for the absolute hint below)
                                // keep this column from reflowing the row as its value changes.
                                <div className="relative w-64 shrink-0">
                                    <Select<string | undefined>
                                        options={[undefined, ...campaignStorylineOptions.map(option => option.value)]}
                                        value={campaignStoryline}
                                        onChange={onCampaignStorylineChanged}
                                        renderOption={value =>
                                            value ? (
                                                <div className="flex items-center gap-2">
                                                    {!!campaignStorylineIcon(value) && (
                                                        <CampaignImage
                                                            campaign={campaignStorylineIcon(value)!}
                                                            size={24}
                                                            showTooltip={false}
                                                        />
                                                    )}
                                                    <span>{campaignStorylineLabel(value)}</span>
                                                </div>
                                            ) : (
                                                'None'
                                            )
                                        }
                                        placeholder="Select a campaign..."
                                    />
                                    {campaignStoryline && (
                                        // absolute: keeps this line out of flow so it can't reflow the row.
                                        <p className="absolute top-full left-0 mt-1 text-xs text-(--soft-fg)">
                                            Usable: {campaignStorylineUsableFactions(campaignStoryline) ?? 'unknown'}
                                        </p>
                                    )}
                                </div>
                            )}
                            {incursionSelected && (
                                <div className="relative w-64 shrink-0">
                                    <SelectMulti<string>
                                        options={incursionMowOptions.map(m => m.snowprintId)}
                                        value={incursionMows}
                                        onChange={onIncursionMowsChanged}
                                        placeholder="Select MoWs..."
                                        renderOption={id => {
                                            const mow = mows.find(m => m.snowprintId === id);
                                            return mow ? (
                                                <div className="flex items-center gap-2">
                                                    <UnitShardIcon icon={mow.roundIcon} height={24} />
                                                    <span>{mow.name}</span>
                                                </div>
                                            ) : (
                                                id
                                            );
                                        }}
                                        renderValue={selected => (
                                            <div className="flex flex-wrap items-center gap-1">
                                                {selected.map(id => {
                                                    const mow = mows.find(m => m.snowprintId === id);
                                                    return mow ? (
                                                        <UnitShardIcon key={id} icon={mow.roundIcon} height={18} />
                                                    ) : undefined;
                                                })}
                                            </div>
                                        )}
                                    />
                                    {incursionAlliances.length > 0 && (
                                        <p className="absolute top-full left-0 mt-1 text-xs text-(--soft-fg)">
                                            Usable: {incursionAlliances.join(', ')} alliance
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-(--soft-fg)">Notes</label>
                            <textarea
                                placeholder="Add notes..."
                                value={notes}
                                onChange={event => onNotesChanged(event.target.value)}
                                className="min-h-[80px] w-full rounded-lg border border-(--input-border) bg-(--bg) px-4 py-2 text-(--fg) transition-all outline-none focus:ring-2 focus:ring-(--ring)"
                            />
                        </div>
                    </details>

                    <div className="flex items-center justify-between border-t border-(--border) bg-(--neutral) p-4">
                        <h3 className="text-sm font-bold tracking-widest text-(--primary) uppercase">Selected Team</h3>
                        <div className="flex items-center gap-3">
                            <Button intent="success" isDisabled={!saveAllowed} onPress={onSave}>
                                Save Team
                            </Button>
                        </div>
                    </div>

                    <div className="p-4">
                        <TeamFlow
                            chars={(
                                selectedChars
                                    .map(x => chars.find(char => (char.snowprintId ?? '') === x))
                                    .filter(x => x !== undefined) ?? []
                            ).map(char => Teams2Service.capCharacterAtRarity(char!, rarityCap))}
                            mows={
                                campaignSelected
                                    ? []
                                    : (
                                          selectedMows
                                              .map(id => mows.find(mow => (mow.snowprintId ?? '') === id))
                                              .filter(x => x !== undefined) ?? []
                                      ).map(mow => Teams2Service.capMowAtRarity(mow!, rarityCap))
                            }
                            flexIndex={flexIndex}
                            onCharClicked={onCharClicked}
                            onMowClicked={onMowClicked}
                            zoom={zoom}
                        />
                    </div>
                </section>

                {/* GRIDS SECTION */}
                <div
                    className={`flex min-h-0 flex-col gap-4 xl:flex-row-reverse xl:flex-nowrap ${
                        isDragging ? 'select-none' : ''
                    }`}
                    style={{ '--mow-width': `${mowWidth}px` } as React.CSSProperties}>
                    <div className="min-w-0 flex-1 rounded-lg border border-(--card-border) bg-(--card) p-4">
                        <CharacterSelectGrid
                            characters={filteredChars}
                            onCharacterSelect={onAddChar}
                            showHeader={true}
                            zoom={zoom}
                            deployedUnitIds={deployedCharIds}
                        />
                    </div>

                    {!campaignSelected && !incursionSelected && (
                        <>
                            <div
                                onMouseDown={startResizing}
                                className={`relative z-10 hidden w-4 flex-shrink-0 cursor-col-resize xl:flex ${isDragging ? 'bg-(--primary)/10' : 'hover:bg-(--primary)/5'} group transition-colors`}>
                                <div
                                    className={`mx-auto h-full w-[1px] ${isDragging ? 'bg-blue-500' : 'bg-(--border) group-hover:bg-blue-400'}`}
                                />
                                <div className="pointer-events-none absolute top-24 left-1/2 flex -translate-x-1/2 justify-center">
                                    <div
                                        className={`pointer-events-auto flex h-16 w-6 flex-col items-center justify-center gap-1 rounded-l-md border-y border-l shadow-md transition-all duration-200 ${
                                            isDragging
                                                ? 'border-blue-600 bg-blue-500'
                                                : 'border-(--card-border) bg-(--card) group-hover:border-blue-500'
                                        }`}>
                                        <div
                                            className={`h-[1px] w-3 ${isDragging ? 'bg-blue-100' : 'bg-(--border)'}`}
                                        />
                                        <div
                                            className={`h-[1px] w-3 ${isDragging ? 'bg-blue-100' : 'bg-(--border)'}`}
                                        />
                                        <div
                                            className={`h-[1px] w-3 ${isDragging ? 'bg-blue-100' : 'bg-(--border)'}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="w-full flex-shrink-0 rounded-lg border border-(--card-border) bg-(--card) p-4 xl:w-[var(--mow-width)]">
                                <MowSelectGrid
                                    mows={filteredMows}
                                    onMowSelect={onAddMow}
                                    showHeader={true}
                                    zoom={zoom}
                                    deployedUnitIds={deployedMowIds}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
