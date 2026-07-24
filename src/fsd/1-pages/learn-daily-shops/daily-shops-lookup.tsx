/* eslint-disable import-x/no-internal-modules */
import { FC, useContext, useMemo, useState } from 'react';

import { StoreContext } from '@/reducers/store.provider';

import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';
import { Modal } from '@/fsd/5-shared/ui/modal';

import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';
import {
    computeShopLockContext,
    crusadeShopData,
    getShopCurrencyIconKey,
    guildShopData,
    ResolvedShopItem,
    ResolvedShopSlot,
    resolveShopSlotsPermissive,
    RogueTraderService,
    ShopData,
    ShopDayOfWeek,
    ShopLockContext,
    todayDow,
    warShopData,
} from '@/fsd/4-entities/shops';

import { rewardInfo, summarizeSlotItems } from '@/fsd/3-features/shop-rewards';

const DAYS: ShopDayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_LABELS: Record<ShopDayOfWeek, string> = {
    MON: 'Monday',
    TUE: 'Tuesday',
    WED: 'Wednesday',
    THU: 'Thursday',
    FRI: 'Friday',
    SAT: 'Saturday',
    SUN: 'Sunday',
};

const SHOP_TAB_IDS = ['guild', 'war', 'crusade', 'rogueTrader'] as const;
type ShopTabId = (typeof SHOP_TAB_IDS)[number];

const TAB_LABELS: Record<ShopTabId, string> = {
    guild: 'Guild Shop',
    war: 'War Shop',
    crusade: 'Crusade Shop',
    rogueTrader: 'Rogue Trader',
};

const CURRENCY_TYPE_BY_TAB: Record<ShopTabId, string> = {
    guild: 'guildCredits',
    war: 'guildWarCurrency',
    crusade: 'crusadeCurrency',
    rogueTrader: 'elderShopCurrency',
};

const GUILD_SHOP_DATA = guildShopData as unknown as ShopData;
const WAR_SHOP_DATA = warShopData as unknown as ShopData;
const CRUSADE_SHOP_DATA = crusadeShopData as unknown as ShopData;

const SLOT_RESOLVERS: Record<
    ShopTabId,
    (day: ShopDayOfWeek, pl: number, context: ShopLockContext) => ResolvedShopSlot[]
> = {
    guild: (day, pl, context) => resolveShopSlotsPermissive(GUILD_SHOP_DATA, day, pl, context),
    war: (day, pl, context) => resolveShopSlotsPermissive(WAR_SHOP_DATA, day, pl, context),
    crusade: (day, pl, context) => resolveShopSlotsPermissive(CRUSADE_SHOP_DATA, day, pl, context),
    rogueTrader: (day, pl, context) => RogueTraderService.resolveFullShopForDay(day, pl, context),
};

const MAX_INLINE_ITEMS = 5;

const TabBar: FC<{ active: ShopTabId; onChange: (tab: ShopTabId) => void }> = ({ active, onChange }) => (
    <div className="flex flex-wrap gap-1 border-b border-(--border)">
        {SHOP_TAB_IDS.map(id => (
            <button
                key={id}
                type="button"
                onClick={() => onChange(id)}
                className={[
                    'px-4 py-2 text-sm font-medium transition-colors',
                    active === id
                        ? 'border-b-2 border-(--primary) text-(--primary)'
                        : 'text-(--soft-fg) hover:text-(--fg)',
                ].join(' ')}>
                {TAB_LABELS[id]}
            </button>
        ))}
    </div>
);

const ShopItemCard: FC<{ item: ResolvedShopItem; currencyType: string }> = ({ item, currencyType }) => {
    const { icon, label } = rewardInfo(`${item.rewardType}:${item.rewardQty}`);
    const currencyIconKey = getShopCurrencyIconKey(currencyType);
    const availableText =
        item.maxPerDay === 1 ? `1×${item.rewardQty} available` : `Up to ${item.maxPerDay}×${item.rewardQty} available`;
    const freeOffer = item.freeOfferType ? rewardInfo(`${item.freeOfferType}:1`) : undefined;

    return (
        <div className="flex flex-col rounded-lg border border-(--card-border) bg-(--card) p-3 text-(--card-fg) shadow-lg">
            <div className="flex w-full flex-row items-start gap-2">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center">{icon}</div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-1">
                        <h4 className="truncate text-xs font-normal">{label}</h4>
                        {!item.isGuaranteed && (
                            <AccessibleTooltip title="May or may not appear on this day — this slot is random">
                                <MiscIcon icon="chance" className="shrink-0" height={13} width={13} />
                            </AccessibleTooltip>
                        )}
                    </div>
                    <p className="text-xs text-(--soft-fg)">
                        {availableText}
                        <br />
                        {currencyIconKey && (
                            <MiscIcon icon={currencyIconKey} className="inline-block" height={14} width={14} />
                        )}{' '}
                        {item.costAmount.toLocaleString()} each
                    </p>
                    {freeOffer && <p className="text-xs text-(--soft-fg)">+ free {freeOffer.label}</p>}
                </div>
            </div>
        </div>
    );
};

const ShopSlotCard: FC<{ slot: ResolvedShopSlot; currencyType: string }> = ({ slot, currencyType }) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { items } = slot;

    if (items.length === 1) {
        return <ShopItemCard item={items[0]} currencyType={currencyType} />;
    }

    const currencyIconKey = getShopCurrencyIconKey(currencyType);
    const uniformCost = items.every(item => item.costAmount === items[0].costAmount);
    const summary = items.length > MAX_INLINE_ITEMS ? summarizeSlotItems(items) : undefined;

    return (
        <>
            <div
                role="button"
                tabIndex={0}
                onClick={() => setDialogOpen(true)}
                onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setDialogOpen(true);
                    }
                }}
                className="flex cursor-pointer flex-col gap-2 rounded-lg border border-(--card-border) bg-(--card) p-3 text-(--card-fg) shadow-lg transition-transform hover:scale-[1.02] hover:border-(--primary)">
                <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                        {items.length} possible rewards
                    </p>
                    <AccessibleTooltip title="May or may not appear on this day — this slot is random">
                        <MiscIcon icon="chance" className="shrink-0" height={13} width={13} />
                    </AccessibleTooltip>
                </div>
                {summary ? (
                    <div className="flex flex-row items-start gap-2">
                        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center">{summary.icon}</div>
                        <h4 className="min-w-0 flex-1 text-xs font-normal">{summary.label}</h4>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {items.map(item => {
                            const { icon, label } = rewardInfo(`${item.rewardType}:${item.rewardQty}`, 24);
                            return (
                                <div key={item.rewardType} className="flex items-center gap-1.5">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center">{icon}</div>
                                    <span className="truncate text-xs">{label}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
                <p className="text-xs text-(--soft-fg)">
                    {currencyIconKey && (
                        <MiscIcon icon={currencyIconKey} className="inline-block" height={14} width={14} />
                    )}{' '}
                    {uniformCost ? `${items[0].costAmount.toLocaleString()} each` : 'cost varies'}
                </p>
            </div>

            <Modal
                isOpen={dialogOpen}
                onOpenChange={open => {
                    if (!open) setDialogOpen(false);
                }}>
                <Modal.Content size="md">
                    <Modal.Header>
                        <Modal.Title>{items.length} possible rewards</Modal.Title>
                        <Modal.Description>Only one of these will actually be offered on this day.</Modal.Description>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="flex flex-col gap-2 py-2">
                            {items.map(item => (
                                <ShopItemCard key={item.rewardType} item={item} currencyType={currencyType} />
                            ))}
                        </div>
                    </Modal.Body>
                </Modal.Content>
            </Modal>
        </>
    );
};

export const DailyShopsLookup = () => {
    const { characters: unresolvedCharacters, mows, playerMetadata } = useContext(StoreContext);
    const [activeTab, setActiveTab] = useState<ShopTabId>('guild');
    const [day, setDay] = useState<ShopDayOfWeek>(todayDow);

    const pl = playerMetadata.powerLevel ?? 1;

    const lockContext = useMemo(() => {
        const characters = CharactersService.resolveStoredCharacters(unresolvedCharacters);
        const resolvedMows = MowsService.resolveAllFromStorage(mows);
        return computeShopLockContext(pl, characters, resolvedMows);
    }, [unresolvedCharacters, mows, pl]);

    const slotsByTab: Record<ShopTabId, ResolvedShopSlot[]> = useMemo(
        () =>
            Object.fromEntries(SHOP_TAB_IDS.map(tab => [tab, SLOT_RESOLVERS[tab](day, pl, lockContext)])) as Record<
                ShopTabId,
                ResolvedShopSlot[]
            >,
        [day, pl, lockContext]
    );

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-(--border) bg-(--overlay) p-4">
                <span className="text-sm font-medium text-(--fg)">Day:</span>
                <div className="flex flex-wrap gap-1">
                    {DAYS.map(d => (
                        <button
                            key={d}
                            type="button"
                            onClick={() => setDay(d)}
                            className={[
                                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                d === day
                                    ? 'bg-(--primary) text-(--primary-fg)'
                                    : 'bg-(--soft-bg) text-(--soft-fg) hover:text-(--fg)',
                            ].join(' ')}>
                            {DAY_LABELS[d]}
                        </button>
                    ))}
                </div>
            </div>

            <TabBar active={activeTab} onChange={setActiveTab} />

            {SHOP_TAB_IDS.map(tab => (
                <div key={tab} className={activeTab === tab ? undefined : 'hidden'}>
                    <p className="mb-1 text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                        Available in {TAB_LABELS[tab]} on {DAY_LABELS[day]}
                    </p>
                    {slotsByTab[tab].length === 0 ? (
                        <div className="mt-2 rounded-xl border border-(--border) bg-(--overlay) p-8 text-center text-(--soft-fg)">
                            Nothing available on this day.
                        </div>
                    ) : (
                        <div className="mt-3 grid grid-cols-3 items-start gap-2">
                            {slotsByTab[tab].map((slot, index) => (
                                <ShopSlotCard
                                    key={`${slot.items[0]?.rewardType ?? 'slot'}-${index}`}
                                    slot={slot}
                                    currencyType={CURRENCY_TYPE_BY_TAB[tab]}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
