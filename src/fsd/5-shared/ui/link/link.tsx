import React from 'react';
import { Link as LinkPrimitive, type LinkProps as LinkPrimitiveProps, composeRenderProps } from 'react-aria-components';

import { buttonStyles } from '../button';

interface LinkProps extends LinkPrimitiveProps {
    intent?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
    appearance?: 'solid' | 'outline' | 'plain';
    size?: 'medium' | 'large' | 'square-petite' | 'extra-small' | 'small';
    shape?: 'square' | 'circle';
    ref?: React.RefObject<HTMLAnchorElement>;
}

const LinkButton = ({ className, intent, appearance, size, shape, ref, ...props }: LinkProps) => {
    return (
        <LinkPrimitive
            ref={ref}
            {...props}
            className={composeRenderProps(className, (className, renderProps) =>
                buttonStyles({ ...renderProps, className, intent: intent ?? 'primary', appearance, size, shape })
            )}>
            {values => <>{typeof props.children === 'function' ? props.children(values) : props.children}</>}
        </LinkPrimitive>
    );
};

export { LinkButton };
