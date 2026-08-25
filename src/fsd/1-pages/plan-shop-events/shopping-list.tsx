import { ChevronDown, Minus, Plus, Trash2 } from 'lucide-react';
import { JSX, useMemo, useState } from 'react';

import { Button } from '@/fsd/5-shared/ui/button';
import { MiscIcon, tacticusIcons } from '@/fsd/5-shared/ui/icons';

import { rewardInfo } from '@/fsd/3-features/shop-rewards';

import { resolveDraftAllianceType } from './draft-alliance';
import { DAY_LABELS } from './shop-events.constants';
import type { Day } from './shop-events.constants';
import type { CartEntry, CartRecord } from './shop-events.types';

/** The reward type a cart entry actually resolves to — a draft entry with a chosen alliance resolves
 *  to its real alliance-specific type, matching how `computeCoverageRows` buckets draft rows. */
function resolveCartEntryType(entry: CartEntry): string {
    const type = entry.rewardString.split(':')[0];
    if (!entry.draftAlliance) return type;
    return resolveDraftAllianceType(type, entry.draftAlliance) ?? type;
}

interface ShoppingListProps {
    cart: CartRecord;
    weekCount: number;
    currencyIconKey: keyof typeof tacticusIcons;
    dayOrder: Day[];
    onSetQty: (key: string, qty: number) => void;
    onResetWeek: (w: number) => void;
}

export function ShoppingList({ cart, weekCount, currencyIconKey, dayOrder, onSetQty, onResetWeek }: ShoppingListProps) {
    const weekNumbers = useMemo(() => Array.from({ length: weekCount }, (_, index) => index + 1), [weekCount]);
    const [sortByDay, setSortByDay] = useState(false);
    const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());

    const toggleWeek = (w: number) =>
        setExpandedWeeks(previous => {
            const next = new Set(previous);
            if (next.has(w)) next.delete(w);
            else next.add(w);
            return next;
        });

    const total = useMemo(
        () => Object.values(cart).reduce((sum, cartEntry) => sum + cartEntry.quantity * cartEntry.costPerUnit, 0),
        [cart]
    );

    if (Object.keys(cart).length === 0) return;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold">Shopping List</h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSortByDay(previous => !previous)}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            sortByDay
                                ? 'border-(--primary) bg-(--primary)/15 text-(--primary)'
                                : 'border-(--border) bg-(--overlay) text-(--soft-fg) hover:border-(--primary)'
                        }`}>
                        Sort by {sortByDay ? 'day' : 'item type'}
                    </button>
                    <div className="flex items-center gap-1 text-sm">
                        <span className="text-(--soft-fg)">Grand total:</span>
                        <span className="font-semibold text-amber-400">{total.toLocaleString()}</span>
                        <MiscIcon icon={currencyIconKey} width={14} height={14} />
                    </div>
                </div>
            </div>

            {weekNumbers.map(w => {
                const rawEntries = Object.entries(cart).filter(([, cartEntry]) => cartEntry.week === w);
                const entries = rawEntries.toSorted(([, a], [, b]) =>
                    sortByDay
                        ? dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day) || a.label.localeCompare(b.label)
                        : a.label.localeCompare(b.label)
                );
                if (rawEntries.length === 0) return;
                const weekTotal = entries.reduce(
                    (sum, [, cartEntry]) => sum + cartEntry.quantity * cartEntry.costPerUnit,
                    0
                );

                // Aggregate resource totals per reward type
                const resourceMap: Record<string, { label: string; icon: JSX.Element; total: number }> = {};
                for (const [, entry] of entries) {
                    const key = resolveCartEntryType(entry);
                    const totalQty = entry.quantity * entry.qtyPerPack;
                    if (resourceMap[key]) {
                        resourceMap[key].total += totalQty;
                    } else {
                        const info = rewardInfo(key);
                        resourceMap[key] = { label: info.label, icon: info.icon, total: totalQty };
                    }
                }

                return (
                    <div key={w} className="flex flex-col rounded-xl border border-(--border) bg-(--overlay)">
                        {/* Collapsible header */}
                        <div className="flex items-center gap-2 p-4">
                            <button onClick={() => toggleWeek(w)} className="flex flex-1 items-center gap-2 text-left">
                                <ChevronDown
                                    className={`size-4 shrink-0 text-(--soft-fg) transition-transform duration-200 ${
                                        expandedWeeks.has(w) ? 'rotate-180' : ''
                                    }`}
                                />
                                <span className="font-semibold">Week {w}</span>
                                <div className="flex items-center gap-1 text-sm">
                                    <span className="font-semibold text-amber-400">{weekTotal.toLocaleString()}</span>
                                    <MiscIcon icon={currencyIconKey} width={12} height={12} />
                                </div>
                            </button>
                            <Button intent="danger" appearance="outline" size="small" onPress={() => onResetWeek(w)}>
                                Reset Week {w}
                            </Button>
                        </div>

                        {/* Resource summary — always visible */}
                        <div className="flex flex-wrap gap-3 border-t border-(--border) bg-(--soft) px-4 py-2">
                            {Object.entries(resourceMap).map(([rKey, resource]) => (
                                <div key={rKey} className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                                        {resource.icon}
                                    </div>
                                    <span className="text-xs font-semibold tabular-nums">
                                        ×{resource.total.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Line items — only when expanded */}
                        {expandedWeeks.has(w) && (
                            <div className="flex flex-col gap-2 border-t border-(--border) p-4">
                                {entries.map(([key, entry]) => {
                                    const resolvedType = resolveCartEntryType(entry);
                                    const { icon, label } = rewardInfo(resolvedType);
                                    const lineTotal = entry.quantity * entry.costPerUnit;

                                    return (
                                        <div key={key} className="flex items-center gap-2 rounded-lg bg-(--soft) p-2">
                                            <div className="flex h-[45px] w-[45px] shrink-0 items-center justify-center">
                                                {icon}
                                            </div>
                                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                <span className="truncate text-sm font-medium">
                                                    {entry.draftAlliance ? label : entry.label}
                                                </span>
                                                <span className="text-xs text-(--soft-fg)">
                                                    {DAY_LABELS[entry.day]}
                                                    {entry.qtyPerPack > 1 && (
                                                        <span> &middot; ×{entry.qtyPerPack} each</span>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-0.5">
                                                <Button
                                                    size="square-petite"
                                                    appearance="outline"
                                                    onPress={() => onSetQty(key, entry.quantity - 1)}>
                                                    <Minus className="size-3" />
                                                </Button>
                                                <span className="min-w-[1.5rem] text-center text-sm font-bold tabular-nums">
                                                    {entry.quantity}
                                                </span>
                                                <Button
                                                    size="square-petite"
                                                    appearance="outline"
                                                    isDisabled={
                                                        entry.maxQty === undefined
                                                            ? false
                                                            : entry.quantity >= entry.maxQty
                                                    }
                                                    onPress={() => onSetQty(key, entry.quantity + 1)}>
                                                    <Plus className="size-3" />
                                                </Button>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-1">
                                                <span className="text-xs font-semibold text-amber-400">
                                                    {lineTotal}
                                                </span>
                                                <MiscIcon icon={currencyIconKey} width={12} height={12} />
                                            </div>
                                            <Button
                                                size="square-petite"
                                                appearance="plain"
                                                onPress={() => onSetQty(key, 0)}>
                                                <Trash2 className="size-3.5 text-red-400" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
