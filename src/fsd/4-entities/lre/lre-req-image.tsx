import { AccessibleTooltip, getImageUrl } from '@/fsd/5-shared/ui';

export const LreReqImage = ({ iconId, tooltip }: { iconId: string; tooltip?: string }) => {
    const imageUrl = getImageUrl(`lre/${iconId}.png`);
    const img = (
        <img
            loading={'lazy'}
            style={{ pointerEvents: 'none', contentVisibility: 'auto' }}
            width={25}
            height={25}
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
