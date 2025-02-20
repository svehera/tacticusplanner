import React from 'react';
import ReactQuill from 'react-quill-new';

import 'react-quill-new/dist/quill.snow.css';
import './rich-text-viewer.scss';

interface Props {
    htmlValue: string;
}

export const RichTextViewer: React.FC<Props> = ({ htmlValue }) => {
    return <ReactQuill readOnly={true} value={htmlValue} theme="bubble" className="read-only-rich-text" />;
};
