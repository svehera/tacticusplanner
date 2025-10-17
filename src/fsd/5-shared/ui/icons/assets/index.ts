// TODO(mythic): Change the location of a few things, but automate copying via datamine_tacticus

// eslint-disable-next-line import-x/no-internal-modules, no-restricted-imports
import blueStar from '../../../../../assets/images/snowprint_assets/stars/ui_icon_star_legendary_large.png';
// eslint-disable-next-line import-x/no-internal-modules, no-restricted-imports
import mythicWings from '../../../../../assets/images/snowprint_assets/stars/ui_icon_star_mythic.png';

import armourIcon from './armour.webp';
import blackstoneIcon from './blackstone.png';
import blockIcon from './block.png';
import chanceIcon from './chance.png';
import critDamageIcon from './crit_dmg.png';
import deploymentIcon from './deployment.png';
import damageIcon from './dmg.webp';
import energyIcon from './energy.png';
import healthIcon from './health.webp';
import hitsIcon from './hits.webp';
import meleeIcon from './melee.png';
import mowIcon from './mow.png';
import powerIcon from './power.png';
import rangedIcon from './ranged.png';
import redStar from './red star small.png';
import goldStar from './star small.png';
import warTokenIcon from './warToken.png';

export const tacticusIcons = {
    armour: {
        file: armourIcon,
        label: 'Armour',
    },
    block: {
        file: blockIcon,
        label: 'Block',
    },
    chance: {
        file: chanceIcon,
        label: 'Chance',
    },
    critDamage: {
        file: critDamageIcon,
        label: 'CritDamage',
    },
    damage: {
        file: damageIcon,
        label: 'Damage',
    },
    health: {
        file: healthIcon,
        label: 'Health',
    },
    power: {
        file: powerIcon,
        label: 'Power',
    },
    energy: {
        file: energyIcon,
        label: 'Energy',
    },
    blackstone: {
        file: blackstoneIcon,
        label: 'Blackstone',
    },
    deployment: {
        file: deploymentIcon,
        label: '',
    },
    warToken: {
        file: warTokenIcon,
        label: 'War Token',
    },
    mow: {
        file: mowIcon,
        label: 'Machine of War',
    },
    melee: {
        file: meleeIcon,
        label: 'Melee',
    },
    ranged: {
        file: rangedIcon,
        label: 'Ranged',
    },
    hits: {
        file: hitsIcon,
        label: 'Hits',
    },
};

export const starsIcons = {
    mythicWings,
    blueStar,
    redStar,
    goldStar,
};
