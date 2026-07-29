import { Alliance } from '@/fsd/5-shared/model';

import { tacticusIcons } from './icon-list';
import { MiscIcon } from './misc.icon';

/**
 * The alliance emblems. Not to be confused with ComponentImage, which renders the
 * alliance-coloured Machine of War component tokens.
 */
const allianceIcons: Record<Alliance, keyof typeof tacticusIcons> = {
    [Alliance.Imperial]: 'allianceImperial',
    [Alliance.Chaos]: 'allianceChaos',
    [Alliance.Xenos]: 'allianceXenos',
};

/** The emblems aren't square, so only the height is constrained and the width follows. */
export const AllianceImage = ({ alliance, size = 25 }: { alliance: Alliance; size?: number }) => (
    <MiscIcon icon={allianceIcons[alliance]} width={0} height={size} />
);
