import { EyeIcon, EyeOffIcon } from 'lucide-react';
import React, { ComponentPropsWithoutRef, useState } from 'react';
import {
    Button as ButtonPrimitive,
    TextField as TextFieldPrimitive,
    type TextFieldProps as TextFieldPrimitiveProps,
} from 'react-aria-components';

import { Loader } from '../loader';
import { composeTailwindRenderProps } from '../primitive';

import type { FieldProps } from './field';
import { Description, FieldError, FieldGroup, Input, Label } from './field';

type InputType = Exclude<ComponentPropsWithoutRef<typeof TextFieldPrimitive>['type'], 'password'>;
interface BaseTextFieldProps extends TextFieldPrimitiveProps, FieldProps {
    prefix?: React.ReactNode;
    suffix?: React.ReactNode;
    isPending?: boolean;
    className?: string;
}

interface RevealableTextFieldProps extends BaseTextFieldProps {
    isRevealable: true;
    /** type is controlled internally for revealable fields — do not pass. */
    type?: never;
}

interface NonRevealableTextFieldProps extends BaseTextFieldProps {
    isRevealable?: never;
    type?: InputType;
}

type TextFieldProps = RevealableTextFieldProps | NonRevealableTextFieldProps;

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
    ...props
}: TextFieldProps) => {
    const [isValueVisible, setIsValueVisible] = useState(false);
    // Always use type="text" for revealable fields so browsers never treat them as passwords.
    // Obfuscation is handled via -webkit-text-security when hidden.
    const inputType = isRevealable ? 'text' : type;
    // -webkit-text-security is a non-standard property not in React.CSSProperties.
    type SensitiveStyle = React.CSSProperties & { WebkitTextSecurity?: string };
    const sensitiveInputStyle: SensitiveStyle | undefined =
        isRevealable && !isValueVisible ? { WebkitTextSecurity: 'disc' } : undefined;
    const handleToggleVisibility = () => {
        setIsValueVisible(previous => !previous);
    };
    return (
        <TextFieldPrimitive
            type={inputType}
            {...props}
            className={composeTailwindRenderProps(className, 'group flex flex-col gap-y-1')}>
            {props.children || (
                <>
                    {label && <Label>{label}</Label>}
                    <FieldGroup
                        isDisabled={props.isDisabled}
                        isInvalid={!!errorMessage}
                        data-loading={isPending ? 'true' : undefined}>
                        {prefix && typeof prefix === 'string' ? (
                            <span className="text-muted-fg ml-2">{prefix}</span>
                        ) : prefix ? (
                            <span className="ml-2.5 flex shrink-0 items-center">{prefix}</span>
                        ) : undefined}
                        <Input placeholder={placeholder} style={sensitiveInputStyle} />
                        {isRevealable ? (
                            <ButtonPrimitive
                                type="button"
                                aria-label="Toggle value visibility"
                                onPress={handleToggleVisibility}
                                className="data-focus-visible:*:data-[slot=icon]:text-primary *:data-[slot=icon]:text-muted-fg relative mr-1 grid shrink-0 place-content-center rounded-sm border-transparent outline-hidden">
                                {isValueVisible ? <EyeOffIcon /> : <EyeIcon />}
                            </ButtonPrimitive>
                        ) : isPending ? (
                            <Loader variant="spin" />
                        ) : suffix ? (
                            typeof suffix === 'string' ? (
                                <span className="text-muted-fg mr-2">{suffix}</span>
                            ) : (
                                <span className="mr-2.5 flex shrink-0 items-center">{suffix}</span>
                            )
                        ) : undefined}
                    </FieldGroup>
                    {description && <Description>{description}</Description>}
                    <FieldError>{errorMessage}</FieldError>
                </>
            )}
        </TextFieldPrimitive>
    );
};

export { TextField };
