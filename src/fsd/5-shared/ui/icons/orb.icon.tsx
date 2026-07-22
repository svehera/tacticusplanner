import React from 'react';

import { Alliance, Rarity } from '@/fsd/5-shared/model';

import { tacticusIcons } from './icon-list';

interface OrbIconProps {
    alliance: Alliance;
    rarity: Rarity;
    size: number; // Size in pixels (e.g., 60 for 60px)
}

// Maps Rarity enum to the required 'rareOrb', 'uncommonOrb', etc. key.
const mapRarityToKey = (rarity: Rarity): string => {
    return `${Rarity[rarity].toLowerCase()}Orb`;
};

// Maps Alliance enum to the required 'imperialOrb', 'xenosOrb', etc. key.
const mapAllianceToKey = (alliance: Alliance): string => {
    return `${Alliance[alliance].toLowerCase()}Orb`;
};

export const OrbIcon: React.FC<OrbIconProps> = ({ alliance, rarity, size }) => {
    const allianceKey = mapAllianceToKey(alliance);
    const rarityKey = mapRarityToKey(rarity);
    // 2. Fetch the actual file source (assuming it's in a 'file' property)
    // Use optional chaining just in case the key isn't found
    const allianceSource = tacticusIcons[allianceKey]?.file;
    const raritySource = tacticusIcons[rarityKey]?.file;
    // Styles for the main container to set its size and background rarity image
    const containerStyle: React.CSSProperties = {
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url(${raritySource})`, // Rarity image as background
        backgroundSize: 'cover', // Or 'contain', depending on desired effect
        backgroundPosition: 'center', // Center the background image
        backgroundRepeat: 'no-repeat',
    };

    // Styles for the alliance image to ensure it's centered and scaled
    // The size here (e.g., w-3/4 h-3/4) is a heuristic. You might need to adjust
    // `w-3/4` and `h-3/4` based on the exact transparent padding of your alliance icons.
    const allianceImageClasses = `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                                w-3/5 h-3/5 object-contain`;

    return (
        // Outer container is relative for positioning, and displays the rarity image as background
        <div className="relative overflow-hidden rounded-full" style={containerStyle}>
            {' '}
            {/* Add rounded-full if the final orb is round */}
            {/* Alliance Layer (Foreground) */}
            <img src={allianceSource} alt={`${alliance} alliance foreground`} className={allianceImageClasses} />
        </div>
    );
};
