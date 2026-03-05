import { CheckIcon, MinusIcon } from 'lucide-react';
import React from 'react';
import type {
    CheckboxGroupProps as CheckboxGroupPrimitiveProperties,
    CheckboxProps as CheckboxPrimitiveProperties,
    ValidationResult,
} from 'react-aria-components';
import {
    CheckboxGroup as CheckboxGroupPrimitive,
    Checkbox as CheckboxPrimitive,
    composeRenderProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { cn } from '@/fsd/5-shared/lib';

import { composeTailwindRenderProps as composeTailwindRenderProperties } from '../primitive';

import { Description, FieldError, Label } from './field';

interface CheckboxGroupProperties extends CheckboxGroupPrimitiveProperties {
    label?: string;
    description?: string;
    errorMessage?: string | ((validation: ValidationResult) => string);
}

const CheckboxGroup = ({ className, ...properties }: CheckboxGroupProperties) => {
    return (
        <CheckboxGroupPrimitive
            {...properties}
            className={composeTailwindRenderProperties(className, 'flex flex-col gap-y-2')}>
            {properties.label && <Label>{properties.label}</Label>}
            {properties.children as React.ReactNode}
            {properties.description && <Description className="block">{properties.description}</Description>}
            <FieldError>{properties.errorMessage}</FieldError>
        </CheckboxGroupPrimitive>
    );
};

const checkboxStyles = tv({
    base: 'group flex items-center gap-2 text-sm transition',
    variants: {
        isDisabled: {
            true: 'opacity-50',
        },
    },
});

const boxStyles = tv({
    base: 'flex size-4 shrink-0 items-center justify-center rounded border border-input text-bg transition *:data-[slot=icon]:size-3',
    variants: {
        isSelected: {
            false: 'bg-muted',
            true: [
                'border-primary bg-primary text-primary-fg',
                'group-data-invalid:border-danger/70 group-data-invalid:bg-danger group-data-invalid:text-danger-fg',
            ],
        },
        isFocused: {
            true: [
                'border-primary ring-4 ring-primary/20',
                'group-data-invalid:border-danger/70 group-data-invalid:text-danger-fg group-data-invalid:ring-danger/20',
            ],
        },
        isInvalid: {
            true: 'border-danger/70 bg-danger/20 text-danger-fg ring-danger/20',
        },
    },
});

interface CheckboxProperties extends CheckboxPrimitiveProperties {
    description?: string;
    label?: string;
}

const Checkbox = ({ className, ...properties }: CheckboxProperties) => {
    return (
        <CheckboxPrimitive
            {...properties}
            className={composeRenderProps(className, (className, renderProperties) =>
                checkboxStyles({ ...renderProperties, className })
            )}>
            {({ isSelected, isIndeterminate, ...renderProperties }) => (
                <div className={cn('flex gap-x-2', properties.description ? 'items-start' : 'items-center')}>
                    <div
                        className={boxStyles({
                            ...renderProperties,
                            isSelected: isSelected || isIndeterminate,
                        })}>
                        {isIndeterminate ? <MinusIcon /> : isSelected && <CheckIcon />}
                    </div>

                    <div className="flex flex-col gap-1">
                        <>
                            {properties.label ? (
                                <Label className={cn(properties.description && 'text-sm/4')}>{properties.label}</Label>
                            ) : (
                                (properties.children as React.ReactNode)
                            )}
                            {properties.description && <Description>{properties.description}</Description>}
                        </>
                    </div>
                </div>
            )}
        </CheckboxPrimitive>
    );
};

export { Checkbox, CheckboxGroup };
