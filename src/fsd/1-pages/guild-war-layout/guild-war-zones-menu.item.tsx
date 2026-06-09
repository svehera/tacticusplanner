import GridViewIcon from '@mui/icons-material/GridView';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MenuItem } from '@/models/menu-item';

export const guildWarZonesMenuItem = new MenuItem('Zones', <GridViewIcon />, '/plan/guildWar/zones', 'War zones');
