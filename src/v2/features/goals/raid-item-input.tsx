import React, { useState } from 'react';
import { FormControlLabel, Input, Tooltip } from '@mui/material';
import Button from '@mui/material/Button';

interface Props {
    defaultItemsObtained: number;
    acquiredCount: number;
    requiredCount: number;

    isDisabled: boolean;

    addCount: (count: number) => void;
}

export const RaidItemInput: React.FC<Props> = ({
    requiredCount,
    acquiredCount,
    defaultItemsObtained,
    isDisabled,
    addCount,
}) => {
    const [itemsObtained, setItemsObtained] = useState<string | number>(defaultItemsObtained);

    const handleItemsObtainedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setItemsObtained(event.target.value);
    };

    const handleAdd = () => {
        const value = itemsObtained === '' ? 0 : Number(itemsObtained);
        addCount(value);
    };

    return (
        <div
            className="flex-box column"
            style={{
                minWidth: 60,
                maxWidth: 70,
            }}>
            <FormControlLabel
                control={
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
                        }}
                    />
                }
                sx={{ margin: 0 }}
                labelPlacement={'top'}
                label={
                    <span style={{ fontSize: 12, fontStyle: 'italic' }}>
                        {acquiredCount}/{requiredCount} Items
                    </span>
                }
            />
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
