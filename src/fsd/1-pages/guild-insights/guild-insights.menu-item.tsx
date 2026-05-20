import AssessmentIcon from '@mui/icons-material/Assessment';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MenuItem } from '@/models/menu-item';

export const guildInsightsMenuItem = new MenuItem('Guild Insights', <AssessmentIcon />, '/learn/guildInsights');
