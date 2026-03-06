import React from 'react';
import ReactQuill from 'react-quill-new';

import 'react-quill-new/dist/quill.snow.css';

interface Properties {
    htmlValue: string;
}

export const RichTextViewer: React.FC<Properties> = ({ htmlValue }) => {
    return <ReactQuill readOnly={true} value={htmlValue} theme="bubble" className="p-0" />;
};
