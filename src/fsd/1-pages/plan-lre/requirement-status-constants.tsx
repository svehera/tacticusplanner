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

export const STATUS_TEXT_CLASSES: Record<RequirementStatus, string> = {
    [RequirementStatus.NotCleared]: 'text-(--soft-fg)',
    [RequirementStatus.Cleared]: 'text-(--success)',
    [RequirementStatus.MaybeClear]: 'text-(--warning)',
    [RequirementStatus.StopHere]: 'text-(--danger)',
    [RequirementStatus.PartiallyCleared]: 'text-(--primary)',
};

export const STATUS_BORDER_CLASSES: Record<RequirementStatus, string> = {
    [RequirementStatus.NotCleared]: 'border-(--soft-fg)/12',
    [RequirementStatus.Cleared]: 'border-(--success)/12',
    [RequirementStatus.MaybeClear]: 'border-(--warning)/12',
    [RequirementStatus.StopHere]: 'border-(--danger)/12',
    [RequirementStatus.PartiallyCleared]: 'border-(--primary)/12',
};

export const STATUS_BORDER_SOLID_CLASSES: Record<RequirementStatus, string> = {
    [RequirementStatus.NotCleared]: 'border-(--soft-fg)',
    [RequirementStatus.Cleared]: 'border-(--success)',
    [RequirementStatus.MaybeClear]: 'border-(--warning)',
    [RequirementStatus.StopHere]: 'border-(--danger)',
    [RequirementStatus.PartiallyCleared]: 'border-(--primary)',
};

export const STATUS_LABEL_TEXT: Record<RequirementStatus, string> = {
    [RequirementStatus.NotCleared]: 'Not Cleared',
    [RequirementStatus.Cleared]: 'Cleared',
    [RequirementStatus.MaybeClear]: 'Maybe Clear',
    [RequirementStatus.StopHere]: 'Stop Here',
    [RequirementStatus.PartiallyCleared]: 'Partially Cleared',
};
