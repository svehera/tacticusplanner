import ApiIcon from '@mui/icons-material/Api';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MenuItem } from '@/models/menu-item';

export const guildApiMenuItem = new MenuItem('Guild API', <ApiIcon />, '/learn/guild');
