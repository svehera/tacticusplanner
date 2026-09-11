import { IFaction, IUnit } from '../characters.models';

import { FactionsTile } from './faction-tile';

export const FactionsGrid = ({
    factions,
    onCharacterClick,
    showRankUpTarget,
}: {
    factions: IFaction[];
    onCharacterClick?: (character: IUnit) => void;
    showRankUpTarget?: boolean;
}) => {
    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(375px,720px))] place-content-around gap-4 gap-x-6">
            {factions.map(x => (
                <FactionsTile
                    key={x.name}
                    faction={x}
                    onCharacterClick={onCharacterClick}
                    showRankUpTarget={showRankUpTarget}
                />
            ))}
        </div>
    );
};
