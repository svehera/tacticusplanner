import { Input } from '@mui/material';
import Button from '@mui/material/Button';
import React, { useEffect } from 'react';

import { RarityMapper } from '@/fsd/5-shared/model';

import { UpgradeImage } from '@/fsd/4-entities/upgrade';

import { IInventoryUpgrade } from './inventory-models';

interface Props {
    data: IInventoryUpgrade;
    showIncDec: boolean;
    dataUpdate: (upgradeId: string, value: number) => void;
}

const InventoryItemFn: React.FC<Props> = ({ data, showIncDec, dataUpdate }) => {
    const [amount, setAmount] = React.useState<number | ''>(data.quantity);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, upgradeId: string) => {
        const value = event.target.value === '' ? 0 : Number(event.target.value);
        const result = value > 1000 ? 1000 : value;
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
        <div key={data.snowprintId} className="flex flex-col max-w-[60px]">
            <div className="py-0 px-[5px]">
                <UpgradeImage
                    material={data.material}
                    iconPath={data.iconPath}
                    rarity={RarityMapper.rarityToRarityString(data.rarity)}
                />
            </div>
            <Input
                className="justify-center"
                value={amount}
                size="small"
                onFocus={event => event.target.select()}
                onChange={event => handleInputChange(event, data.snowprintId)}
                inputProps={{
                    step: 1,
                    min: 0,
                    max: 1000,
                    type: 'number',
                    style: { width: amount.toString().length * 10 },
                    className: 'item-quantity-input',
                }}
            />
            {showIncDec && (
                <div>
                    <Button
                        size="small"
                        className="w-[30px] !min-w-0"
                        onClick={() => decrement(data.snowprintId, +amount)}>
                        -
                    </Button>
                    <Button
                        size="small"
                        className="w-[30px] !min-w-0"
                        onClick={() => increment(data.snowprintId, +amount)}>
                        +
                    </Button>
                </div>
            )}
        </div>
    );
};

export const InventoryItem = React.memo(InventoryItemFn);
