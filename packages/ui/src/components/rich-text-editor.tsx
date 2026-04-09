"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
}

const toolbarModules = {
  toolbar: [
    [{ font: [] }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ size: ["small", false, "large", "huge"] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    ["blockquote", "code-block"],
    ["link", "image", "video"],
    ["clean"],
  ],
} as const;

const editorStyles = `
  .ql-toolbar {
    background: transparent;
    border-color: #444;
  }
  .ql-container {
    background: transparent !important;
    border-color: #444;
    color: white;
  }
  .ql-picker {
    color: white !important;
  }
  .ql-editor {
    min-height: 200px;
  }
  .ql-snow {
    border-color: #444 !important;
  }
  .ql-editor.ql-blank::before {
    color: #aaa !important;
  }
  .ql-picker-options {
    background: #333 !important;
    color: white !important;
  }
  .ql-picker-item {
    color: white !important;
  }
  .ql-stroke {
    stroke: white !important;
  }
`;

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [editorValue, setEditorValue] = useState<string>(value || "");

  const handleChange = (content: string) => {
    setEditorValue(content);
    onChange(content);
  };

  return (
    <div className="relative">
      <ReactQuill
        theme="snow"
        value={editorValue}
        onChange={handleChange}
        modules={toolbarModules}
        placeholder="Write a detailed product description here..."
        className="bg-transparent border border-gray-700 text-white rounded-md"
      />
      <style>{editorStyles}</style>
    </div>
  );
}
