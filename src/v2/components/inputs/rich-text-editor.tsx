import React, { useState } from 'react';
import ReactQuill from 'react-quill';

import 'react-quill/dist/quill.snow.css';

interface Props {
    htmlValue: string;
    onChange: (value: string) => void;
}

export const RichTextEditor: React.FC<Props> = ({ htmlValue, onChange }) => {
    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ size: [] }],
            [{ align: ['right', 'center', 'justify'] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
        ],
    };

    const formats = [
        'header',
        'bold',
        'italic',
        'underline',
        'strike',
        'blockquote',
        'list',
        'bullet',
        'link',
        'color',
        'image',
        'background',
        'align',
        'size',
        'font',
    ];

    const [editorValue, setEditorValue] = useState<string>(htmlValue);

    const handleProcedureContentChange = (value: string) => {
        setEditorValue(value);
        onChange(value);
    };

    return (
        <>
            <ReactQuill
                theme="snow"
                modules={modules}
                formats={formats}
                value={editorValue}
                onChange={handleProcedureContentChange}
            />
        </>
    );
};
