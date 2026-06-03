import MenuBookIcon from '@mui/icons-material/MenuBook';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MenuItem } from '@/models/menu-item';

export const guidesMenuItem = new MenuItem('Guides', <MenuBookIcon />, '/learn/guides');
