import { AccessibleTooltip, getImageUrl } from '@/fsd/5-shared/ui';

export const CampaignImage = ({ campaign, size = 50 }: { campaign: string; size?: number }) => {
    const image = getImageUrl(`campaigns/resized/${campaign}.png`);

    return (
        <AccessibleTooltip title={campaign}>
            <span className="inline-block" style={{ height: size, minWidth: size }}>
                <img className="pointer-events-none" src={image} height={size} alt={campaign} />
            </span>
        </AccessibleTooltip>
    );
};
