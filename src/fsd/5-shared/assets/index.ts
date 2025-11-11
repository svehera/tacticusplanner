/* eslint-disable import-x/no-internal-modules */
import commonBook from './snowprint/books/ui_icon_consumable_xp_book_0.png';
import uncommonBook from './snowprint/books/ui_icon_consumable_xp_book_1.png';
import rareBook from './snowprint/books/ui_icon_consumable_xp_book_2.png';
import epicBook from './snowprint/books/ui_icon_consumable_xp_book_3.png';
import legendaryBook from './snowprint/books/ui_icon_consumable_xp_book_4.png';
import mythicBook from './snowprint/books/ui_icon_consumable_xp_book_5.png';
import checkmark from './snowprint/misc/ui_icon_checkmark_default.png';
import blessedReqOrder from './snowprint/misc/ui_icon_resource_blessed_req_order.png';
import coin from './snowprint/misc/ui_icon_resource_coin.png';
import eventCurrencyHalloween2025Icon from './snowprint/misc/ui_icon_resource_event_currency_halloween_25.png';
import defeatWaves from './snowprint/misc/ui_icon_resource_event_defeatwaves.png';
import reqOrder from './snowprint/misc/ui_icon_resource_req_order.png';
import arenaToken from './snowprint/misc/ui_icon_resource_token_arena.png';
import legendaryEventToken from './snowprint/misc/ui_icon_resource_token_legendary_events.png';
import onslaughtToken from './snowprint/misc/ui_icon_resource_token_onslaught.png';
import salvageRunToken from './snowprint/misc/ui_icon_resource_token_salvage_run.png';
import survivalToken from './snowprint/misc/ui_icon_resource_token_survival.png';
import commonForgeBadge from './snowprint/resources/ui_forge_badges_common.png';
import epicForgeBadge from './snowprint/resources/ui_forge_badges_epic.png';
import legendaryForgeBadge from './snowprint/resources/ui_forge_badges_legendary.png';
import mythicForgeBadge from './snowprint/resources/ui_forge_badges_mythic.png';
import rareForgeBadge from './snowprint/resources/ui_forge_badges_rare.png';
import uncommonForgeBadge from './snowprint/resources/ui_forge_badges_uncommon.png';
import chaosOrb from './snowprint/resources/ui_hero_ascension_orbs_chaos.png';
import epicOrb from './snowprint/resources/ui_hero_ascension_orbs_epic.png';
import imperialOrb from './snowprint/resources/ui_hero_ascension_orbs_imperial.png';
import legendaryOrb from './snowprint/resources/ui_hero_ascension_orbs_legendary.png';
import mythicOrb from './snowprint/resources/ui_hero_ascension_orbs_mythic.png';
import rareOrb from './snowprint/resources/ui_hero_ascension_orbs_rare.png';
import uncommonOrb from './snowprint/resources/ui_hero_ascension_orbs_uncommon.png';
import xenosOrb from './snowprint/resources/ui_hero_ascension_orbs_xenos.png';
import chaosComponent from './snowprint/resources/ui_machines_of_war_tokens_chaos.png';
import imperialComponent from './snowprint/resources/ui_machines_of_war_tokens_imperial.png';
import xenosComponent from './snowprint/resources/ui_machines_of_war_tokens_xenos.png';
import blueStar from './snowprint/stars/ui_icon_star_legendary_large.png';
import mythicWings from './snowprint/stars/ui_icon_star_mythic.png';

export interface SnowprintIcon {
    file: string;
    label: string;
}

export const snowprintIcons: Record<string, SnowprintIcon> = {
    checkmark: {
        file: checkmark,
        label: 'Checkmark',
    },
    blessedReqOrder: {
        file: blessedReqOrder,
        label: 'Blessed Requisition Order',
    },
    coin: {
        file: coin,
        label: 'Coin',
    },
    eventCurrencyHalloween2025Icon: {
        file: eventCurrencyHalloween2025Icon,
        label: 'Halloween 2025 Event Currency',
    },
    reqOrder: {
        file: reqOrder,
        label: 'Requisition Order',
    },
    defeatWaves: {
        file: defeatWaves,
        label: 'Defeat Waves',
    },
    legendaryEventToken: {
        file: legendaryEventToken,
        label: 'Legendary Event Token',
    },
    onslaughtToken: {
        file: onslaughtToken,
        label: 'Onslaught Token',
    },
    arenaToken: {
        file: arenaToken,
        label: 'Arena Token',
    },
    salvageRunToken: {
        file: salvageRunToken,
        label: 'Salvage Run Token',
    },
    survivalToken: {
        file: survivalToken,
        label: 'Survival Token',
    },
    blueStar: {
        file: blueStar,
        label: 'Legendary Star',
    },
    mythicWings: {
        file: mythicWings,
        label: 'Mythic Wings',
    },
    commonBook: {
        file: commonBook,
        label: 'Common XP Book',
    },
    uncommonBook: {
        file: uncommonBook,
        label: 'Uncommon XP Book',
    },
    rareBook: {
        file: rareBook,
        label: 'Rare XP Book',
    },
    epicBook: {
        file: epicBook,
        label: 'Epic XP Book',
    },
    legendaryBook: {
        file: legendaryBook,
        label: 'Legendary XP Book',
    },
    mythicBook: {
        file: mythicBook,
        label: 'Mythic XP Book',
    },
    uncommonOrb: {
        file: uncommonOrb,
        label: 'Uncommon Orb',
    },
    rareOrb: {
        file: rareOrb,
        label: 'Rare Orb',
    },
    epicOrb: {
        file: epicOrb,
        label: 'Epic Orb',
    },
    legendaryOrb: {
        file: legendaryOrb,
        label: 'Legendary Orb',
    },
    mythicOrb: {
        file: mythicOrb,
        label: 'Mythic Orb',
    },
    imperialOrb: {
        file: imperialOrb,
        label: 'Imperial Orb',
    },
    xenosOrb: {
        file: xenosOrb,
        label: 'Xenos Orb',
    },
    chaosOrb: {
        file: chaosOrb,
        label: 'Chaos Orb',
    },
    commonForgeBadge: {
        file: commonForgeBadge,
        label: 'Common Forge Badge',
    },
    uncommonForgeBadge: {
        file: uncommonForgeBadge,
        label: 'Uncommon Forge Badge',
    },
    rareForgeBadge: {
        file: rareForgeBadge,
        label: 'Rare Forge Badge',
    },
    epicForgeBadge: {
        file: epicForgeBadge,
        label: 'Epic Forge Badge',
    },
    legendaryForgeBadge: {
        file: legendaryForgeBadge,
        label: 'Legendary Forge Badge',
    },
    mythicForgeBadge: {
        file: mythicForgeBadge,
        label: 'Mythic Forge Badge',
    },
    imperialComponent: {
        file: imperialComponent,
        label: 'Imperial Component',
    },
    xenosComponent: {
        file: xenosComponent,
        label: 'Xenos Component',
    },
    chaosComponent: {
        file: chaosComponent,
        label: 'Chaos Component',
    },
};

export const snowprintStarsIcons = {
    mythicWings,
    blueStar,
};
