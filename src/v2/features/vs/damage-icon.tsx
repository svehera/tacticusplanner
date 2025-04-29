import React from 'react';

import bioIcon from 'src/assets/images/damage/bio.webp';
import blastIcon from 'src/assets/images/damage/blast.webp';
import bolterIcon from 'src/assets/images/damage/bolter.webp';
import chainIcon from 'src/assets/images/damage/chain.webp';
import directIcon from 'src/assets/images/damage/direct.webp';
import energyIcon from 'src/assets/images/damage/energy.webp';
import evisceratingIcon from 'src/assets/images/damage/eviscerating.webp';
import flameIcon from 'src/assets/images/damage/flame.webp';
import heavy_roundIcon from 'src/assets/images/damage/heavy_round.webp';
import lasIcon from 'src/assets/images/damage/las.webp';
import meltaIcon from 'src/assets/images/damage/melta.webp';
import molecularIcon from 'src/assets/images/damage/molecular.webp';
import outline from 'src/assets/images/damage/outline.png';
import particleIcon from 'src/assets/images/damage/particle.webp';
import physicalIcon from 'src/assets/images/damage/physical.webp';
import piercingIcon from 'src/assets/images/damage/piercing.webp';
import plasmaIcon from 'src/assets/images/damage/plasma.webp';
import powerIcon from 'src/assets/images/damage/power.webp';
import projectileIcon from 'src/assets/images/damage/projectile.webp';
import psychicIcon from 'src/assets/images/damage/psychic.webp';
import pulseIcon from 'src/assets/images/damage/pulse.webp';
import toxicIcon from 'src/assets/images/damage/toxic.webp';

const icons = {
    bio: { file: bioIcon, label: 'Bio' },
    blast: { file: blastIcon, label: 'Blast' },
    bolter: { file: bolterIcon, label: 'Bolter' },
    chain: { file: chainIcon, label: 'Chain' },
    direct: { file: directIcon, label: 'Direct' },
    energy: { file: energyIcon, label: 'Energy' },
    eviscerate: { file: evisceratingIcon, label: 'Eviscerating' },
    flame: { file: flameIcon, label: 'Flame' },
    heavy_round: { file: heavy_roundIcon, label: 'Heavy Round' },
    las: { file: lasIcon, label: 'Las' },
    melta: { file: meltaIcon, label: 'Melta' },
    molecular: { file: molecularIcon, label: 'Molecular' },
    particle: { file: particleIcon, label: 'Particle' },
    physical: { file: physicalIcon, label: 'Physical' },
    piercing: { file: piercingIcon, label: 'Piercing' },
    plasma: { file: plasmaIcon, label: 'Plasma' },
    power: { file: powerIcon, label: 'Power' },
    projectile: { file: projectileIcon, label: 'Projectile' },
    psychic: { file: psychicIcon, label: 'Psychic' },
    pulse: { file: pulseIcon, label: 'Pulse' },
    toxic: { file: toxicIcon, label: 'Toxic' },
};

/** Shows the icon for a particular type of damage (e.g. Piercing). */
export const DamageIcon = ({
    icon,
    width = 30,
    height = 30,
    range = undefined,
}: {
    icon: string;
    width?: number;
    height?: number;
    range?: number;
}) => {
    const details = icons[icon.toLowerCase() as keyof typeof icons] ?? { file: '', label: icon };
    return (
        <div style={{ position: 'relative', width: width }}>
            {range != undefined && (
                <div style={{ position: 'absolute', top: -6, left: -18, fontSize: 10 }}>{range}</div>
            )}
            <div style={{ position: 'absolute', top: -10, left: 0, zIndex: 1 }}>
                <img
                    style={{ pointerEvents: 'none', height, width }}
                    src={outline}
                    width={width}
                    height={height}
                    alt={details.label}
                />
            </div>
            <div style={{ position: 'absolute', top: -10, left: 2.2, scale: 0.91, zIndex: 0 }}>
                <img src={details.file} width={(width * 10) / 11.0} height={height} alt={details.label} />
            </div>
        </div>
    );
};
