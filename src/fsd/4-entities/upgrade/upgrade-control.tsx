import { Checkbox, FormControlLabel } from '@mui/material';
import React from 'react';

import { Rarity, RarityMapper } from '@/fsd/5-shared/model';

import { IBaseUpgrade, ICraftedUpgrade } from './model';
import { UpgradeImage } from './upgrade-image';

interface Props {
    upgrade: IBaseUpgrade | ICraftedUpgrade;
    checked: boolean;
    checkedChanges: (value: boolean) => void;
}

export const UpgradeControl: React.FC<Props> = ({ upgrade, checked, checkedChanges }) => {
    return (
        <FormControlLabel
            control={
                <Checkbox
                    checked={checked}
                    onChange={event => checkedChanges(event.target.checked)}
                    inputProps={{ 'aria-label': 'controlled' }}
                />
            }
            label={
                <div className="flex items-center gap-2.5" style={{ opacity: checked ? 1 : 0.5 }}>
                    {upgrade.rarity in Rarity && (
                        <UpgradeImage
                            material={upgrade.label}
                            iconPath={upgrade.iconPath}
                            rarity={RarityMapper.rarityToRarityString(upgrade.rarity as unknown as Rarity)}
                        />
                    )}
                </div>
            }
        />
    );
};
