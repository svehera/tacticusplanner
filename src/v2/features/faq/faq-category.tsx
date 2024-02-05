import React from 'react';
import { IFaqItem } from './faq.models';
import { FaqItem } from './faq-item';

export const FaqCategory = ({ categoryName, items }: { categoryName: string; items: IFaqItem[] }) => (
    <div>
        <h2>{categoryName}</h2>
        {items.map((item, index) => (
            <FaqItem key={index} item={item} />
        ))}
    </div>
);
