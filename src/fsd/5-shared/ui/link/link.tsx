import React from 'react';
import {
    Link as LinkPrimitive,
    type LinkProps as LinkPrimitiveProperties,
    composeRenderProps,
} from 'react-aria-components';

import { buttonStyles } from '../button';

interface LinkProperties extends LinkPrimitiveProperties {
    intent?: 'primary' | 'secondary' | 'unstyled';
    ref?: React.RefObject<HTMLAnchorElement>;
}

const LinkButton = ({ className, ref, ...properties }: LinkProperties) => {
    return (
        <LinkPrimitive
            ref={ref}
            {...properties}
            className={composeRenderProps(className, (className, renderProperties) =>
                buttonStyles({ ...renderProperties, className, intent: 'primary' })
            )}>
            {values => (
                <>{typeof properties.children === 'function' ? properties.children(values) : properties.children}</>
            )}
        </LinkPrimitive>
    );
};

export { LinkButton };
