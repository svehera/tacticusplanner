import React from 'react';

export const Conditional = ({
    condition,
    children,
    elseTemplate,
}: React.PropsWithChildren<{
    condition: boolean;
    elseTemplate?: React.ReactElement;
}>) => <>{condition ? children : elseTemplate}</>;
