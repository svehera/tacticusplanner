import { FC, memo } from 'react';

import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { getCharacterIcon, getDisplayName } from './raid-day-helpers';

interface CharacterFilterRowProps {
    characterIds: string[];
}

const CharacterFilterRowComponent: FC<CharacterFilterRowProps> = ({ characterIds }) => (
    <div className="flex flex-wrap gap-1">
        {characterIds.map(id => (
            <div key={id} title={getDisplayName(id)} role="img" aria-label={getDisplayName(id)}>
                <UnitShardIcon icon={getCharacterIcon(id)} height={24} width={24} />
            </div>
        ))}
    </div>
);

export const CharacterFilterRow = memo(CharacterFilterRowComponent);
