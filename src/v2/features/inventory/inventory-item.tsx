import React, { useState } from 'react';
import { UpgradeImage } from 'src/shared-components/upgrade-image';
import { Input } from '@mui/material';
import { Rarity } from 'src/models/enums';

interface Props {
    label: string;
    rarity: Rarity;
    iconPath: string;
    quantity: number;
    quantityChange: (value: number) => void;
}

export const InventoryItem: React.FC<Props> = ({ label, quantityChange, quantity, iconPath, rarity }) => {
    const [value, setValue] = useState(quantity);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = event.target.value === '' ? 0 : Math.min(Number(event.target.value), 1000);
        setValue(newValue);
        quantityChange(newValue);
    };

    return (
        <div className="flex-box column">
            <UpgradeImage material={label} rarity={rarity} iconPath={iconPath} />
            <Input
                style={{ justifyContent: 'center', width: '100%' }}
                value={value}
                size="small"
                onFocus={event => event.target.select()}
                onChange={handleInputChange}
                inputProps={{
                    step: 1,
                    min: 0,
                    max: 1000,
                    type: 'number',
                    style: { width: value.toString().length * 10 },
                    className: 'item-quantity-input',
                }}
            />
        </div>
    );
};
