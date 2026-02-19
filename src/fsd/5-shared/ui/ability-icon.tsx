import { abilityIcons } from './ability-icons';

export const AbilityIcon = ({
    icon,
    width = 60,
    height = 60,
    className = '',
    style = {},
}: {
    icon: keyof typeof abilityIcons;
    width?: number;
    height?: number;
    className?: string;
    style?: React.CSSProperties;
}) => {
    const details = abilityIcons[icon] ?? { file: '', name: icon };
    return (
        <img
            loading="lazy"
            className={`pointer-events-none ${className}`}
            style={{ height, width, ...style }}
            src={details.file}
            width={width}
            height={height}
            alt={details.name}
        />
    );
};
