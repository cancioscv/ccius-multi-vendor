// import { useCallback, useRef, useMemo, useState } from "react";

// import dynamic from "next/dynamic";

// const JoditEditor = dynamic(() => import("jodit-react"), {
//   ssr: false,
//   loading: () => <p>Loading editor...</p>,
// });
// interface Props {
//   value: string;
//   onChange: (content: string) => void;
//   onBlur: (content: string) => void;
// }
// export function RichTextEditor({ value, onChange }: Props) {
//   const editor = useRef(null);
//   const [editorValue, setEditorValue] = useState(value || "");

//   const config = useMemo(
//     () => ({
//       readonly: false,
//       placeholder: "Start typing...",
//       buttons: ["bold", "italic", "underline", "|", "ul", "ol", "|", "font", "fontsize", "brush", "|", "image", "link", "|", "align", "undo", "redo"],
//       height: 400,
//       style: {
//         backgroundColor: "#000000",
//         color: "#e0e0e0",
//       },
//       uploader: {
//         insertImageAsBase64URI: true,
//       },
//     }),
//     []
//   );

//   const handleBlur = useCallback((newContent: string) => {
//     setEditorValue(newContent);
//   }, []);

//   const handleChange = useCallback((newContent: string) => {
//     // You can handle onChange here if needed
//     console.log("is there any new content?", newContent);
//     onChange(newContent);
//   }, []);

//   return (
//     <div>
//       <JoditEditor ref={editor} value={editorValue} config={config} tabIndex={1} onChange={handleChange} onBlur={handleBlur} />
//     </div>
//   );
// }

export default function RichTextEditor() {
  return <div>RichTextEditor</div>;
}
