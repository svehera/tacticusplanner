import { tacticusIcons } from './assets';

export const MiscIcon = ({
    icon,
    width = 30,
    height = 30,
}: {
    icon: keyof typeof tacticusIcons;
    width?: number;
    height?: number;
}) => {
    const details = tacticusIcons[icon] ?? { file: '', label: icon };
    return (
        <img
            style={{ pointerEvents: 'none', height, width }}
            src={details.file}
            width={width}
            height={height}
            alt={details.label}
        />
    );
};
