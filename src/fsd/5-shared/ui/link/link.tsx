import React from 'react';
import { Link as LinkPrimitive, type LinkProps as LinkPrimitiveProps, composeRenderProps } from 'react-aria-components';

import { buttonStyles } from '../button';

import { linkStyles } from './link-styles';

interface LinkProps extends LinkPrimitiveProps {
    intent?: 'primary' | 'secondary' | 'unstyled';
    ref?: React.RefObject<HTMLAnchorElement>;
}

const Link = ({ className, ref, ...props }: LinkProps) => {
    return (
        <LinkPrimitive
            ref={ref}
            {...props}
            className={composeRenderProps(className, (className, renderProps) =>
                linkStyles({ ...renderProps, intent: props.intent, className })
            )}>
            {values => <>{typeof props.children === 'function' ? props.children(values) : props.children}</>}
        </LinkPrimitive>
    );
};

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

export type { LinkProps };
export { Link, LinkButton };
