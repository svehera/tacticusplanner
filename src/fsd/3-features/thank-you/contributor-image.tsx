import { twMerge } from 'tailwind-merge';

/* eslint-disable import-x/no-internal-modules */
import db from '@/assets/images/contributors/db.jpg';
import db_vid from '@/assets/images/contributors/db_vid.jpg';
import kiviy from '@/assets/images/contributors/kiviy.webp';
import leonaica from '@/assets/images/contributors/leonaica.webp';
import lucky from '@/assets/images/contributors/lucky.webp';
import nandi from '@/assets/images/contributors/nandi.jpg';
import nandi_vid from '@/assets/images/contributors/nandi_vid.jpg';
import none from '@/assets/images/contributors/none.png';
import nox from '@/assets/images/contributors/nox.jpg';
import nox_vid from '@/assets/images/contributors/nox_vid.jpg';
import qr from '@/assets/images/contributors/qr.png';
import ref from '@/assets/images/contributors/ref.webp';
import seventhSun from '@/assets/images/contributors/seventhSun.webp';
import severyn from '@/assets/images/contributors/severyn.png';
import tani from '@/assets/images/contributors/tani.webp';
import towen from '@/assets/images/contributors/towen.webp';
import yourAdHere from '@/assets/images/contributors/yourAdHere.webp';
/* eslint-enable import-x/no-internal-modules */

const contributorMap = {
    'db.jpg': db_vid,
    'db_vid.jpg': db,
    'kiviy.webp': kiviy,
    'leonaica.webp': leonaica,
    'lucky.webp': lucky,
    'nandi.jpg': nandi_vid,
    'nandi_vid.jpg': nandi,
    'none.png': none,
    'nox.jpg': nox_vid,
    'nox_vid.jpg': nox,
    'qr.png': qr,
    'ref.webp': ref,
    'seventhSun.webp': seventhSun,
    'severyn.png': severyn,
    'tani.webp': tani,
    'towen.webp': towen,
    'yourAdHere.webp': yourAdHere,
};

type ContributorImagePath = keyof typeof contributorMap;
const isValidContributorImagePath = (path: string): path is ContributorImagePath => path in contributorMap;

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
    if (!isValidContributorImagePath(iconPath)) return null;
    const image = contributorMap[iconPath];
    const className = twMerge('[content-visibility:auto]', borderRadius ? 'rounded-[50%]' : '');

    return <img loading={'lazy'} className={className} src={image} height={height} width={width} alt={iconPath} />;
};
