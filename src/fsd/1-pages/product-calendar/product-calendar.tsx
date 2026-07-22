/* eslint-disable import-x/no-internal-modules */
import { useState } from 'react';

import { getImageUrl } from '@/shared-logic/functions';

import { Accordion, AccordionBody, AccordionHeader } from '@/fsd/5-shared/ui';
import { Button } from '@/fsd/5-shared/ui/button';
import { MiscIcon, OrbIcon } from '@/fsd/5-shared/ui/icons';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/icon-list';

import type { IProductCalendar, IProductCalendarOffer } from '@/fsd/4-entities/calendars';

import {
    calendarDisplayName,
    calendarRewardInfo,
    formatPrice,
    offersForDayByTitle,
    titlesInOrder,
    type CalendarRewardIcon,
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

function UnknownUpgradeMaterialIcon({ rarity, size = ICON_SIZE }: { rarity: string; size?: number }) {
    const icon = tacticusIcons[`upgrade${rarity}` as keyof typeof tacticusIcons];
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <img
                src={icon?.file}
                alt=""
                className="pointer-events-none absolute inset-0 m-auto object-contain"
                style={{ width: size * 0.7, height: size * 0.7 }}
            />
        </div>
    );
}

function EquipmentIcon({ rarity, icon, size = ICON_SIZE }: { rarity: string; icon: string; size?: number }) {
    const isRelic = rarity === 'Relic';
    const baseFrameKey = `${isRelic ? 'mythic' : rarity.toLowerCase()}EquipmentFrame` as keyof typeof tacticusIcons;
    const baseFrame = tacticusIcons[baseFrameKey];
    const relicFrame = isRelic ? tacticusIcons.relicEquipmentFrame : undefined;
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <img
                src={getImageUrl(icon)}
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

function renderRewardIcon(icon: CalendarRewardIcon): React.ReactNode {
    switch (icon.kind) {
        case 'misc': {
            return <MiscIcon icon={icon.icon} width={ICON_SIZE} height={ICON_SIZE} />;
        }
        case 'equipment': {
            return <EquipmentIcon rarity={icon.rarity} icon={icon.icon} size={ICON_SIZE} />;
        }
        case 'orb': {
            return <OrbIcon alliance={icon.alliance} rarity={icon.rarity} size={ICON_SIZE} />;
        }
        case 'xpBook': {
            const xpBookIconKey = `${icon.rarity.toLowerCase()}Book` as keyof typeof tacticusIcons;
            const xpBookIcon = tacticusIcons[xpBookIconKey];
            if (!xpBookIcon) {
                return <UnknownItemIcon rarity={icon.rarity} />;
            }
            return (
                <div className="relative shrink-0" style={{ width: ICON_SIZE, height: ICON_SIZE }}>
                    <img
                        src={xpBookIcon.file}
                        alt=""
                        className="pointer-events-none absolute inset-0 m-auto object-contain"
                        style={{ width: ICON_SIZE * 0.7, height: ICON_SIZE * 0.7 }}
                    />
                </div>
            );
        }
        case 'unknownItem': {
            return <UnknownItemIcon rarity={icon.rarity} />;
        }
        case 'unknownUpgradeMaterial': {
            return <UnknownUpgradeMaterialIcon rarity={icon.rarity} size={50} />;
        }
        case 'text': {
            return <span className="text-xs break-all text-(--soft-fg)">{icon.text}</span>;
        }
        case 'avatarText': {
            return <span className="text-xs text-(--soft-fg)">{icon.text}</span>;
        }
    }
}

function RewardRow({ reward }: { reward: string }) {
    const { icon, label, qty } = calendarRewardInfo(reward);
    return (
        <div className="flex items-center gap-2 py-0.5">
            <div className="flex size-8 shrink-0 items-center justify-center">{renderRewardIcon(icon)}</div>
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
                            <Button
                                appearance="unstyled"
                                size="unstyled"
                                onPress={() => handleClick(offer.variant)}
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
                            </Button>
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
