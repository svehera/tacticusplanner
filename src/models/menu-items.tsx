import React from 'react';

import aunshi from '../assets/legendary-events/Aunshi.json';
import ragnar from '../assets/legendary-events/Ragnar.json';
import shadowsun from '../assets/legendary-events/Shadowsun.json';
import vitruvius from '../assets/legendary-events/Vitruvius.json';

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
import HowToRegIcon from '@mui/icons-material/HowToReg';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import TableChartIcon from '@mui/icons-material/TableChart';

import { CharacterImage } from '../shared-components/character-image';
import { faqMenuItem } from 'src/v2/pages/faq/faq.menu-item';
import { dirtyDozenMenuItem } from 'src/v2/pages/dirty-dozen/dirty-dozen.menu-item';

export class MenuItemTP {
    constructor(
        public label: string,
        public icon: React.ReactNode,
        public routeWeb: string,
        public title: string = '',
        public routeMobile: string = ''
    ) {
        this.routeMobile = '/mobile' + (routeMobile || routeWeb);
        this.title = title || label;
    }
}

export const menuItemById = {
    wyo: new MenuItemTP('Who You Own', <HowToRegIcon />, '/input/wyo'),
    campaignsProgress: new MenuItemTP('Campaigns Progress', <AppRegistrationIcon />, '/input/campaignsProgress'),
    inventory: new MenuItemTP('Inventory', <InventoryIcon />, '/input/inventory'),

    goals: new MenuItemTP('Goals', <TrackChangesIcon />, '/plan/goals'),
    dailyRaids: new MenuItemTP('Daily Raids', <EventRepeatIcon />, '/plan/dailyRaids'),
    leMasterTable: new MenuItemTP('LE Master Table', <TableChartIcon />, '/plan/leMasterTable'),
    shadowsun: new MenuItemTP(
        'Shadowsun LE',
        <CharacterImage icon={'ShadowSun.png'} imageSize={24} />,
        '/plan/le/shadowsun',
        `Shadowsun ${shadowsun.eventStage}/3 (${shadowsun.nextEventDate})`
    ),
    aunshi: new MenuItemTP(
        'Aun Shi LE',
        <CharacterImage icon={'Aun-shi.png'} imageSize={24} />,
        '/plan/le/aunshi',
        `Aun Shi ${aunshi.eventStage}/3 (${aunshi.nextEventDate})`
    ),
    ragnar: new MenuItemTP(
        'Ragnar LE',
        <CharacterImage icon={'Ragnar.png'} imageSize={24} />,
        '/plan/le/ragnar',
        `Ragnar ${ragnar.eventStage}/3 (${ragnar.nextEventDate})`
    ),
    vitruvius: new MenuItemTP(
        'Vitruvius LE',
        <CharacterImage icon={'vitruvius.png'} imageSize={24} />,
        '/plan/le/vitruvius',
        `Vitruvius ${vitruvius.eventStage}/3 (${vitruvius.nextEventDate})`
    ),

    characters: new MenuItemTP('Characters', <Diversity3Icon />, '/learn/characters'),
    upgrades: new MenuItemTP('Upgrades', <ListIcon />, '/learn/upgrades'),
    rankLookup: new MenuItemTP('Rank Lookup', <MilitaryTechIcon />, '/learn/rankLookup'),
    campaigns: new MenuItemTP('Campaigns', <FormatListNumberedIcon />, '/learn/campaigns'),
    dirtyDozen: dirtyDozenMenuItem,

    home: new MenuItemTP('Home', <HomeIcon />, '/home', 'Tacticus Planner'),
    contacts: new MenuItemTP('Contacts', <ContactEmergencyIcon />, '/contacts'),
    ty: new MenuItemTP('Thank You', <HealthAndSafetyIcon />, '/ty', 'Thank You Page'),
    faq: faqMenuItem,
};

export const inputSubMenu: MenuItemTP[] = [
    menuItemById['wyo'],
    menuItemById['campaignsProgress'],
    menuItemById['inventory'],
];

export const planSubMenu: MenuItemTP[] = [
    menuItemById['goals'],
    menuItemById['dailyRaids'],
    menuItemById['shadowsun'],
    menuItemById['aunshi'],
    menuItemById['ragnar'],
    menuItemById['vitruvius'],
    menuItemById['leMasterTable'],
];

export const learnSubMenu: MenuItemTP[] = [
    menuItemById['characters'],
    menuItemById['upgrades'],
    menuItemById['rankLookup'],
    menuItemById['campaigns'],
    menuItemById['dirtyDozen'],
];

export const miscMenuItems: MenuItemTP[] = [menuItemById['home'], menuItemById['contacts'], menuItemById['ty']];
