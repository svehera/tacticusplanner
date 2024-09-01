import React, { useState } from 'react';
import { TitleContext } from './title.context';

export const TitleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [headerTitle, setHeaderTitle] = useState<string>('');

    return <TitleContext.Provider value={{ headerTitle, setHeaderTitle }}>{children}</TitleContext.Provider>;
};
