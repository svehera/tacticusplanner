import { FC, memo } from 'react';

import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { getCharacterIcon, getDisplayName } from './raid-day-helpers';

interface CharacterFilterRowProps {
    characterIds: string[];
}

const CharacterFilterRowComponent: FC<CharacterFilterRowProps> = ({ characterIds }) => (
    <div className="flex flex-wrap gap-1">
        {characterIds.map(id => {
            const name = getDisplayName(id);
            return (
                <div key={id} title={name} role="img" aria-label={name}>
                    <UnitShardIcon icon={getCharacterIcon(id)} height={24} width={24} />
                </div>
            );
        })}
    </div>
);

export const CharacterFilterRow = memo(CharacterFilterRowComponent);
