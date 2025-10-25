import { FaqItem } from './faq-item';
import { IFaqItem } from './faq.models';

export const FaqCategory = ({ categoryName, items }: { categoryName: string; items: IFaqItem[] }) => (
    <div>
        <h2>{categoryName}</h2>
        {items.map((item, index) => (
            <FaqItem key={index} item={item} />
        ))}
    </div>
);
