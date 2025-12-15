import { AccessibleTooltip, getImageUrl } from '@/fsd/5-shared/ui';

export const LreReqImage = ({ iconId, tooltip, sizePx }: { iconId: string; tooltip?: string; sizePx?: number }) => {
    const imageUrl = getImageUrl(`lre/${iconId}.png`);
    const img = (
        <img
            loading={'lazy'}
            className="pointer-events-none [content-visibility:auto]"
            width={sizePx ?? 25}
            height={sizePx ?? 25}
            src={imageUrl}
            alt={iconId}
        />
    );
    return tooltip ? (
        <AccessibleTooltip title={tooltip}>
            <span>{img}</span>
        </AccessibleTooltip>
    ) : (
        img
    );
};
