import React from 'react';
import {
    Button as ButtonPrimitive,
    type ButtonProps as ButtonPrimitiveProperties,
    composeRenderProps,
} from 'react-aria-components';

import { buttonStyles } from './button-styles';

interface ButtonProperties extends ButtonPrimitiveProperties {
    intent?: 'primary' | 'secondary' | 'danger' | 'warning';
    size?: 'medium' | 'large' | 'square-petite' | 'extra-small' | 'small';
    shape?: 'square' | 'circle';
    appearance?: 'solid' | 'outline' | 'plain';
    ref?: React.Ref<HTMLButtonElement>;
}

const Button: React.FC<ButtonProperties> = ({ className, intent, appearance, size, shape, ref, ...properties }) => {
    return (
        <ButtonPrimitive
            ref={ref}
            {...properties}
            className={composeRenderProps(className, (className, renderProperties) =>
                buttonStyles({
                    ...renderProperties,
                    intent,
                    appearance,
                    size,
                    shape,
                    className,
                })
            )}>
            {values => (
                <>{typeof properties.children === 'function' ? properties.children(values) : properties.children}</>
            )}
        </ButtonPrimitive>
    );
};

export type { ButtonProperties as ButtonProps };
export { Button };
