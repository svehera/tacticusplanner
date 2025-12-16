import GroupsIcon from '@mui/icons-material/Groups';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MenuItem } from '@/models/menu-item';

export const guildApiMenuItem = new MenuItem('Guild', <GroupsIcon />, '/learn/guild');
