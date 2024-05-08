import React from 'react';

import ragnar from '../assets/legendary-events/Ragnar.json';
import vitruvius from '../assets/legendary-events/Vitruvius.json';
import kharn from '../assets/legendary-events/Kharn.json';

import ListIcon from '@mui/icons-material/List';
import InventoryIcon from '@mui/icons-material/Inventory';
import HomeIcon from '@mui/icons-material/Home';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import ContactEmergencyIcon from '@mui/icons-material/ContactEmergency';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import TableChartIcon from '@mui/icons-material/TableChart';

import { CharacterImage } from '../shared-components/character-image';
import { faqMenuItem } from 'src/v2/pages/faq/faq.menu-item';
import { dirtyDozenMenuItem } from 'src/v2/pages/dirty-dozen/dirty-dozen.menu-item';
import { insightsMenuItem } from 'src/v2/pages/insights/insights.menu-item';
import { wyoMenuItem } from 'src/v2/pages/who-you-own/who-you-own.menu-item';
import { guildWarOffenseMenuItem } from 'src/v2/pages/guild-war-offense/guild-war-offense.menu-item';
import { guildWarDefenseMenuItem } from 'src/v2/pages/guild-war-defense/guild-war-defense.menu-item';
import { guildWarZonesMenuItem } from 'src/v2/pages/guild-war-layout/guild-war-zones-menu.item';
import { guildMenuItem } from 'src/v2/pages/guild/guild.menu-item';
import { guildInsightsMenuItem } from 'src/v2/pages/guild-insights/guild-insights.menu-item';

export class MenuItemTP {
    constructor(
        public label: string,
        public icon: React.ReactNode,
        public routeWeb: string,
        public title: string = '',
        public routeMobile: string = '',
        public subMenu: MenuItemTP[] = []
    ) {
        this.routeMobile = '/mobile' + (routeMobile || routeWeb);
        this.title = title || label;
    }
}

export const menuItemById = {
    wyo: wyoMenuItem,
    campaignsProgress: new MenuItemTP('Campaigns Progress', <AppRegistrationIcon />, '/input/campaignsProgress'),
    inventory: new MenuItemTP('Inventory', <InventoryIcon />, '/input/inventory'),

    goals: new MenuItemTP('Goals', <TrackChangesIcon />, '/plan/goals'),
    dailyRaids: new MenuItemTP('Daily Raids', <EventRepeatIcon />, '/plan/dailyRaids'),
    leMasterTable: new MenuItemTP('Master Table', <TableChartIcon />, '/plan/leMasterTable'),
    shadowsun: new MenuItemTP(
        'Shadowsun',
        <CharacterImage icon={'ShadowSun.png'} imageSize={24} />,
        '/plan/le/shadowsun',
        'Shadowsun (Finished)'
    ),
    ragnar: new MenuItemTP(
        'Ragnar',
        <CharacterImage icon={'Ragnar.png'} imageSize={24} />,
        '/plan/le/ragnar',
        `Ragnar ${ragnar.eventStage}/3 (${ragnar.nextEventDate})`
    ),
    vitruvius: new MenuItemTP(
        'Vitruvius',
        <CharacterImage icon={'vitruvius.png'} imageSize={24} />,
        '/plan/le/vitruvius',
        `Vitruvius ${vitruvius.eventStage}/3 (${vitruvius.nextEventDate})`
    ),
    aunshi: new MenuItemTP(
        'Aun Shi',
        <CharacterImage icon={'Aun-shi.png'} imageSize={24} />,
        '/plan/le/aunshi',
        'Aun Shi (Finished)'
    ),
    kharn: new MenuItemTP(
        'Kharn',
        <CharacterImage icon={'kharn.png'} imageSize={24} />,
        '/plan/le/kharn',
        `Kharn ${kharn.eventStage}/3 (${kharn.nextEventDate})`
    ),
    characters: new MenuItemTP('Characters', <Diversity3Icon />, '/learn/characters'),
    upgrades: new MenuItemTP('Upgrades', <ListIcon />, '/learn/upgrades'),
    rankLookup: new MenuItemTP('Rank Lookup', <MilitaryTechIcon />, '/learn/rankLookup'),
    campaigns: new MenuItemTP('Campaigns', <FormatListNumberedIcon />, '/learn/campaigns'),
    dirtyDozen: dirtyDozenMenuItem,
    insights: insightsMenuItem,

    home: new MenuItemTP('Home', <HomeIcon />, '/home', 'Tacticus Planner'),
    contacts: new MenuItemTP('Contacts', <ContactEmergencyIcon />, '/contacts'),
    ty: new MenuItemTP('Thank You', <HealthAndSafetyIcon />, '/ty', 'Thank You Page'),
    faq: faqMenuItem,
    defense: guildWarDefenseMenuItem,
    offense: guildWarOffenseMenuItem,
    zones: guildWarZonesMenuItem,
    guild: guildMenuItem,
    guildInsights: guildInsightsMenuItem,
};

export const inputSubMenu: MenuItemTP[] = [
    menuItemById['wyo'],
    menuItemById['campaignsProgress'],
    menuItemById['inventory'],
    menuItemById['guild'],
];

export const planSubMenuWeb: MenuItemTP[] = [
    menuItemById['goals'],
    menuItemById['dailyRaids'],
    new MenuItemTP('Guild War', menuItemById['defense'].icon, '', '', '', [
        menuItemById['defense'],
        menuItemById['offense'],
        menuItemById['zones'],
    ]),
    new MenuItemTP('LRE', menuItemById['leMasterTable'].icon, '', '', '', [
        menuItemById['leMasterTable'],
        menuItemById['kharn'],
        menuItemById['vitruvius'],
        menuItemById['ragnar'],
    ]),
    new MenuItemTP('LRE Archive', menuItemById['leMasterTable'].icon, '', '', '', [
        menuItemById['shadowsun'],
        menuItemById['aunshi'],
    ]),
];

export const planSubMenu: MenuItemTP[] = [
    menuItemById['goals'],
    menuItemById['dailyRaids'],
    menuItemById['defense'],
    menuItemById['offense'],
    menuItemById['zones'],
    menuItemById['leMasterTable'],
    menuItemById['kharn'],
    menuItemById['ragnar'],
    menuItemById['vitruvius'],
];

export const learnSubMenu: MenuItemTP[] = [
    menuItemById['characters'],
    menuItemById['upgrades'],
    menuItemById['rankLookup'],
    menuItemById['campaigns'],
    menuItemById['dirtyDozen'],
    menuItemById['insights'],
    menuItemById['guildInsights'],
];

export const miscMenuItems: MenuItemTP[] = [menuItemById['home'], menuItemById['contacts'], menuItemById['ty']];
