import { JSX, useState } from 'react';

import { Alliance } from '@/fsd/5-shared/model';
import { Button } from '@/fsd/5-shared/ui/button';
import { MiscIcon, tacticusIcons } from '@/fsd/5-shared/ui/icons';
import { Modal } from '@/fsd/5-shared/ui/modal';

import { rewardInfo } from '@/fsd/3-features/shop-rewards';

import { getDraftAllianceOptions, isDraftRewardType, resolveDraftAllianceType } from './draft-alliance';
import type { ResolvedSlot } from './shop-events.types';

interface ShopCardProps {
    slot: ResolvedSlot;
    cartQty: number;
    /** The slot's current cart order's chosen alliance, if it's a draft reward with one already picked. */
    draftAlliance: Alliance | undefined;
    currencyIconKey: keyof typeof tacticusIcons;
    onConfirm: (qty: number, alliance: Alliance | undefined) => void;
    /** Rendered when the "Details" toggle is on and this slot's reward is a character/MoW shard. */
    details?: JSX.Element;
}

export function ShopCard({ slot, cartQty, draftAlliance, currencyIconKey, onConfirm, details }: ShopCardProps) {
    const { label, qty: qtyPerPack, icon, isFree, cost, product, rewardString } = slot;
    const rewardType = rewardString.split(':')[0];
    const isDraft = isDraftRewardType(rewardType);
    const draftOptions = isDraft ? getDraftAllianceOptions(rewardType) : undefined;

    const maxQty = product.maxPurchases === undefined ? undefined : Number.parseInt(product.maxPurchases, 10);
    const remaining = maxQty === undefined ? undefined : maxQty - cartQty;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [step, setStep] = useState<'alliance' | 'quantity'>('quantity');
    const [selectedAlliance, setSelectedAlliance] = useState<Alliance | undefined>(draftAlliance);
    const [sliderValue, setSliderValue] = useState(cartQty === 0 ? 1 : cartQty);

    const handleCardClick = () => {
        if (isFree) return;
        setSliderValue(cartQty === 0 ? 1 : cartQty);
        setSelectedAlliance(draftAlliance);
        setStep(isDraft && !draftAlliance ? 'alliance' : 'quantity');
        setDialogOpen(true);
    };

    const sliderMax = maxQty ?? 10;
    const confirmDisabled = (sliderValue === 0 && cartQty === 0) || (isDraft && sliderValue > 0 && !selectedAlliance);

    const handleConfirm = () => {
        onConfirm(sliderValue, isDraft ? selectedAlliance : undefined);
        setDialogOpen(false);
    };

    const resolvedType =
        isDraft && selectedAlliance ? resolveDraftAllianceType(rewardType, selectedAlliance) : undefined;
    const { icon: dialogIcon, label: dialogLabel } = resolvedType ? rewardInfo(resolvedType) : { icon, label };

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
                        <MiscIcon icon={currencyIconKey} width={12} height={12} />
                    </div>
                )}
                {/* Remaining */}
                {remaining !== undefined && !isFree && (
                    <span className="text-[10px] text-(--soft-fg)">{remaining} left</span>
                )}
                {/* Character/MoW details (shown when the "Details" toggle is on) */}
                {details && <div onClick={event_ => event_.stopPropagation()}>{details}</div>}
            </div>

            {/* Alliance-pick / quantity dialog */}
            <Modal
                isOpen={dialogOpen}
                onOpenChange={open => {
                    if (!open) setDialogOpen(false);
                }}>
                <Modal.Content size="sm">
                    {step === 'alliance' ? (
                        <>
                            <Modal.Header>
                                <Modal.Title>{label}</Modal.Title>
                                <Modal.Description>Pick which alliance&apos;s resource to buy</Modal.Description>
                            </Modal.Header>
                            <Modal.Body>
                                <div className="flex flex-col gap-2 py-2">
                                    {draftOptions?.map(option => (
                                        <button
                                            key={option.alliance}
                                            type="button"
                                            onClick={() => {
                                                setSelectedAlliance(option.alliance);
                                                setStep('quantity');
                                            }}
                                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-(--border) p-3 text-left transition-colors hover:border-(--primary) hover:bg-(--primary)/10">
                                            <span className="inline-flex h-9 w-9 items-center justify-center">
                                                {option.icon}
                                            </span>
                                            <span className="text-sm font-medium">{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button
                                    appearance="outline"
                                    className="w-full sm:w-auto"
                                    onPress={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                            </Modal.Footer>
                        </>
                    ) : (
                        <>
                            <Modal.Header>
                                <Modal.Title className="flex items-center gap-2">
                                    <span className="inline-flex h-9 w-9 items-center justify-center">
                                        {dialogIcon}
                                    </span>
                                    {dialogLabel}
                                </Modal.Title>
                                {qtyPerPack !== undefined && (
                                    <Modal.Description>×{qtyPerPack.toLocaleString()} per purchase</Modal.Description>
                                )}
                            </Modal.Header>
                            <Modal.Body>
                                <div className="flex flex-col gap-4 py-2">
                                    {isDraft && draftOptions && (
                                        <button
                                            type="button"
                                            onClick={() => setStep('alliance')}
                                            className="cursor-pointer self-start text-xs text-(--primary) underline-offset-2 hover:underline">
                                            Change alliance
                                        </button>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-(--soft-fg)">
                                            Quantity: <span className="text-fg font-bold">{sliderValue}</span>
                                            {maxQty !== undefined && (
                                                <span className="text-(--soft-fg)"> / {maxQty}</span>
                                            )}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm font-semibold text-(--accent)">
                                                {sliderValue * cost}
                                            </span>
                                            <MiscIcon icon={currencyIconKey} width={14} height={14} />
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
                                <Button
                                    appearance="outline"
                                    className="w-full sm:w-auto"
                                    onPress={() => setDialogOpen(false)}>
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
                        </>
                    )}
                </Modal.Content>
            </Modal>
        </>
    );
}
