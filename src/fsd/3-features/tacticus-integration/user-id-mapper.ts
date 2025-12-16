// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IGuildMember } from '@/models/interfaces';

const adjectives = [
    'Vengeful',
    'Imperial',
    'Heretic',
    'Ancient',
    'Fallen',
    'Blessed',
    'Cursed',
    'Divine',
    'Corrupt',
    'Eternal',
    'Savage',
    'Zealous',
    'Grim',
    'Dark',
    'Holy',
    'Righteous',
    'Chaotic',
    'Loyal',
    'Rogue',
    'Fierce',
];

const factions = [
    'Ultramarine',
    'BlackLegion',
    'Necron',
    'Ork',
    'DeathGuard',
    'ThousandSon',
    'Aeldari',
    'Tyranid',
    'SpaceWolf',
    'Mechanicus',
    'Sororitas',
    'DarkAngel',
    'WorldEater',
    'BloodAngel',
    'Custodian',
    'TauEmpire',
];

const units = [
    'Warrior',
    'Captain',
    'Librarian',
    'Chaplain',
    'Terminator',
    'Vindicator',
    'Dreadnought',
    'Assassin',
    'Guardian',
    'Warden',
    'Inquisitor',
    'Crusader',
    'Centurion',
    'Veteran',
    'Champion',
    'Praetor',
    'Legionary',
    'Destroyer',
    'Sentinel',
    'Vanguard',
];

export const mapUserIdToName =
    (members: IGuildMember[]) =>
    (userId: string): string => {
        const existingUser = members.find(member => member.userId === userId);
        if (existingUser) {
            return existingUser.inGameName || existingUser.username;
        }

        const bytes = userId.replace(/-/g, '').split('');

        const adjIndex = parseInt(bytes[0] + bytes[1], 16) % adjectives.length;
        const factionIndex = parseInt(bytes[2] + bytes[3], 16) % factions.length;
        const unitIndex = parseInt(bytes[4] + bytes[5], 16) % units.length;
        const number = parseInt(bytes.slice(-2).join(''), 16) % 100;

        return `${adjectives[adjIndex]}${factions[factionIndex]}${units[unitIndex]}${number}`;
    };

// Example outputs:
// VengefulUltramarineChampion42
// ImperialNecronDestroyer07
// FallenThousandSonLibrarian93
// HolyDarkAngelTerminator15
