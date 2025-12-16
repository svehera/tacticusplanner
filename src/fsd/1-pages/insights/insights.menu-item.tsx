import SavedSearchIcon from '@mui/icons-material/SavedSearch';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MenuItem } from '@/models/menu-item';

export const insightsMenuItem = new MenuItem('Insights', <SavedSearchIcon />, '/learn/insights');
