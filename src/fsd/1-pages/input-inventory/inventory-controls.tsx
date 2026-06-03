import { X } from 'lucide-react';
import React, { useState } from 'react';

import { Button, TextField } from '@/fsd/5-shared/ui';

import { ViewSettings } from '@/fsd/3-features/view-settings';

interface Props {
    nameFilter: string;
    setNameFilter: (name: string) => void;
    resetUpgrades: () => void;
}

export const InventoryControls: React.FC<Props> = ({ resetUpgrades, nameFilter, setNameFilter }) => {
    const [nameFilterRaw, setNameFilterRaw] = useState<string>('');

    return (
        <div className="m-5 flex flex-wrap items-center justify-center gap-5">
            <TextField
                placeholder="Quick Filter"
                value={nameFilterRaw}
                onFocus={event => (event.target as HTMLInputElement).select()}
                onChange={value => {
                    setNameFilterRaw(value);
                    setTimeout(() => setNameFilter(value), value ? 50 : 0);
                }}
                suffix={
                    nameFilter ? (
                        <Button
                            size="square-petite"
                            appearance="plain"
                            onPress={() => {
                                setNameFilterRaw('');
                                setTimeout(() => setNameFilter(''), 0);
                            }}>
                            <X className="size-4" />
                        </Button>
                    ) : undefined
                }
            />
            <Button intent="danger" onPress={resetUpgrades}>
                Reset All
            </Button>
            <ViewSettings preset={'inventory'} />
        </div>
    );
};
