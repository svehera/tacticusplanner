import { JSX, useEffect, useState } from 'react';

import { Button } from '@/fsd/5-shared/ui/button';
import { Modal } from '@/fsd/5-shared/ui/modal';

import type { CartEntry } from './armageddon.types';

interface PurchasedQtyModalProps {
    isOpen: boolean;
    entry: CartEntry;
    icon: JSX.Element;
    initialPurchased: number;
    onConfirm: (qty: number) => void;
    onClose: () => void;
}

export function PurchasedQtyModal({
    isOpen,
    entry,
    icon,
    initialPurchased,
    onConfirm,
    onClose,
}: PurchasedQtyModalProps) {
    const [sliderValue, setSliderValue] = useState(initialPurchased);

    useEffect(() => {
        if (isOpen) setSliderValue(initialPurchased);
    }, [isOpen, initialPurchased]);

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={open => {
                if (!open) onClose();
            }}>
            <Modal.Content size="sm">
                <Modal.Header>
                    <Modal.Title className="flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center">{icon}</span>
                        {entry.label}
                    </Modal.Title>
                    <Modal.Description>How many did you purchase? (0 = clear)</Modal.Description>
                </Modal.Header>
                <Modal.Body>
                    <div className="flex flex-col gap-4 py-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-(--soft-fg)">
                                Purchased: <span className="font-bold text-(--fg)">{sliderValue}</span>
                                <span className="text-(--soft-fg)"> / {entry.quantity}</span>
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={entry.quantity}
                            value={sliderValue}
                            onChange={event => setSliderValue(Number(event.currentTarget.value))}
                            className="w-full accent-blue-500"
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="outline" className="w-full sm:w-auto" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button intent="primary" className="w-full sm:w-auto" onPress={() => onConfirm(sliderValue)}>
                        {sliderValue === 0 ? 'Clear purchase' : `Purchased ×${sliderValue}`}
                    </Button>
                </Modal.Footer>
            </Modal.Content>
        </Modal>
    );
}
