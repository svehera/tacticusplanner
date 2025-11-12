import React from 'react';

import { Alliance, Rarity } from '@/fsd/5-shared/model';

import { tacticusIcons } from '.';

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
    const allianceSrc = tacticusIcons[allianceKey]?.file;
    const raritySrc = tacticusIcons[rarityKey]?.file;
    // 2. Conditional Vertical Positioning
    let translateYStyle: React.CSSProperties = { transform: 'translateY(0%)' }; // Default: perfect center (-translate-y-1/2)

    if (rarity === Rarity.Mythic) {
        // We want the image to move down by 5% of the *parent's* height.
        // The base position is -50%. To move down 5% more, the new position is -50% + 5% of the parent's height.
        // Since the image is absolutely positioned, we can use a CSS calc function or adjust the translateY.
        // Let's use CSS calc for precision (or we can just guess a good number based on visual testing).

        // Simpler visual adjustment (e.g., move down by 2px regardless of size)
        // For a 5% shift *relative to the parent size*, we need to adjust the translate property itself.

        // Base: translateY(-50%) to center.
        // New: translateY(calc(-50% + 5%)) moves it down 5% relative to the parent's height.
        translateYStyle = { transform: 'translateY(calc(15%))' };
    }
    // Styles for the main container to set its size and background rarity image
    const containerStyle: React.CSSProperties = {
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url(${raritySrc})`, // Rarity image as background
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
            <img
                src={allianceSrc}
                alt={`${alliance} alliance foreground`}
                className={allianceImageClasses}
                style={translateYStyle}
            />
        </div>
    );
};
