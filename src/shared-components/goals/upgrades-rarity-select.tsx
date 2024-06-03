import React from 'react';
import MultipleSelectCheckmarks from 'src/routes/characters/multiple-select';
import { Rarity, RarityString } from 'src/models/enums';
import { AccessibleTooltip } from 'src/v2/components/tooltip';
import { Info } from '@mui/icons-material';

interface Props {
    upgradesRarity: Rarity[];
    upgradesRarityChange: (value: Rarity[]) => void;
}

export const UpgradesRaritySelect: React.FC<Props> = ({ upgradesRarity, upgradesRarityChange }) => {
    return (
        <div className="flex-box gap5 full-width">
            <MultipleSelectCheckmarks
                placeholder="Upgrades rarity"
                selectedValues={upgradesRarity.map(x => Rarity[x])}
                values={Object.values(RarityString)}
                selectionChanges={values => upgradesRarityChange(values.map(x => +Rarity[x as unknown as number]))}
            />

            <AccessibleTooltip
                title={
                    'You can limit rarity of base upgrades that will be required to reach the goal. One of use cases is to pre-farm Legendary upgrades (usually takes the most time) before starting farming other upgrades'
                }>
                <Info color="primary" />
            </AccessibleTooltip>
        </div>
    );
};
