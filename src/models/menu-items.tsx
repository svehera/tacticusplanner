import ArchiveIcon from '@mui/icons-material/Archive';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BuildIcon from '@mui/icons-material/Build';
import CastleIcon from '@mui/icons-material/Castle';
import ContactEmergencyIcon from '@mui/icons-material/ContactEmergency';
import EventIcon from '@mui/icons-material/Event';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory';
import ListIcon from '@mui/icons-material/List';
import MapIcon from '@mui/icons-material/Map';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TableChartIcon from '@mui/icons-material/TableChart';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import React from 'react';

import { faqMenuItem } from '@/fsd/1-pages/faq/faq.menu-item';
import { guidesMenuItem } from '@/fsd/1-pages/guides/guides-menu.item';
import { guildMenuItem } from '@/fsd/1-pages/guild/guild.menu-item';
import { guildApiMenuItem } from '@/fsd/1-pages/guild-api/guild-api.menu-item';
import { guildInsightsMenuItem } from '@/fsd/1-pages/guild-insights/guild-insights.menu-item';
import { guildWarZonesMenuItem } from '@/fsd/1-pages/guild-war-layout/guild-war-zones-menu.item';
import { equipmentMenuItem } from '@/fsd/1-pages/input-equipment/equipment.menu-item';
import { guildRosterSnapshotsMenuItem } from '@/fsd/1-pages/input-guild-roster-snapshots/guild-roster-snapshots.menu-item';
import { onslaughtMenuItem } from '@/fsd/1-pages/input-onslaught/onslaught.menu-item';
import { myProgressMenuItem } from '@/fsd/1-pages/input-progress/my-progress.menu-item';
import { resourcesMenuItem } from '@/fsd/1-pages/input-resources/resources.menu-item';
import { rosterSnapshotsMenuItem } from '@/fsd/1-pages/input-roster-snapshots/roster-snapshots.menu-item';
import { xpIncomeMenuItem } from '@/fsd/1-pages/input-xp-income/xp-income.menu-item';
import { insightsMenuItem } from '@/fsd/1-pages/insights/insights.menu-item';
import { dirtyDozenMenuItem } from '@/fsd/1-pages/learn-dirty-dozen';
import { guildPerformanceMenuItem } from '@/fsd/1-pages/learn-guild-performance';
import { mowLookupMenuItem } from '@/fsd/1-pages/learn-mow';
import { armageddonMenuItem } from '@/fsd/1-pages/plan-armageddon/armageddon.menu-item';
import { bulkGoalCreatorMenuItem } from '@/fsd/1-pages/plan-bulk-goals/bulk-goal-creator.menu-item';
import { campaignProgressionMenuItem } from '@/fsd/1-pages/plan-campaign-progression';
import { cesMenuItem } from '@/fsd/1-pages/plan-ces/ces.menu-item';
import { activeLreMenuItems, inactiveLreMenuItems } from '@/fsd/1-pages/plan-lre';
import { questsMenuItem } from '@/fsd/1-pages/plan-quests/quests.menu-item';
import { teams2MenuItem } from '@/fsd/1-pages/plan-teams2/teams2.menu-item';
import { warDefense2MenuItem } from '@/fsd/1-pages/plan-war-defense-2/war-defense2.menu-item';
import { warOffense2MenuItem } from '@/fsd/1-pages/plan-war-offense2/war-offense2.menu-item';
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
    onslaught: onslaughtMenuItem,
    inventory: new MenuItemTP('Inventory', <InventoryIcon />, '/input/inventory'),
    resources: resourcesMenuItem,
    equipment: equipmentMenuItem,
    goals: new MenuItemTP('Goals', <TrackChangesIcon />, '/plan/goals'),
    dailyRaids: new MenuItemTP('Daily Raids', <EventRepeatIcon />, '/plan/dailyRaids'),
    leMasterTable: new MenuItemTP('Master Table', <TableChartIcon />, '/plan/leMasterTable'),
    characters: new MenuItemTP('Characters', <PersonIcon />, '/learn/characters'),
    npcs: new MenuItemTP('NPCs', <SmartToyIcon />, '/learn/npcs'),
    upgrades: new MenuItemTP('Upgrades', <UpgradeIcon />, '/learn/upgrades'),
    learnEquipment: new MenuItemTP('Equipment', <BuildIcon />, '/learn/equipment'),
    rankLookup: new MenuItemTP('Rank Lookup', <MilitaryTechIcon />, '/learn/rankLookup'),
    mowLookup: mowLookupMenuItem,
    campaigns: new MenuItemTP('Campaigns', <MapIcon />, '/learn/campaigns'),
    hses: new MenuItemTP('Home-Screen Events', <EventIcon />, '/plan/hse'),
    bulkGoalCreator: bulkGoalCreatorMenuItem,
    dirtyDozen: dirtyDozenMenuItem,
    insights: insightsMenuItem,
    armageddon: armageddonMenuItem,
    campaignProgression: campaignProgressionMenuItem,
    rosterSnapshots: rosterSnapshotsMenuItem,
    guildRosterSnapshots: guildRosterSnapshotsMenuItem,
    teams2: teams2MenuItem,
    warOffense2: warOffense2MenuItem,
    warDefense2: warDefense2MenuItem,
    home: new MenuItemTP('Home', <HomeIcon />, '/home', 'Tacticus Planner'),
    contacts: new MenuItemTP('Contacts', <ContactEmergencyIcon />, '/contacts'),
    ty: new MenuItemTP('Thank You', <VolunteerActivismIcon />, '/ty', 'Thank You Page'),
    faq: faqMenuItem,
    zones: guildWarZonesMenuItem,
    guild: guildMenuItem,
    guildApi: guildApiMenuItem,
    guildInsights: guildInsightsMenuItem,
    guildPerformance: guildPerformanceMenuItem,
    guides: guidesMenuItem,
    xpIncome: xpIncomeMenuItem,
    quests: questsMenuItem,
    ces: cesMenuItem,
};

export const inputSubMenu: MenuItemTP[] = [
    menuItemById['wyo'],
    menuItemById['rosterSnapshots'],
    menuItemById['guildRosterSnapshots'],
    menuItemById['onslaught'],
    menuItemById['myProgress'],
    menuItemById['inventory'],
    menuItemById['xpIncome'],
    menuItemById['resources'],
    menuItemById['equipment'],
    menuItemById['guild'],
];

export const planSubMenuWeb: MenuItemTP[] = [
    menuItemById['goals'],
    menuItemById['dailyRaids'],
    menuItemById['teams2'],
    new MenuItemTP('Guild War', <CastleIcon />, '', '', '', [
        menuItemById['warOffense2'],
        menuItemById['warDefense2'],
        menuItemById['zones'],
    ]),
    new MenuItemTP('LRE', <AutoAwesomeIcon />, '', '', '', [menuItemById['leMasterTable'], ...activeLreMenuItems]),
    new MenuItemTP('LRE Archive', <ArchiveIcon />, '', '', '', inactiveLreMenuItems),
    menuItemById['armageddon'],
    menuItemById['campaignProgression'],
    menuItemById['quests'],
    menuItemById['ces'],
    menuItemById['hses'],
    menuItemById['bulkGoalCreator'],
];

export const planSubMenu: MenuItemTP[] = [
    menuItemById['goals'],
    menuItemById['dailyRaids'],
    menuItemById['teams2'],
    menuItemById['warDefense2'],
    menuItemById['warOffense2'],
    menuItemById['zones'],
    menuItemById['leMasterTable'],
    ...activeLreMenuItems,
    menuItemById['armageddon'],
    menuItemById['quests'],
    menuItemById['campaignProgression'],
    menuItemById['hses'],
    menuItemById['bulkGoalCreator'],
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
    menuItemById['guildPerformance'],
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
    menuItemById['guildPerformance'],
    menuItemById['guildApi'],
    menuItemById['guildInsights'],
];

export const librarySubMenu: MenuItemTP[] = [
    new MenuItemTP('Lookups', <TableChartIcon />, '', '', '', [
        menuItemById['rankLookup'],
        menuItemById['mowLookup'],
        menuItemById['characters'],
        menuItemById['npcs'],
        menuItemById['upgrades'],
        new MenuItemTP('Equipment Lookup', <ListIcon />, '/learn/equipment'),
        menuItemById['campaigns'],
    ]),
    menuItemById['guides'],
    menuItemById['dirtyDozen'],
    menuItemById['insights'],
    menuItemById['guildPerformance'],
    menuItemById['guildApi'],
    menuItemById['guildInsights'],
];

export const NAV_SECTIONS = [
    { key: 'My Game' as const, items: inputSubMenu },
    { key: 'Plan' as const, items: planSubMenuWeb },
    { key: 'Library' as const, items: librarySubMenu },
];

export const miscMenuItems: MenuItemTP[] = [menuItemById['home'], menuItemById['contacts'], menuItemById['ty']];
