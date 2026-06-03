import InsightsIcon from '@mui/icons-material/Insights';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MenuItem } from '@/models/menu-item';

export const insightsMenuItem = new MenuItem('Insights', <InsightsIcon />, '/learn/insights');
