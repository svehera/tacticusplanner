import React from 'react';
import { Link as LinkPrimitive, type LinkProps as LinkPrimitiveProps, composeRenderProps } from 'react-aria-components';

import { buttonStyles } from '../button';

interface LinkProps extends LinkPrimitiveProps {
    intent?: 'primary' | 'secondary' | 'unstyled';
    ref?: React.RefObject<HTMLAnchorElement>;
}

const LinkButton = ({ className, ref, ...props }: LinkProps) => {
    return (
        <LinkPrimitive
            ref={ref}
            {...props}
            className={composeRenderProps(className, (className, renderProps) =>
                buttonStyles({ ...renderProps, className, intent: 'primary' })
            )}>
            {values => <>{typeof props.children === 'function' ? props.children(values) : props.children}</>}
        </LinkPrimitive>
    );
};

export { LinkButton };
