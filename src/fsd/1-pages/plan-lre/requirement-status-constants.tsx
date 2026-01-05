import { Circle, CircleCheck, CircleFadingPlus, CircleMinus, CircleQuestionMark } from 'lucide-react';
import { ReactNode } from 'react';

import { RequirementStatus } from '@/fsd/3-features/lre';

export const STATUS_LABELS: Record<RequirementStatus, ReactNode> = {
    [RequirementStatus.NotCleared]: <Circle className="size-5 md:size-6" />,
    [RequirementStatus.Cleared]: <CircleCheck className="size-5 md:size-6" />,
    [RequirementStatus.MaybeClear]: <CircleQuestionMark className="size-5 md:size-6" />,
    [RequirementStatus.StopHere]: <CircleMinus className="size-5 md:size-6" />,
    [RequirementStatus.PartiallyCleared]: <CircleFadingPlus className="size-5 md:size-6" />,
};

export const STATUS_COLORS: Record<RequirementStatus, string> = {
    [RequirementStatus.NotCleared]: '#6b7280', // Gray
    [RequirementStatus.Cleared]: '#4caf50', // Green
    [RequirementStatus.MaybeClear]: '#eab308', // Yellow
    [RequirementStatus.StopHere]: '#be123c', // Red
    [RequirementStatus.PartiallyCleared]: '#2196f3', // Blue
};

export const STATUS_LABEL_TEXT: Record<RequirementStatus, string> = {
    [RequirementStatus.NotCleared]: 'Not Cleared',
    [RequirementStatus.Cleared]: 'Cleared',
    [RequirementStatus.MaybeClear]: 'Maybe Clear',
    [RequirementStatus.StopHere]: 'Stop Here',
    [RequirementStatus.PartiallyCleared]: 'Partially Cleared',
};
