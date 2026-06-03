import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MenuItem } from '@/models/menu-item';

export const cesMenuItem = new MenuItem('Campaign Events', <EmojiEventsIcon />, '/plan/ces');
