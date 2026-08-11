import { ImgHTMLAttributes, forwardRef } from 'react';

import { tacticusIcons } from './icon-list';

interface MiscIconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'width' | 'height'> {
    icon: keyof typeof tacticusIcons;
    width?: number;
    height?: number;
}

/**
 * `pointer-events-none` is only dropped when an `onClick` is attached (e.g. by a tooltip wrapper
 * injecting a tap handler) so the many call sites that sit inside a larger clickable row keep
 * passing clicks through to their parent unchanged.
 */
export const MiscIcon = forwardRef<HTMLImageElement, MiscIconProps>(function MiscIcon(
    { icon, width = 30, height = 30, className = '', style = {}, onClick, onKeyDown, ...rest },
    reference
) {
    const details = tacticusIcons[icon] ?? { file: '', label: icon };
    return (
        <img
            ref={reference}
            loading="lazy"
            className={`${onClick ? '' : 'pointer-events-none'} ${className}`}
            style={{
                ...(height > 0 ? { height } : {}),
                ...(width > 0 ? { width } : {}),
                ...style,
            }}
            src={details.file}
            width={width > 0 ? width : undefined}
            height={height > 0 ? height : undefined}
            alt={details.label}
            onClick={onClick}
            onKeyDown={event => {
                onKeyDown?.(event);
                if (!event.defaultPrevented && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    event.currentTarget.click();
                }
            }}
            {...(onClick ? { role: 'button', tabIndex: 0 } : {})}
            {...rest}
        />
    );
});
