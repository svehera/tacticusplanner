// eslint-disable-next-line import-x/no-internal-modules
import normalBorder from '@/assets/images/snowprint_assets/frames/ui_icon_character_shard_empty.png';
// eslint-disable-next-line import-x/no-internal-modules
import mythicBorder from '@/assets/images/snowprint_assets/frames/ui_icon_character_shard_mythic.png';

import { mapSnowprintAssets } from '@/fsd/5-shared/lib';

import { AccessibleTooltip } from '../tooltip';

const characterShardAssets = import.meta.glob(
    '/src/assets/images/snowprint_assets/characters/ui_image_RoundPortrait_*.png',
    { eager: true, import: 'default' }
);

const characterShardMap = mapSnowprintAssets(characterShardAssets); // Run at module load time so that the build breaks if the glob is wrong.

export const UnitShardIcon = ({
    icon,
    name,
    height,
    width,
    tooltip,
    mythic,
}: {
    icon: string;
    name?: string;
    tooltip?: string;
    height?: number;
    width?: number;
    mythic?: boolean;
}) => {
    const hasIconUrl = icon && icon !== '';
    const imageUrl = characterShardMap[icon];
    const borderImageUrl = mythic ? mythicBorder : normalBorder;
    const defaultWidth = 50;
    width = width ?? defaultWidth;
    height = height ?? defaultWidth;
    const roundImgOriginal = { width: 148, height: 148 };
    // The wreath border image was originally 242x210px, with an aspect ratio of 1.15238095.
    // I.e. not a circle/square with equal width and height.
    // To allow the unit's roundIcon to overlay, while allowing dynamic sizing, we're storing the
    // aspect ratio here as a constant. If the underlying wreath image changes, this will need to change.
    const borderImgOriginal = { width: 242, height: 210 };
    const borderImgScale = Math.min(width / borderImgOriginal.width, height / borderImgOriginal.height);
    // `overlayScale` is a magic number that was manually adjusted to center the roundIcon over
    // the wreath border with minimal gaps.
    const overlayScale = 1.25;
    const overlaySize = roundImgOriginal.width * borderImgScale * overlayScale;

    const image = (
        <div className="relative inline-block" style={{ width, height }}>
            <img
                loading={'lazy'}
                className="block rounded-[50%] object-contain"
                style={{ width, height }}
                src={borderImageUrl}
                alt="character border"
            />
            {hasIconUrl && (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                    <img
                        loading={'lazy'}
                        style={{
                            width: overlaySize,
                            height: overlaySize,
                        }}
                        src={imageUrl}
                        alt={name ?? icon}
                    />
                </div>
            )}
        </div>
    );

    return tooltip ? <AccessibleTooltip title={tooltip}>{image}</AccessibleTooltip> : image;
};
