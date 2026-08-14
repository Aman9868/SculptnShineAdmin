"use client";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// Dynamically import react-quill-new to avoid SSR hydration issues
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-gray-50 animate-pulse rounded-lg border border-gray-200"></div>,
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ color: [] }, { background: [] }],
      ["link", "clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "indent",
    "link",
    "color",
    "background",
  ];

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || "Write something..."}
        className="bg-white rounded-lg"
      />
      <style jsx global>{`
        .rich-text-editor .ql-container {
          min-height: 250px;
          font-family: inherit;
          font-size: 14px;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background-color: #f9fafb;
        }
        .rich-text-editor .ql-editor {
          min-height: 250px;
        }
      `}</style>
    </div>
  );
}
