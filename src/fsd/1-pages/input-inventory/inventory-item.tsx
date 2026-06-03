import React, { useEffect } from 'react';

import { RarityMapper } from '@/fsd/5-shared/model';
import { Button } from '@/fsd/5-shared/ui';

import { UpgradeImage } from '@/fsd/4-entities/upgrade';

import { IInventoryUpgrade } from './inventory-models';

interface Props {
    data: IInventoryUpgrade;
    showIncDec: boolean;
    dataUpdate: (upgradeId: string, value: number) => void;
}

export const InventoryItem: React.FC<Props> = ({ data, showIncDec, dataUpdate }) => {
    const [amount, setAmount] = React.useState<number | ''>(data.quantity);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, upgradeId: string) => {
        const value = event.target.value === '' ? 0 : Number(event.target.value);
        const result = Math.min(value, 1000);
        dataUpdate(upgradeId, result);
        setAmount(event.target.value === '' ? '' : Number(event.target.value));
    };

    const increment = (upgradeId: string, value: number) => {
        const result = Math.min(value + 1, 1000);
        dataUpdate(upgradeId, result);
        setAmount(result);
    };

    const decrement = (upgradeId: string, value: number) => {
        const result = Math.max(value - 1, 0);
        dataUpdate(upgradeId, result);
        setAmount(result);
    };

    useEffect(() => {
        if (amount !== data.quantity) {
            setAmount(data.quantity);
        }
    }, [data.quantity]);

    return (
        <div key={data.snowprintId} className="flex max-w-[60px] flex-col items-center">
            <div className="px-[5px] py-0">
                <UpgradeImage
                    material={data.material}
                    iconPath={data.iconPath}
                    rarity={RarityMapper.rarityToRarityString(data.rarity)}
                />
            </div>
            <input
                type="number"
                className="item-quantity-input w-full border-0 border-b border-(--input-border) bg-transparent py-0.5 text-center text-sm text-(--fg) outline-none focus:border-(--primary)"
                value={amount}
                onFocus={event => event.target.select()}
                onChange={event => handleInputChange(event, data.snowprintId)}
                step={1}
                min={0}
                max={1000}
            />
            {showIncDec && (
                <div className="flex">
                    <Button
                        size="square-petite"
                        appearance="plain"
                        onPress={() => decrement(data.snowprintId, +amount)}>
                        -
                    </Button>
                    <Button
                        size="square-petite"
                        appearance="plain"
                        onPress={() => increment(data.snowprintId, +amount)}>
                        +
                    </Button>
                </div>
            )}
        </div>
    );
};
