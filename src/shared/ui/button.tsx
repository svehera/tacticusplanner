import React from 'react';
import {
    Button as ButtonPrimitive,
    type ButtonProps as ButtonPrimitiveProps,
    composeRenderProps,
} from 'react-aria-components';
import { buttonStyles } from './button-styles';

interface ButtonProps extends ButtonPrimitiveProps {
    intent?: 'primary' | 'secondary' | 'danger' | 'warning';
    size?: 'medium' | 'large' | 'square-petite' | 'extra-small' | 'small';
    shape?: 'square' | 'circle';
    appearance?: 'solid' | 'outline' | 'plain';
    ref?: React.Ref<HTMLButtonElement>;
}

const Button: React.FC<ButtonProps> = ({ className, intent, appearance, size, shape, ref, ...props }) => {
    return (
        <ButtonPrimitive
            ref={ref}
            {...props}
            className={composeRenderProps(className, (className, renderProps) =>
                buttonStyles({
                    ...renderProps,
                    intent,
                    appearance,
                    size,
                    shape,
                    className,
                })
            )}>
            {values => <>{typeof props.children === 'function' ? props.children(values) : props.children}</>}
        </ButtonPrimitive>
    );
};

export type { ButtonProps };
export { Button };
