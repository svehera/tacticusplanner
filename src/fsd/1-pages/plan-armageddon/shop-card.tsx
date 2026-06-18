import { useState } from 'react';

import { Button } from '@/fsd/5-shared/ui/button';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';
import { Modal } from '@/fsd/5-shared/ui/modal';

import type { ResolvedSlot } from './armageddon.types';

interface ShopCardProps {
    slot: ResolvedSlot;
    cartQty: number;
    onSetQty: (qty: number) => void;
}

export function ShopCard({ slot, cartQty, onSetQty }: ShopCardProps) {
    const { label, qty: qtyPerPack, icon, isFree, cost, product } = slot;
    const maxQty = product.maxPurchases === undefined ? undefined : Number.parseInt(product.maxPurchases, 10);
    const remaining = maxQty === undefined ? undefined : maxQty - cartQty;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [sliderValue, setSliderValue] = useState(cartQty === 0 ? 1 : cartQty);

    const handleCardClick = () => {
        if (isFree) return;
        setSliderValue(cartQty === 0 ? 1 : cartQty);
        setDialogOpen(true);
    };

    const sliderMax = maxQty ?? 10;
    const confirmDisabled = sliderValue === 0 && cartQty === 0;

    const handleConfirm = () => {
        onSetQty(sliderValue);
        setDialogOpen(false);
    };

    return (
        <>
            {/* The card itself */}
            <div
                role={isFree ? undefined : 'button'}
                tabIndex={isFree ? undefined : 0}
                onClick={handleCardClick}
                onKeyDown={event_ => {
                    if (event_.key === 'Enter' || event_.key === ' ') {
                        event_.preventDefault();
                        handleCardClick();
                    }
                }}
                className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${isFree ? 'border-(--border) bg-(--overlay)' : 'cursor-pointer border-(--border) bg-(--overlay) hover:scale-[1.04] hover:border-(--primary) hover:shadow-md active:scale-[0.98]'} ${cartQty > 0 ? 'ring-2 ring-(--primary)/60' : ''}`}>
                {/* Cart badge */}
                {cartQty > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-(--primary) px-1 text-[10px] font-bold text-(--primary-fg)">
                        {cartQty}
                    </span>
                )}
                {/* Icon */}
                <div className="flex h-[45px] w-[45px] items-center justify-center">{icon}</div>
                {/* Pack qty */}
                {qtyPerPack !== undefined && (
                    <span className="text-xs font-bold text-(--soft-fg) tabular-nums">
                        ×{qtyPerPack.toLocaleString()}
                    </span>
                )}
                {/* Cost / free badge */}
                {isFree ? (
                    <span className="rounded bg-(--success)/20 px-1.5 py-0.5 text-[10px] font-medium text-(--success)">
                        Free
                    </span>
                ) : (
                    <div className="flex items-center gap-0.5">
                        <span className="text-[11px] font-semibold text-(--accent)">{cost}</span>
                        <MiscIcon icon="armageddonCurrency" width={12} height={12} />
                    </div>
                )}
                {/* Remaining */}
                {remaining !== undefined && !isFree && (
                    <span className="text-[10px] text-(--soft-fg)">{remaining} left</span>
                )}
            </div>

            {/* Quantity dialog */}
            <Modal
                isOpen={dialogOpen}
                onOpenChange={open => {
                    if (!open) setDialogOpen(false);
                }}>
                <Modal.Content size="sm">
                    <Modal.Header>
                        <Modal.Title className="flex items-center gap-2">
                            <span className="inline-flex h-9 w-9 items-center justify-center">{icon}</span>
                            {label}
                        </Modal.Title>
                        {qtyPerPack !== undefined && (
                            <Modal.Description>×{qtyPerPack.toLocaleString()} per purchase</Modal.Description>
                        )}
                    </Modal.Header>
                    <Modal.Body>
                        <div className="flex flex-col gap-4 py-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-(--soft-fg)">
                                    Quantity: <span className="text-fg font-bold">{sliderValue}</span>
                                    {maxQty !== undefined && <span className="text-(--soft-fg)"> / {maxQty}</span>}
                                </span>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-semibold text-(--accent)">{sliderValue * cost}</span>
                                    <MiscIcon icon="armageddonCurrency" width={14} height={14} />
                                </div>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={sliderMax}
                                value={sliderValue}
                                onChange={event_ => setSliderValue(Number(event_.currentTarget.value))}
                                className="w-full accent-(--primary)"
                            />
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button appearance="outline" className="w-full sm:w-auto" onPress={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            intent="primary"
                            className="w-full sm:w-auto"
                            isDisabled={confirmDisabled}
                            onPress={handleConfirm}>
                            {sliderValue === 0 ? 'Remove from list' : `Add ×${sliderValue} to list`}
                        </Button>
                    </Modal.Footer>
                </Modal.Content>
            </Modal>
        </>
    );
}
