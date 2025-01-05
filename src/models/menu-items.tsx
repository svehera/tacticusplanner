import React from 'react';

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

import { faqMenuItem } from 'src/v2/pages/faq/faq.menu-item';
import { dirtyDozenMenuItem } from 'src/v2/pages/dirty-dozen/dirty-dozen.menu-item';
import { insightsMenuItem } from 'src/v2/pages/insights/insights.menu-item';
import { wyoMenuItem } from 'src/v2/pages/who-you-own/who-you-own.menu-item';
import { campaignProgressionMenuItem } from 'src/v2/pages/campaign-progression/campaign-progression.menu-item';
import { guildWarOffenseMenuItem } from 'src/v2/pages/guild-war-offense/guild-war-offense.menu-item';
import { guildWarDefenseMenuItem } from 'src/v2/pages/guild-war-defense/guild-war-defense.menu-item';
import { guildWarZonesMenuItem } from 'src/v2/pages/guild-war-layout/guild-war-zones-menu.item';
import { guildMenuItem } from 'src/v2/pages/guild/guild.menu-item';
import { guildInsightsMenuItem } from 'src/v2/pages/guild-insights/guild-insights.menu-item';
import { teamsMenuItem } from 'src/v2/pages/teams/teams.menu-item';
import { mowLookupMenuItem } from 'src/v2/pages/mow-lookup/mow-lookup.menu-item';
import { guidesMenuItem } from 'src/v2/pages/guides/guides-menu.item';
import { activeLreMenuItems, inactiveLreMenuItems } from 'src/v2/pages/lre/lre.menu-item';

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
    characters: new MenuItemTP('Characters', <Diversity3Icon />, '/learn/characters'),
    upgrades: new MenuItemTP('Upgrades', <ListIcon />, '/learn/upgrades'),
    rankLookup: new MenuItemTP('Rank Lookup', <MilitaryTechIcon />, '/learn/rankLookup'),
    mowLookup: mowLookupMenuItem,
    campaigns: new MenuItemTP('Campaigns', <FormatListNumberedIcon />, '/learn/campaigns'),
    dirtyDozen: dirtyDozenMenuItem,
    insights: insightsMenuItem,
    campaignProgression: campaignProgressionMenuItem,

    home: new MenuItemTP('Home', <HomeIcon />, '/home', 'Tacticus Planner'),
    contacts: new MenuItemTP('Contacts', <ContactEmergencyIcon />, '/contacts'),
    ty: new MenuItemTP('Thank You', <HealthAndSafetyIcon />, '/ty', 'Thank You Page'),
    faq: faqMenuItem,
    defense: guildWarDefenseMenuItem,
    offense: guildWarOffenseMenuItem,
    zones: guildWarZonesMenuItem,
    guild: guildMenuItem,
    guildInsights: guildInsightsMenuItem,
    teams: teamsMenuItem,
    guides: guidesMenuItem,
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
    menuItemById['teams'],
    new MenuItemTP('Guild War', menuItemById['defense'].icon, '', '', '', [
        menuItemById['defense'],
        menuItemById['offense'],
        menuItemById['zones'],
    ]),
    new MenuItemTP('LRE', <TableChartIcon />, '', '', '', [menuItemById['leMasterTable'], ...activeLreMenuItems]),
    new MenuItemTP('LRE Archive', <TableChartIcon />, '', '', '', inactiveLreMenuItems),
    menuItemById['campaignProgression'],
];

export const planSubMenu: MenuItemTP[] = [
    menuItemById['goals'],
    menuItemById['dailyRaids'],
    menuItemById['teams'],
    menuItemById['defense'],
    menuItemById['offense'],
    menuItemById['zones'],
    menuItemById['leMasterTable'],
    ...activeLreMenuItems,
];

export const learnSubMenu: MenuItemTP[] = [
    menuItemById['guides'],
    menuItemById['characters'],
    menuItemById['upgrades'],
    menuItemById['rankLookup'],
    menuItemById['mowLookup'],
    menuItemById['campaigns'],
    menuItemById['dirtyDozen'],
    menuItemById['insights'],
    menuItemById['guildInsights'],
];

export const miscMenuItems: MenuItemTP[] = [menuItemById['home'], menuItemById['contacts'], menuItemById['ty']];
