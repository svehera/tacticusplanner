import { IMaterialRaid } from 'src/models/interfaces';
import React from 'react';
import { CharacterImage } from 'src/shared-components/character-image';
import { UpgradeImage } from 'src/shared-components/upgrade-image';
import { Warning } from '@mui/icons-material';
import { Tooltip } from '@mui/material';

interface Props {
    materialRaid: IMaterialRaid;
}

export const MaterialItemTitle: React.FC<Props> = ({ materialRaid }) => {
    const isAllLocationsBlocked =
        !!materialRaid.materialRef &&
        materialRaid.materialRef.locationsString === materialRaid.materialRef.missingLocationsString;

    return (
        <div className="flex-box gap10">
            {materialRaid.characterIconPath ? (
                <CharacterImage icon={materialRaid.characterIconPath} />
            ) : (
                <UpgradeImage
                    material={materialRaid.materialLabel}
                    rarity={materialRaid.materialRarity}
                    iconPath={materialRaid.materialIconPath}
                />
            )}
            {isAllLocationsBlocked ? (
                <span>
                    <Warning color={'warning'} /> All locations locked
                </span>
            ) : (
                <Tooltip title={materialRaid.characters.join(', ')}>
                    <span>
                        (
                        {materialRaid.characters.length <= 3
                            ? materialRaid.characters.join(', ')
                            : materialRaid.characters.slice(0, 3).join(', ') +
                              ` and ${materialRaid.characters.slice(3).length} more...`}
                        )
                    </span>
                </Tooltip>
            )}
        </div>
    );
};
