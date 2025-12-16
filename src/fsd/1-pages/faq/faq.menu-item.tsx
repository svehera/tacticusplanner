import HelpIcon from '@mui/icons-material/Help';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MenuItem } from '@/models/menu-item';

export const faqMenuItem = new MenuItem('F.A.Q', <HelpIcon />, '/faq', 'Frequently Asked Questions');
