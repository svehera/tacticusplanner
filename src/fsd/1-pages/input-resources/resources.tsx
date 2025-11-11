import React, { useContext } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { Alliance, Rarity } from '@/fsd/5-shared/model';

type EmptyProps = Record<string, never>;

export const Resources: React.FC<EmptyProps> = () => {
    // const dispatch = useContext(DispatchContext);
    const { inventory } = useContext(StoreContext);

    const rarities: Rarity[] = [
        Rarity.Common,
        Rarity.Uncommon,
        Rarity.Rare,
        Rarity.Epic,
        Rarity.Legendary,
        Rarity.Mythic,
    ];

    return (
        <div>
            <h2>Books</h2>
            {rarities.map(rarity => {
                const quantity = inventory.xpBooks[rarity] || 0;
                return (
                    <div key={'xp-' + rarity}>
                        <span>{Rarity[rarity]}</span>: <span>{quantity}</span>
                    </div>
                );
            })}
            <h2>Ability Badges</h2>
            {[Alliance.Imperial, Alliance.Xenos, Alliance.Chaos].map(alliance => (
                <div key={alliance}>
                    <h3>{Alliance[alliance]}</h3>
                    {rarities.map(rarity => (
                        <div key={alliance + '-badge-' + rarity}>
                            <span>{Rarity[rarity as number]}</span>:{' '}
                            <span>{inventory.abilityBadges[alliance as Alliance][rarity as number as Rarity]}</span>
                        </div>
                    ))}
                </div>
            ))}
            <h2>Orbs</h2>
            {[Alliance.Imperial, Alliance.Xenos, Alliance.Chaos].map(alliance => (
                <div key={alliance}>
                    <h3>{Alliance[alliance]}</h3>
                    {rarities.map(rarity => (
                        <div key={alliance + '-orb-' + rarity}>
                            <span>{Rarity[rarity as number]}</span>:{' '}
                            <span>{inventory.orbs[alliance as Alliance][rarity as number as Rarity]}</span>
                        </div>
                    ))}
                </div>
            ))}
            <h2>Forge Badges</h2>
            {rarities.map(rarity => {
                const quantity = inventory.forgeBadges[rarity] || 0;
                return (
                    <div key={'forge-' + rarity}>
                        <span>{Rarity[rarity]}</span>: <span>{quantity}</span>
                    </div>
                );
            })}
            <h2>Components</h2>
            {[Alliance.Imperial, Alliance.Xenos, Alliance.Chaos].map(alliance => (
                <div key={alliance}>
                    <h3>{Alliance[alliance]}</h3>
                    <span>{inventory.components[alliance]}</span>
                </div>
            ))}
        </div>
    );
};
