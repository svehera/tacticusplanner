/* eslint-disable import-x/no-internal-modules */
import { useState } from 'react';

import { Alliance, RarityMapper, RarityString } from '@/fsd/5-shared/model';
import { Accordion, AccordionBody, AccordionHeader } from '@/fsd/5-shared/ui';
import { MiscIcon, OrbIcon } from '@/fsd/5-shared/ui/icons';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/icon-list';

import type { IProductCalendar, IProductCalendarOffer } from '@/fsd/4-entities/calendars';

import {
    calendarDisplayName,
    equipmentItemRarity,
    formatPrice,
    offersForDayByTitle,
    RARITY_LETTER_MAP,
    titlesInOrder,
    upgradeMaterialRarity,
} from './product-calendar.models';

const ICON_SIZE = 32;

// Sorted descending by filename (YYYY_MM suffix) = reverse chronological.
const calendarModules = import.meta.glob<{ default: IProductCalendar }>('../../4-entities/calendars/data/*.json', {
    eager: true,
});
const ALL_CALENDARS: IProductCalendar[] = Object.entries(calendarModules)
    .toSorted(([pathA], [pathB]) => pathB.localeCompare(pathA))
    .map(([, module_]) => module_.default as unknown as IProductCalendar);

function UnknownItemIcon({ rarity, size = ICON_SIZE }: { rarity: string; size?: number }) {
    const isRelic = rarity === 'Relic';
    const baseFrameKey = `${isRelic ? 'mythic' : rarity.toLowerCase()}EquipmentFrame` as keyof typeof tacticusIcons;
    const baseFrame = tacticusIcons[baseFrameKey];
    const relicFrame = isRelic ? tacticusIcons.relicEquipmentFrame : undefined;
    const item = tacticusIcons.itemUnknown;
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <img
                src={item?.file}
                alt=""
                className="pointer-events-none absolute inset-0 m-auto object-contain"
                style={{ width: size * 0.7, height: size * 0.7 }}
            />
            {baseFrame && (
                <img
                    src={baseFrame.file}
                    alt=""
                    className="pointer-events-none absolute inset-0 m-auto object-contain"
                    style={{ width: size, height: size }}
                />
            )}
            {relicFrame && (
                <img
                    src={relicFrame.file}
                    alt=""
                    className="pointer-events-none absolute inset-0 m-auto object-contain"
                    style={{ width: size, height: size }}
                />
            )}
        </div>
    );
}

function calendarRewardInfo(reward: string): { icon: React.ReactNode; label: string; qty: number | undefined } {
    const colonIndex = reward.indexOf(':');
    const type = colonIndex === -1 ? reward : reward.slice(0, colonIndex);
    const qtyString = colonIndex === -1 ? undefined : reward.slice(colonIndex + 1);
    const qty = qtyString === undefined ? undefined : Number.parseInt(qtyString, 10);

    if (type === 'gold')
        return { icon: <MiscIcon icon="coin" width={ICON_SIZE} height={ICON_SIZE} />, label: 'Gold', qty };
    if (type === 'dust')
        return { icon: <MiscIcon icon="salvage" width={ICON_SIZE} height={ICON_SIZE} />, label: 'Salvage', qty };
    if (type === 'mythicDust')
        return {
            icon: <MiscIcon icon="mythicSalvage" width={ICON_SIZE} height={ICON_SIZE} />,
            label: 'Mythic Salvage',
            qty,
        };
    if (type === 'summoningToken')
        return { icon: <MiscIcon icon="reqOrder" width={ICON_SIZE} height={ICON_SIZE} />, label: 'Req Scroll', qty };
    if (type === 'specialSummoningToken')
        return {
            icon: <MiscIcon icon="blessedReqOrder" width={ICON_SIZE} height={ICON_SIZE} />,
            label: 'Blessed Req Scroll',
            qty,
        };
    if (type === 'stamina')
        return { icon: <MiscIcon icon="stamina" width={ICON_SIZE} height={ICON_SIZE} />, label: 'Energy', qty };
    if (type === 'stamina_treasureBeach')
        return {
            icon: <MiscIcon icon="salvageRunToken" width={ICON_SIZE} height={ICON_SIZE} />,
            label: 'Salvage Run Tokens',
            qty,
        };
    if (type === 'gems')
        return { icon: <MiscIcon icon="blackstone" width={ICON_SIZE} height={ICON_SIZE} />, label: 'Blackstone', qty };
    if (type === 'raidTicket')
        return { icon: <MiscIcon icon="raidTicket" width={ICON_SIZE} height={ICON_SIZE} />, label: 'Raid Ticket', qty };

    if (type === 'xpEpic')
        return {
            icon: <MiscIcon icon="epicBook" width={ICON_SIZE} height={ICON_SIZE} />,
            label: 'XP Book (Epic)',
            qty,
        };
    if (type === 'xpLegendary')
        return {
            icon: <MiscIcon icon="legendaryBook" width={ICON_SIZE} height={ICON_SIZE} />,
            label: 'XP Book (Legendary)',
            qty,
        };
    if (type === 'xpMythic')
        return {
            icon: <MiscIcon icon="mythicBook" width={ICON_SIZE} height={ICON_SIZE} />,
            label: 'XP Book (Mythic)',
            qty,
        };

    if (type === 'ShardsImperial')
        return {
            icon: <MiscIcon icon="allianceImperial" width={ICON_SIZE} height={ICON_SIZE} />,
            label: 'Imperial Shards',
            qty,
        };
    if (type === 'ShardsChaos')
        return {
            icon: <MiscIcon icon="allianceChaos" width={ICON_SIZE} height={ICON_SIZE} />,
            label: 'Chaos Shards',
            qty,
        };
    if (type === 'ShardsXenos')
        return {
            icon: <MiscIcon icon="allianceXenos" width={ICON_SIZE} height={ICON_SIZE} />,
            label: 'Xenos Shards',
            qty,
        };
    if (type.startsWith('Shards'))
        return { icon: <MiscIcon icon="shard" width={ICON_SIZE} height={ICON_SIZE} />, label: 'Shards', qty };

    const draftBadgeMatch = type.match(/^draft_abilityTokens(Common|Uncommon|Rare|Epic|Legendary|Mythic)$/);
    if (draftBadgeMatch) {
        const rarity = draftBadgeMatch[1] as RarityString;
        const iconKey = `draftAbilityBadges${rarity}` as
            | 'draftAbilityBadgesCommon'
            | 'draftAbilityBadgesUncommon'
            | 'draftAbilityBadgesRare'
            | 'draftAbilityBadgesEpic'
            | 'draftAbilityBadgesLegendary'
            | 'draftAbilityBadgesMythic';
        return {
            icon: <MiscIcon icon={iconKey} width={ICON_SIZE} height={ICON_SIZE} />,
            label: `${rarity} Badge (Pick One)`,
            qty,
        };
    }

    const badgeMatch = type.match(/^abilityTokens(Common|Uncommon|Rare|Epic|Legendary|Mythic)$/);
    if (badgeMatch) {
        const rarity = badgeMatch[1] as RarityString;
        const iconKey = `draftAbilityBadges${rarity}` as
            | 'draftAbilityBadgesCommon'
            | 'draftAbilityBadgesUncommon'
            | 'draftAbilityBadgesRare'
            | 'draftAbilityBadgesEpic'
            | 'draftAbilityBadgesLegendary'
            | 'draftAbilityBadgesMythic';
        return {
            icon: <MiscIcon icon={iconKey} width={ICON_SIZE} height={ICON_SIZE} />,
            label: `${rarity} Badge`,
            qty,
        };
    }

    const draftOrbMatch = type.match(/^draft_ascensionOrbs(Uncommon|Rare|Epic|Legendary|Mythic)$/);
    if (draftOrbMatch) {
        const rarity = draftOrbMatch[1] as RarityString;
        const iconKey = `draftOrbs${rarity}` as
            | 'draftOrbsUncommon'
            | 'draftOrbsRare'
            | 'draftOrbsEpic'
            | 'draftOrbsLegendary'
            | 'draftOrbsMythic';
        return {
            icon: <MiscIcon icon={iconKey} width={ICON_SIZE} height={ICON_SIZE} />,
            label: `${rarity} Orb (Pick One)`,
            qty,
        };
    }

    const orbMatch = type.match(/^ascensionOrbs(Uncommon|Rare|Epic|Legendary|Mythic)$/);
    if (orbMatch) {
        const rarityNumber = RarityMapper.stringToNumber[orbMatch[1] as RarityString];
        return {
            icon: <OrbIcon alliance={Alliance.Imperial} rarity={rarityNumber} size={ICON_SIZE} />,
            label: `${orbMatch[1]} Orb`,
            qty,
        };
    }

    const itemsMatch = type.match(/^items(Common|Uncommon|Rare|Epic|Legendary|Mythic)$/);
    if (itemsMatch) {
        return {
            icon: <UnknownItemIcon rarity={itemsMatch[1]} />,
            label: `${itemsMatch[1]} Items`,
            qty,
        };
    }

    if (type === 'draft_machinesOfWarTokens')
        return {
            icon: <MiscIcon icon="draftMachinesOfWarComponents" width={ICON_SIZE} height={ICON_SIZE} />,
            label: 'MoW Component (Pick One)',
            qty,
        };

    if (type === 'xpRare')
        return {
            icon: <MiscIcon icon="rareBook" width={ICON_SIZE} height={ICON_SIZE} />,
            label: 'XP Book (Rare)',
            qty,
        };

    if (type === 'stamina_waves')
        return {
            icon: <MiscIcon icon="defeatWaves" width={ICON_SIZE} height={ICON_SIZE} />,
            label: 'Waves Stamina',
            qty,
        };

    if (type === 'machinesOfWarAmmo')
        return { icon: <MiscIcon icon="mow" width={ICON_SIZE} height={ICON_SIZE} />, label: 'MoW Ammo', qty };

    if (type === 'seasonalEventCurrencyJune2026')
        return {
            icon: <MiscIcon icon="armageddonCurrency" width={ICON_SIZE} height={ICON_SIZE} />,
            label: 'Event Currency',
            qty,
        };

    const heroOrbMatch = type.match(/^heroAscensionOrb(Uncommon|Rare|Epic|Legendary|Mythic)_(Imperial|Chaos|Xenos)$/);
    if (heroOrbMatch) {
        const rarityNumber = RarityMapper.stringToNumber[heroOrbMatch[1] as RarityString];
        const alliance =
            heroOrbMatch[2] === 'Imperial'
                ? Alliance.Imperial
                : heroOrbMatch[2] === 'Chaos'
                  ? Alliance.Chaos
                  : Alliance.Xenos;
        return {
            icon: <OrbIcon alliance={alliance} rarity={rarityNumber} size={ICON_SIZE} />,
            label: `${heroOrbMatch[1]} Orb`,
            qty,
        };
    }

    const mowTokenMatch = type.match(/^machinesOfWarToken_(Imperial|Chaos|Xenos)$/);
    if (mowTokenMatch)
        return {
            icon: <MiscIcon icon="mow" width={ICON_SIZE} height={ICON_SIZE} />,
            label: `MoW Token (${mowTokenMatch[1]})`,
            qty,
        };

    const allianceBadgeMatch = type.match(
        /^abilityTokens?(Common|Uncommon|Rare|Epic|Legendary|Mythic)_(Imperial|Chaos|Xenos)$/
    );
    if (allianceBadgeMatch) {
        const rarity = allianceBadgeMatch[1] as RarityString;
        const iconKey = `draftAbilityBadges${rarity}` as
            | 'draftAbilityBadgesCommon'
            | 'draftAbilityBadgesUncommon'
            | 'draftAbilityBadgesRare'
            | 'draftAbilityBadgesEpic'
            | 'draftAbilityBadgesLegendary'
            | 'draftAbilityBadgesMythic';
        return {
            icon: <MiscIcon icon={iconKey} width={ICON_SIZE} height={ICON_SIZE} />,
            label: `${rarity} Badge`,
            qty,
        };
    }

    const upgradesMatch = type.match(/^upgrades(Common|Uncommon|Rare|Epic|Legendary|Mythic)$/);
    if (upgradesMatch)
        return { icon: <UnknownItemIcon rarity={upgradesMatch[1]} />, label: `${upgradesMatch[1]} Upgrades`, qty };

    const ascensionResourceMatch = type.match(/^itemAscensionResource_(Uncommon|Rare|Epic|Legendary|Mythic)$/);
    if (ascensionResourceMatch) {
        const rarityNumber = RarityMapper.stringToNumber[ascensionResourceMatch[1] as RarityString];
        return {
            icon: <OrbIcon alliance={Alliance.Imperial} rarity={rarityNumber} size={ICON_SIZE} />,
            label: `${ascensionResourceMatch[1]} Ascension Resource`,
            qty,
        };
    }

    if (type.startsWith('R_')) return { icon: <UnknownItemIcon rarity="Relic" />, label: 'Relic Item', qty };

    const equipRarity = equipmentItemRarity(type);
    if (equipRarity !== undefined)
        return { icon: <UnknownItemIcon rarity={equipRarity} />, label: `${equipRarity} Item`, qty };

    const upgRarity = upgradeMaterialRarity(type);
    if (upgRarity !== undefined)
        return { icon: <UnknownItemIcon rarity={upgRarity} />, label: `${upgRarity} Upgrade`, qty };

    if (type.startsWith('upg')) {
        const letter = type.replace(/^upg[A-Za-z]+/, '')[0] ?? '';
        const rarity = RARITY_LETTER_MAP[letter];
        if (rarity) return { icon: <UnknownItemIcon rarity={rarity} />, label: `${rarity} Upgrade`, qty };
    }

    return {
        icon: <span className="text-xs break-all text-(--soft-fg)">{type}</span>,
        label: type,
        qty,
    };
}

function RewardRow({ reward }: { reward: string }) {
    const { icon, label, qty } = calendarRewardInfo(reward);
    return (
        <div className="flex items-center gap-2 py-0.5">
            <div className="flex size-8 shrink-0 items-center justify-center">{icon}</div>
            <span className="text-sm text-(--fg)">
                {qty !== undefined && <span className="mr-1 font-semibold">×{qty.toLocaleString()}</span>}
                {label}
            </span>
        </div>
    );
}

interface OfferCardProps {
    title: string;
    banner: string;
    offers: IProductCalendarOffer[];
    selectedVariant: string | undefined;
    onSelect: (variant: string | undefined) => void;
}

function OfferCard({ title, banner, offers, selectedVariant, onSelect }: OfferCardProps) {
    function handleClick(variant: string) {
        onSelect(selectedVariant === variant ? undefined : variant);
    }

    return (
        <div className="flex max-w-[220px] min-w-[180px] shrink-0 flex-col overflow-hidden rounded-lg border border-(--card-border) bg-(--bg)">
            <div className="bg-(--primary) px-3 py-1.5 text-(--primary-fg)">
                <div className="truncate text-xs font-medium opacity-80">{banner}</div>
                <div className="text-sm leading-tight font-bold">{title}</div>
            </div>

            <div className="flex flex-col divide-y divide-(--border)">
                {offers.map(offer => {
                    const isSelected = selectedVariant === offer.variant;
                    return (
                        <div key={offer.variant}>
                            <button
                                type="button"
                                onClick={() => handleClick(offer.variant)}
                                className={[
                                    'flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left transition-colors',
                                    'hover:bg-(--primary)/10',
                                    isSelected ? 'bg-(--primary)/10' : '',
                                ].join(' ')}>
                                <span className="text-xs text-(--soft-fg)">({offer.variant})</span>
                                <span
                                    className={`text-sm font-medium ${offer.free ? 'text-green-500' : 'text-(--fg)'}`}>
                                    {formatPrice(offer.priceCents, offer.free)}
                                </span>
                            </button>
                            {isSelected && (
                                <div className="border-t border-(--border) bg-(--soft) px-3 py-2">
                                    <div className="mb-1 text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                                        Contents
                                    </div>
                                    {offer.rewards.map((reward, index) => (
                                        <RewardRow key={index} reward={reward} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface DaySectionProps {
    calDay: IProductCalendar['days'][number];
    allTitles: string[];
    selectedVariant: string | undefined;
    onSelect: (variant: string | undefined) => void;
}

function DaySection({ calDay, allTitles, selectedVariant, onSelect }: DaySectionProps) {
    const byTitle = offersForDayByTitle(calDay);

    return (
        <Accordion>
            <AccordionHeader>
                <span className="font-semibold text-(--fg)">Day {calDay.day}</span>
            </AccordionHeader>
            <AccordionBody className="overflow-x-auto p-3">
                <div className="flex gap-3 pb-1">
                    {allTitles.map(title => {
                        const offers = byTitle.get(title);
                        if (!offers) return;
                        return (
                            <OfferCard
                                key={title}
                                title={title}
                                banner={offers[0]?.banner ?? ''}
                                offers={offers}
                                selectedVariant={selectedVariant}
                                onSelect={onSelect}
                            />
                        );
                    })}
                </div>
            </AccordionBody>
        </Accordion>
    );
}

interface CalendarSectionProps {
    calendar: IProductCalendar;
    selectedVariant: string | undefined;
    onSelect: (variant: string | undefined) => void;
}

function CalendarSection({ calendar, selectedVariant, onSelect }: CalendarSectionProps) {
    const allTitles = titlesInOrder(calendar);
    const displayName = calendarDisplayName(calendar.calendar);

    return (
        <Accordion>
            <AccordionHeader>
                <div>
                    <div className="font-semibold text-(--fg)">{displayName}</div>
                    <div className="text-xs text-(--soft-fg)">
                        {calendar.days.length} days · {allTitles.length} offer types
                    </div>
                </div>
            </AccordionHeader>
            <AccordionBody className="space-y-2 p-3">
                {calendar.days.map(calDay => (
                    <DaySection
                        key={calDay.day}
                        calDay={calDay}
                        allTitles={allTitles}
                        selectedVariant={selectedVariant}
                        onSelect={onSelect}
                    />
                ))}
            </AccordionBody>
        </Accordion>
    );
}

export function ProductCalendar() {
    const [selectedVariant, setSelectedVariant] = useState<string | undefined>();

    return (
        <div className="space-y-4 py-6">
            <h1 className="text-2xl font-bold text-(--fg)">Product Calendar</h1>
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                Many of these offers are targeted and you will only see one on any given day. Snowprint does not
                disclose how their targeting works, so we cannot tell you which offer you will see.
            </p>
            {ALL_CALENDARS.map(calendar => (
                <CalendarSection
                    key={calendar.calendar}
                    calendar={calendar}
                    selectedVariant={selectedVariant}
                    onSelect={setSelectedVariant}
                />
            ))}
        </div>
    );
}
