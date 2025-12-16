import { MenuItem } from '@/models/menu-item';
import GuildWarIcon from 'src/assets/images/icons/guildWarMono.png';

export const guildWarOffenseMenuItem = new MenuItem(
    'Offense',
    <img src={GuildWarIcon} width={24} height={24} alt="Guild War Offense" />,
    '/plan/guildWar/offense'
);
