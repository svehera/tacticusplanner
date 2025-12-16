import { MenuItem } from '@/models/menu-item';
import GuildWarIcon from 'src/assets/images/icons/guildWarMono.png';

export const guildWarDefenseMenuItem = new MenuItem(
    'Defense',
    <img src={GuildWarIcon} width={24} height={24} alt="Guild War Defense" />,
    '/plan/guildWar/defense'
);
