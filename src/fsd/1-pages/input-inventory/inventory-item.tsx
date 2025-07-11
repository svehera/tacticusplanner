import { Input } from '@mui/material';
import Button from '@mui/material/Button';
import React, { useEffect } from 'react';

import { UpgradeImage } from '@/fsd/4-entities/upgrade';

import { IInventoryUpgrade } from './inventory-models';

interface Props {
    data: IInventoryUpgrade;
    showIncDec: boolean;
    dataUpdate: (upgradeId: string, value: number) => void;
}

export const InventoryItemFn: React.FC<Props> = ({ data, showIncDec, dataUpdate }) => {
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
        <div key={data.material} className="flex flex-col max-w-[60px]">
            <div style={{ padding: '0 5px' }}>
                <UpgradeImage material={data.label} iconPath={data.iconPath} />
            </div>
            <Input
                style={{ justifyContent: 'center' }}
                value={amount}
                size="small"
                onFocus={event => event.target.select()}
                onChange={event => handleInputChange(event, data.material)}
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
                        onClick={() => decrement(data.material, +amount)}>
                        -
                    </Button>
                    <Button
                        size="small"
                        className="w-[30px] !min-w-0"
                        onClick={() => increment(data.material, +amount)}>
                        +
                    </Button>
                </div>
            )}
        </div>
    );
};

export const InventoryItem = React.memo(InventoryItemFn);
