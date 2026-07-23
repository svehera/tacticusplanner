/* eslint-disable import-x/no-internal-modules */
import armourIcon from '@/assets/images/icons/armour.webp';
import blockIcon from '@/assets/images/icons/block.png';
import chanceIcon from '@/assets/images/icons/chance.png';
import critDamageIcon from '@/assets/images/icons/crit_dmg.png';
import deploymentIcon from '@/assets/images/icons/deployment.png';
import damageIcon from '@/assets/images/icons/dmg.webp';
import energyIcon from '@/assets/images/icons/energy.png';
import healthIcon from '@/assets/images/icons/health.webp';
import hitsIcon from '@/assets/images/icons/hits.webp';
import lreDefeatAllIcon from '@/assets/images/icons/lre-defeat-all.png';
import lreScoreIcon from '@/assets/images/icons/lre-score.png';
import meleeIcon from '@/assets/images/icons/melee.png';
import mowIcon from '@/assets/images/icons/mow.png';
import powerIcon from '@/assets/images/icons/power.png';
import rangedIcon from '@/assets/images/icons/ranged.png';
import redStar from '@/assets/images/icons/red star small.png';
import goldStar from '@/assets/images/icons/star small.png';
import warTokenIcon from '@/assets/images/icons/warToken.png';
import statHitIcon from '@/assets/images/snowprint_assets/stat_icons/ui_icon_stat_hit_01.png';
import statMeleeAttackIcon from '@/assets/images/snowprint_assets/stat_icons/ui_icon_stat_melee_01.png';
import statRangedAttackIcon from '@/assets/images/snowprint_assets/stat_icons/ui_icon_stat_rangedattack_01.png';
import archeoTechIcon from '@/assets/images/upgrades/archeotech bionics.png';

/* eslint-enable import-x/no-internal-modules */
import { snowprintIcons } from '@/fsd/5-shared/assets';

interface TacticusIcon {
    file: string;
    label: string;
}

export const tacticusIcons: Record<string, TacticusIcon> = {
    archeoTech: {
        file: archeoTechIcon,
        label: 'ArcheoTech',
    },
    blueStar: snowprintIcons.blueStar,
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
    blackstone: snowprintIcons.blackstone,
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
    statHits: {
        file: statHitIcon,
        label: 'Hits',
    },
    statRangedAttack: {
        file: statRangedAttackIcon,
        label: 'Ranged',
    },
    statMeleeAttack: {
        file: statMeleeAttackIcon,
        label: 'Melee',
    },
    lreScore: {
        file: lreScoreIcon,
        label: 'Score',
    },
    lreDefeatAll: {
        file: lreDefeatAllIcon,
        label: 'Defeat All',
    },
    survivalCurrencyHalloween2025: snowprintIcons.eventCurrencyHalloween2025Icon,
    checkmark: snowprintIcons.checkmark,
    legendaryEventToken: snowprintIcons.legendaryEventToken,
    onslaughtToken: snowprintIcons.onslaughtToken,
    salvageRunToken: snowprintIcons.salvageRunToken,
    arenaToken: snowprintIcons.arenaToken,
    survivalToken: snowprintIcons.survivalToken,
    guildRaidToken: snowprintIcons.guildRaidToken,
    bombToken: snowprintIcons.bombToken,
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
    commonFrame: snowprintIcons.commonFrame,
    uncommonFrame: snowprintIcons.uncommonFrame,
    rareFrame: snowprintIcons.rareFrame,
    epicFrame: snowprintIcons.epicFrame,
    legendaryFrame: snowprintIcons.legendaryFrame,
    mythicFrame: snowprintIcons.mythicFrame,
    mowCommonFrame: snowprintIcons.mowCommonFrame,
    mowUncommonFrame: snowprintIcons.mowUncommonFrame,
    mowRareFrame: snowprintIcons.mowRareFrame,
    mowEpicFrame: snowprintIcons.mowEpicFrame,
    mowLegendaryFrame: snowprintIcons.mowLegendaryFrame,
    mowMythicFrame: snowprintIcons.mowMythicFrame,
    shard: snowprintIcons.shard,
    mythicShard: snowprintIcons.mythicShard,
    movement: snowprintIcons.movement,
    leShard: snowprintIcons.leShard,
    raidTicket: snowprintIcons.raidTicket,
    bloodAngelsReq: snowprintIcons.bloodAngelsReq,
    orksReq: snowprintIcons.orksReq,
    armageddonCurrency: snowprintIcons.armageddonCurrency,
    seasonalEventCurrencyApril2026: snowprintIcons.seasonalEventCurrencyApril2026,
    seasonalEventCurrencyAugust2026: snowprintIcons.seasonalEventCurrencyAugust2026,
    seasonalEventCurrencyHolidays2025: snowprintIcons.seasonalEventCurrencyHolidays2025,
    seasonalEventCurrencyMarch2026: snowprintIcons.seasonalEventCurrencyMarch2026,
    seasonalEventCurrencyMay2026: snowprintIcons.seasonalEventCurrencyMay2026,
    crusadeBomb: snowprintIcons.crusadeBomb,
    crusadeIntel: snowprintIcons.crusadeIntel,
    crusadeNpc: snowprintIcons.crusadeNpc,
    crusadeCurrency: snowprintIcons.crusadeCurrency,
    seasonalEventAugust2026AvatarFrame: snowprintIcons.seasonalEventAugust2026AvatarFrame,
    guildCredits: snowprintIcons.guildCredits,
    warCredits: snowprintIcons.warCredits,
    archeotech: snowprintIcons.archeotech,
    salvage: snowprintIcons.salvage,
    mythicSalvage: snowprintIcons.mythicSalvage,
    draftAbilityBadgesCommon: snowprintIcons.draftAbilityBadgesCommon,
    draftAbilityBadgesUncommon: snowprintIcons.draftAbilityBadgesUncommon,
    draftAbilityBadgesRare: snowprintIcons.draftAbilityBadgesRare,
    draftAbilityBadgesEpic: snowprintIcons.draftAbilityBadgesEpic,
    draftAbilityBadgesLegendary: snowprintIcons.draftAbilityBadgesLegendary,
    draftAbilityBadgesMythic: snowprintIcons.draftAbilityBadgesMythic,
    draftOrbsUncommon: snowprintIcons.draftOrbsUncommon,
    draftOrbsRare: snowprintIcons.draftOrbsRare,
    draftOrbsEpic: snowprintIcons.draftOrbsEpic,
    draftOrbsLegendary: snowprintIcons.draftOrbsLegendary,
    draftOrbsMythic: snowprintIcons.draftOrbsMythic,
    draftMachinesOfWarComponents: snowprintIcons.draftMachinesOfWarComponents,
    allianceImperial: snowprintIcons.allianceImperial,
    allianceChaos: snowprintIcons.allianceChaos,
    allianceXenos: snowprintIcons.allianceXenos,
    stamina: snowprintIcons.energy,
    itemUnknown: snowprintIcons.itemUnknown,
    upgradeCommon: snowprintIcons.upgradeCommon,
    upgradeUncommon: snowprintIcons.upgradeUncommon,
    upgradeRare: snowprintIcons.upgradeRare,
    upgradeEpic: snowprintIcons.upgradeEpic,
    upgradeLegendary: snowprintIcons.upgradeLegendary,
    upgradeMythic: snowprintIcons.upgradeMythic,
};

export const starsIcons = {
    mythicWings: snowprintIcons.mythicWings.file,
    blueStar: snowprintIcons.blueStar.file,
    redStar: redStar,
    goldStar: goldStar,
};
