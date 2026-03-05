import { EyeIcon, EyeOffIcon } from 'lucide-react';
import React, { ComponentPropsWithoutRef, useState } from 'react';
import {
    Button as ButtonPrimitive,
    TextField as TextFieldPrimitive,
    type TextFieldProps as TextFieldPrimitiveProperties,
} from 'react-aria-components';

import { Loader } from '../loader';
import { composeTailwindRenderProps as composeTailwindRenderProperties } from '../primitive';

import type { FieldProps as FieldProperties } from './field';
import { Description, FieldError, FieldGroup, Input, Label } from './field';

type InputType = Exclude<ComponentPropsWithoutRef<typeof TextFieldPrimitive>['type'], 'password'>;
interface BaseTextFieldProperties extends TextFieldPrimitiveProperties, FieldProperties {
    prefix?: React.ReactNode;
    suffix?: React.ReactNode;
    isPending?: boolean;
    className?: string;
}

interface RevealableTextFieldProperties extends BaseTextFieldProperties {
    isRevealable: true;
    type: 'password';
}

interface NonRevealableTextFieldProperties extends BaseTextFieldProperties {
    isRevealable?: never;
    type?: InputType;
}

type TextFieldProperties = RevealableTextFieldProperties | NonRevealableTextFieldProperties;

const TextField = ({
    placeholder,
    label,
    description,
    errorMessage,
    prefix,
    suffix,
    isPending,
    className,
    isRevealable,
    type,
    ...properties
}: TextFieldProperties) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const inputType = isRevealable ? (isPasswordVisible ? 'text' : 'password') : type;
    const handleTogglePasswordVisibility = () => {
        setIsPasswordVisible(previous => !previous);
    };
    return (
        <TextFieldPrimitive
            type={inputType}
            {...properties}
            className={composeTailwindRenderProperties(className, 'group flex flex-col gap-y-1')}>
            {properties.children || (
                <>
                    {label && <Label>{label}</Label>}
                    <FieldGroup
                        isDisabled={properties.isDisabled}
                        isInvalid={!!errorMessage}
                        data-loading={isPending ? 'true' : undefined}>
                        {prefix && typeof prefix === 'string' ? (
                            <span className="text-muted-fg ml-2">{prefix}</span>
                        ) : (
                            prefix
                        )}
                        <Input placeholder={placeholder} />
                        {isRevealable ? (
                            <ButtonPrimitive
                                type="button"
                                aria-label="Toggle password visibility"
                                onPress={handleTogglePasswordVisibility}
                                className="data-focus-visible:*:data-[slot=icon]:text-primary *:data-[slot=icon]:text-muted-fg relative mr-1 grid shrink-0 place-content-center rounded-sm border-transparent outline-hidden">
                                {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                            </ButtonPrimitive>
                        ) : isPending ? (
                            <Loader variant="spin" />
                        ) : (
                            suffix &&
                            (typeof suffix === 'string' ? <span className="text-muted-fg mr-2">{suffix}</span> : suffix)
                        )}
                    </FieldGroup>
                    {description && <Description>{description}</Description>}
                    <FieldError>{errorMessage}</FieldError>
                </>
            )}
        </TextFieldPrimitive>
    );
};

export { TextField };
