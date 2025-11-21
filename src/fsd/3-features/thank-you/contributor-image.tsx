import { twMerge } from 'tailwind-merge';

import { getImageUrl } from '@/fsd/5-shared/ui';

export const ContributorImage = ({
    iconPath,
    height,
    width,
    borderRadius,
}: {
    iconPath: string;
    height: number;
    width: number;
    borderRadius?: boolean;
}) => {
    const image = getImageUrl(`contributors/${iconPath}`);

    const className = twMerge('[content-visibility:auto]', borderRadius ? 'rounded-[50%]' : '');

    return <img loading={'lazy'} className={className} src={image} height={height} width={width} alt={iconPath} />;
};
