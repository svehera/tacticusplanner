import ClearIcon from '@mui/icons-material/Clear';
import { FormControl, InputAdornment } from '@mui/material';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import React, { useState } from 'react';

import { ViewSettings } from '@/fsd/3-features/view-settings';

interface Props {
    nameFilter: string;
    setNameFilter: (name: string) => void;
    resetUpgrades: () => void;
}

const InventoryControlsFn: React.FC<Props> = ({ resetUpgrades, nameFilter, setNameFilter }) => {
    const [nameFilterRaw, setNameFilterRaw] = useState<string>('');

    return (
        <div className="m-5 flex flex-wrap items-center justify-center gap-5">
            <FormControl sx={{ m: 1, width: '25ch' }} variant="outlined">
                <InputLabel htmlFor="quick-filter-input">Quick Filter</InputLabel>
                <OutlinedInput
                    id="quick-filter-input"
                    value={nameFilterRaw}
                    onFocus={event => event.target.select()}
                    onChange={change => {
                        const value = change.target.value;
                        setNameFilterRaw(value);
                        setTimeout(() => setNameFilter(value), value ? 50 : 0);
                    }}
                    endAdornment={
                        nameFilter ? (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => {
                                        setNameFilterRaw('');
                                        setTimeout(() => setNameFilter(''), 0);
                                    }}
                                    edge="end">
                                    <ClearIcon />
                                </IconButton>
                            </InputAdornment>
                        ) : null
                    }
                    label="Quick Filter"
                />
            </FormControl>
            <Button onClick={resetUpgrades} color="error" variant="contained">
                Reset All
            </Button>
            <ViewSettings preset={'inventory'} />
        </div>
    );
};
export const InventoryControls = React.memo(InventoryControlsFn);
