import ContactEmergencyIcon from '@mui/icons-material/ContactEmergency';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory';
import ListIcon from '@mui/icons-material/List';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import TableChartIcon from '@mui/icons-material/TableChart';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import React from 'react';

import { faqMenuItem } from '@/fsd/1-pages/faq/faq.menu-item';
import { guidesMenuItem } from '@/fsd/1-pages/guides/guides-menu.item';
import { guildMenuItem } from '@/fsd/1-pages/guild/guild.menu-item';
import { guildApiMenuItem } from '@/fsd/1-pages/guild-api/guild-api.menu-item';
import { guildInsightsMenuItem } from '@/fsd/1-pages/guild-insights/guild-insights.menu-item';
import { guildWarDefenseMenuItem } from '@/fsd/1-pages/guild-war-defense/guild-war-defense.menu-item';
import { guildWarZonesMenuItem } from '@/fsd/1-pages/guild-war-layout/guild-war-zones-menu.item';
import { guildWarOffenseMenuItem } from '@/fsd/1-pages/guild-war-offense/guild-war-offense.menu-item';
import { myProgressMenuItem } from '@/fsd/1-pages/input-progress/my-progress.menu-item';
import { resourcesMenuItem } from '@/fsd/1-pages/input-resources/resources.menu-item';
import { xpIncomeMenuItem } from '@/fsd/1-pages/input-xp-income/xp-income.menu-item';
import { insightsMenuItem } from '@/fsd/1-pages/insights/insights.menu-item';
import { dirtyDozenMenuItem } from '@/fsd/1-pages/learn-dirty-dozen';
import { mowLookupMenuItem } from '@/fsd/1-pages/learn-mow';
import { campaignProgressionMenuItem } from '@/fsd/1-pages/plan-campaign-progression';
import { activeLreMenuItems, inactiveLreMenuItems } from '@/fsd/1-pages/plan-lre';
import { teamsMenuItem } from '@/fsd/1-pages/teams/teams.menu-item';
import { wyoMenuItem } from '@/fsd/1-pages/who-you-own/who-you-own.menu-item';

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
    myProgress: myProgressMenuItem,
    inventory: new MenuItemTP('Inventory', <InventoryIcon />, '/input/inventory'),
    resources: resourcesMenuItem,
    goals: new MenuItemTP('Goals', <TrackChangesIcon />, '/plan/goals'),
    dailyRaids: new MenuItemTP('Daily Raids', <EventRepeatIcon />, '/plan/dailyRaids'),
    leMasterTable: new MenuItemTP('Master Table', <TableChartIcon />, '/plan/leMasterTable'),
    characters: new MenuItemTP('Characters', <Diversity3Icon />, '/learn/characters'),
    npcs: new MenuItemTP('NPCs', <Diversity3Icon />, '/learn/npcs'),
    upgrades: new MenuItemTP('Upgrades', <ListIcon />, '/learn/upgrades'),
    learnEquipment: new MenuItemTP('Equipment', <ListIcon />, '/learn/equipment'),
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
    guildApi: guildApiMenuItem,
    guildInsights: guildInsightsMenuItem,
    teams: teamsMenuItem,
    guides: guidesMenuItem,
    xpIncome: xpIncomeMenuItem,
};

export const inputSubMenu: MenuItemTP[] = [
    menuItemById['wyo'],
    menuItemById['myProgress'],
    menuItemById['inventory'],
    menuItemById['xpIncome'],
    menuItemById['resources'],
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

export const learnSubMenuMobile: MenuItemTP[] = [
    menuItemById['guides'],
    menuItemById['characters'],
    menuItemById['npcs'],
    menuItemById['upgrades'],
    menuItemById['learnEquipment'],
    menuItemById['rankLookup'],
    menuItemById['mowLookup'],
    menuItemById['campaigns'],
    menuItemById['dirtyDozen'],
    menuItemById['insights'],
    menuItemById['guildApi'],
    menuItemById['guildInsights'],
];

export const learnSubMenu: MenuItemTP[] = [
    new MenuItemTP('Tacticus', <TableChartIcon />, '', '', '', [
        menuItemById['rankLookup'],
        menuItemById['mowLookup'],
        menuItemById['characters'],
        menuItemById['npcs'],
        menuItemById['upgrades'],
        menuItemById['learnEquipment'],
        menuItemById['campaigns'],
    ]),
    menuItemById['guides'],
    menuItemById['dirtyDozen'],
    menuItemById['insights'],
    menuItemById['guildApi'],
    menuItemById['guildInsights'],
];

export const miscMenuItems: MenuItemTP[] = [menuItemById['home'], menuItemById['contacts'], menuItemById['ty']];
