import { tacticusIcons } from './iconList';

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
            loading="lazy"
            className="pointer-events-none"
            style={{ height, width }}
            src={details.file}
            width={width}
            height={height}
            alt={details.label}
        />
    );
};
