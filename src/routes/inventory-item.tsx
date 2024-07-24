import React from 'react';
import { UpgradeImage } from 'src/shared-components/upgrade-image';
import { Input } from '@mui/material';
import Button from '@mui/material/Button';
import { ITableRow } from './inventory-models';

import './inventory-item.scss';

interface Props {
    data: ITableRow;
    showIncDec: boolean;
    dataUpdate: (upgradeId: string, value: number) => void;
}

export const InventoryItem: React.FC<Props> = ({ data, showIncDec, dataUpdate }) => {
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, data: ITableRow) => {
        const value = event.target.value === '' ? 0 : Number(event.target.value);
        data.quantity = value > 1000 ? 1000 : value;
        dataUpdate(data.material, data.quantity);
    };

    const increment = (data: ITableRow) => {
        data.quantity = Math.min(data.quantity + 1, 1000);
        dataUpdate(data.material, data.quantity);
    };

    const decrement = (data: ITableRow) => {
        data.quantity = Math.max(data.quantity - 1, 0);
        dataUpdate(data.material, data.quantity);
    };

    return (
        <div key={data.material} className="inventory-item">
            <div style={{ padding: '0 5px' }}>
                <UpgradeImage material={data.label} rarity={data.rarity} iconPath={data.iconPath} />
            </div>
            <Input
                style={{ justifyContent: 'center' }}
                value={data.quantity}
                size="small"
                onFocus={event => event.target.select()}
                onChange={event => handleInputChange(event, data)}
                inputProps={{
                    step: 1,
                    min: 0,
                    max: 1000,
                    type: 'number',
                    style: { width: data.quantity.toString().length * 10 },
                    className: 'item-quantity-input',
                }}
            />
            {showIncDec && (
                <div>
                    <Button size="small" className="item-quantity-button" onClick={() => decrement(data)}>
                        -
                    </Button>
                    <Button size="small" className="item-quantity-button" onClick={() => increment(data)}>
                        +
                    </Button>
                </div>
            )}
        </div>
    );
};
