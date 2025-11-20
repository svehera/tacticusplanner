// TODO(mythic): Change the location of a few things, but automate copying via datamine_tacticus

import { snowprintIcons, snowprintStarsIcons } from '@/fsd/5-shared/assets';
export { OrbIcon } from './orb-image';
export { ForgeBadgesTotal } from './forge-badges-total';
export { XpBooksTotal } from './xp-books-total';
export { MoWComponentsTotal } from './mow-components-total';

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

export interface TacticusIcon {
    file: string;
    label: string;
}

export const tacticusIcons: Record<string, TacticusIcon> = {
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
    survivalCurrencyHalloween2025: snowprintIcons.eventCurrencyHalloween2025Icon,
    checkmark: snowprintIcons.checkmark,
    legendaryEventToken: snowprintIcons.legendaryEventToken,
    onslaughtToken: snowprintIcons.onslaughtToken,
    salvageRunToken: snowprintIcons.salvageRunToken,
    arenaToken: snowprintIcons.arenaToken,
    survivalToken: snowprintIcons.survivalToken,
    coin: snowprintIcons.coin,
    reqOrder: snowprintIcons.reqOrder,
    blessedReqOrder: snowprintIcons.blessedReqOrder,
    defeatWaves: snowprintIcons.defeatWaves,
    commonBook: snowprintIcons.commonBook,
    uncommonBook: snowprintIcons.uncommonBook,
    rareBook: snowprintIcons.rareBook,
    epicBook: snowprintIcons.epicBook,
    legendaryBook: snowprintIcons.legendaryBook,
    mythicBook: snowprintIcons.mythicBook,
    uncommonOrb: snowprintIcons.uncommonOrb,
    rareOrb: snowprintIcons.rareOrb,
    epicOrb: snowprintIcons.epicOrb,
    legendaryOrb: snowprintIcons.legendaryOrb,
    mythicOrb: snowprintIcons.mythicOrb,
    imperialOrb: snowprintIcons.imperialOrb,
    xenosOrb: snowprintIcons.xenosOrb,
    chaosOrb: snowprintIcons.chaosOrb,
    commonForgeBadge: snowprintIcons.commonForgeBadge,
    uncommonForgeBadge: snowprintIcons.uncommonForgeBadge,
    rareForgeBadge: snowprintIcons.rareForgeBadge,
    epicForgeBadge: snowprintIcons.epicForgeBadge,
    legendaryForgeBadge: snowprintIcons.legendaryForgeBadge,
    mythicForgeBadge: snowprintIcons.mythicForgeBadge,
    imperialComponent: snowprintIcons.imperialComponent,
    xenosComponent: snowprintIcons.xenosComponent,
    chaosComponent: snowprintIcons.chaosComponent,
    commonEquipmentFrame: snowprintIcons.commonEquipmentFrame,
    uncommonEquipmentFrame: snowprintIcons.uncommonEquipmentFrame,
    rareEquipmentFrame: snowprintIcons.rareEquipmentFrame,
    epicEquipmentFrame: snowprintIcons.epicEquipmentFrame,
    legendaryEquipmentFrame: snowprintIcons.legendaryEquipmentFrame,
    mythicEquipmentFrame: snowprintIcons.mythicEquipmentFrame,
    relicEquipmentFrame: snowprintIcons.relicEquipmentFrame,
    meleeAttack: snowprintIcons.meleeAttack,
    rangedAttack: snowprintIcons.rangedAttack,
    hitsIcon: snowprintIcons.hitsIcon,
    damageAcid: snowprintIcons.damageAcid,
    damageBio: snowprintIcons.damageBio,
    damageBlast: snowprintIcons.damageBlast,
    damageBolter: snowprintIcons.damageBolter,
    damageChain: snowprintIcons.damageChain,
    damageDirectDamage: snowprintIcons.damageDirectDamage,
    damageEnergy: snowprintIcons.damageEnergy,
    damageEnmitic: snowprintIcons.damageEnmitic,
    damageEviscerate: snowprintIcons.damageEviscerate,
    damageFlame: snowprintIcons.damageFlame,
    damageGauss: snowprintIcons.damageGauss,
    damageHeavyRound: snowprintIcons.damageHeavyRound,
    damageLas: snowprintIcons.damageLas,
    damageMelta: snowprintIcons.damageMelta,
    damageNone: snowprintIcons.damageNone,
    damageParticle: snowprintIcons.damageParticle,
    damagePhysical: snowprintIcons.damagePhysical,
    damagePiercing: snowprintIcons.damagePiercing,
    damagePlasma: snowprintIcons.damagePlasma,
    damagePower: snowprintIcons.damagePower,
    damageProjectile: snowprintIcons.damageProjectile,
    damagePsychic: snowprintIcons.damagePsychic,
    damagePulse: snowprintIcons.damagePulse,
    damageToxic: snowprintIcons.damageToxic,
};

export const starsIcons = {
    mythicWings: snowprintStarsIcons.mythicWings,
    blueStar: snowprintStarsIcons.blueStar,
    redStar: redStar,
    goldStar: goldStar,
};
