import React, { useState } from 'react';
import { Input, Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import './raid-item-input.scss';

interface Props {
    defaultItemsObtained: number;
    isDisabled: boolean;

    addCount: (count: number) => void;
}

export const RaidItemInput: React.FC<Props> = ({ defaultItemsObtained, isDisabled, addCount }) => {
    const [itemsObtained, setItemsObtained] = useState<string | number>(defaultItemsObtained);

    const handleItemsObtainedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setItemsObtained(event.target.value);
    };

    const handleAdd = () => {
        const value = itemsObtained === '' ? 0 : Number(itemsObtained);
        addCount(value);
    };

    const increment = () => {
        setItemsObtained(value => +value + 1);
    };

    const decrement = () => {
        setItemsObtained(value => +value - 1);
    };

    return (
        <div className="flex-box column" style={{ maxWidth: 70 }}>
            <div className="flex-box gap5 start">
                <Button size="small" className="raid-item-button" onClick={decrement} disabled={isDisabled}>
                    -
                </Button>
                <Input
                    disabled={isDisabled}
                    value={itemsObtained}
                    size="small"
                    onFocus={event => event.target.select()}
                    onChange={handleItemsObtainedChange}
                    inputProps={{
                        step: 1,
                        min: 0,
                        type: 'number',
                        className: 'raid-item-input',
                    }}
                />
                <Button size="small" className="raid-item-button" onClick={increment} disabled={isDisabled}>
                    +
                </Button>
            </div>
            <Tooltip title={isDisabled ? '' : 'Add to inventory'}>
                <span>
                    <Button size={'small'} onClick={handleAdd} disabled={isDisabled}>
                        Add
                    </Button>
                </span>
            </Tooltip>
        </div>
    );
};
