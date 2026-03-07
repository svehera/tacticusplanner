import React from 'react';
import type {
    FieldErrorProps as FieldErrorPrimitiveProperties,
    GroupProps,
    InputProps as InputPrimitiveProperties,
    LabelProps,
    TextFieldProps as TextFieldPrimitiveProperties,
    TextProps,
    ValidationResult,
} from 'react-aria-components';
import {
    FieldError as FieldErrorPrimitive,
    Group,
    Input as InputPrimitive,
    Label as LabelPrimitive,
    Text,
    composeRenderProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { composeTailwindRenderProps as composeTailwindRenderProperties, focusStyles } from '../primitive';

interface FieldProperties {
    label?: string;
    placeholder?: string;
    description?: string;
    errorMessage?: string | ((validation: ValidationResult) => string);
    'aria-label'?: TextFieldPrimitiveProperties['aria-label'];
    'aria-labelledby'?: TextFieldPrimitiveProperties['aria-labelledby'];
}

const fieldStyles = tv({
    slots: {
        description: 'text-pretty text-muted-fg text-sm/6',
        label: 'w-fit cursor-default font-medium text-secondary-fg text-sm/6',
        fieldError: 'text-danger text-sm/6 forced-colors:text-[Mark]',
    },
});

const { description, label, fieldError } = fieldStyles();

const Label = ({ className, ...properties }: LabelProps) => {
    return <LabelPrimitive {...properties} className={label({ className })} />;
};

interface DescriptionProperties extends TextProps {
    isWarning?: boolean;
    ref?: React.RefObject<HTMLElement>;
}

const Description = ({ ref, className, ...properties }: DescriptionProperties) => {
    const isWarning = properties.isWarning ?? false;
    return (
        <Text
            ref={ref}
            {...properties}
            slot="description"
            className={description({ className: isWarning ? 'text-warning' : className })}
        />
    );
};

interface FieldErrorProperties extends FieldErrorPrimitiveProperties {
    ref?: React.RefObject<HTMLElement>;
}

const FieldError = ({ className, ref, ...properties }: FieldErrorProperties) => {
    return (
        <FieldErrorPrimitive
            ref={ref}
            {...properties}
            className={composeTailwindRenderProperties(className, fieldError())}
        />
    );
};

const fieldGroupStyles = tv({
    base: [
        'group bg-muted flex h-10 items-center overflow-hidden rounded-lg border border-input shadow-xs transition duration-200 ease-out',
        'relative focus-within:ring-4 group-data-invalid:focus-within:border-danger group-data-invalid:focus-within:ring-danger/20',
        '[&>[role=progressbar]:first-child]:ml-2.5 [&>[role=progressbar]:last-child]:mr-2.5',
        '**:data-[slot=icon]:size-4 **:data-[slot=icon]:shrink-0 **:[button]:shrink-0',
        '[&>button:has([data-slot=icon]):first-child]:left-0 [&>button:has([data-slot=icon]):last-child]:right-0 [&>button:has([data-slot=icon])]:absolute',
        '*:data-[slot=icon]:pointer-events-none *:data-[slot=icon]:absolute *:data-[slot=icon]:top-[calc(var(--spacing)*2.7)] *:data-[slot=icon]:z-10 *:data-[slot=icon]:size-4 *:data-[slot=icon]:text-muted-fg',
        '[&>[data-slot=icon]:first-child]:left-2.5 [&>[data-slot=icon]:last-child]:right-2.5',
        '[&:has([data-slot=icon]+input)]:pl-6 [&:has(input+[data-slot=icon])]:pr-6',
        '[&:has([data-slot=icon]+[role=group])]:pl-6 [&:has([role=group]+[data-slot=icon])]:pr-6',
        'has-[[data-slot=icon]:last-child]:[&_input]:pr-7',
        '*:[button]:h-8 *:[button]:rounded-[calc(var(--radius-sm)-1px)] *:[button]:px-2.5',
        '[&>button:first-child]:ml-[calc(var(--spacing)*0.7)] [&>button:last-child]:mr-[calc(var(--spacing)*0.7)]',
    ],
    variants: {
        isFocusWithin: focusStyles.variants.isFocused,
        isInvalid: focusStyles.variants.isInvalid,
        isDisabled: {
            true: 'opacity-50 forced-colors:border-[GrayText]',
        },
    },
});

const FieldGroup = ({ className, ...properties }: GroupProps) => {
    return (
        <Group
            {...properties}
            className={composeRenderProps(className, (className, renderProperties) =>
                fieldGroupStyles({
                    ...renderProperties,
                    className,
                })
            )}
        />
    );
};

interface InputProperties extends InputPrimitiveProperties {
    ref?: React.RefObject<HTMLInputElement>;
}

const Input = ({ className, ref, ...properties }: InputProperties) => {
    return (
        <InputPrimitive
            ref={ref}
            {...properties}
            className={composeTailwindRenderProperties(
                className,
                'text-fg placeholder-muted-fg w-full min-w-0 bg-transparent px-2.5 py-2 text-base outline-hidden data-focused:outline-hidden sm:text-sm/6 [&::-ms-reveal]:hidden [&::-webkit-search-cancel-button]:hidden'
            )}
        />
    );
};

export type { FieldProperties as FieldProps };
export { Description, FieldError, FieldGroup, Input, Label };
