"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List, 
  ListOrdered, 
  Quote,
  Heading,
  Sparkles,
  Utensils,
  BookOpen,
  HelpCircle,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Trash2,
  X
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = "Enter product description..." }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const checkActiveFormats = useCallback(() => {
    if (!document) return;
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
    });
  }, []);

  const execCmd = (command: string, arg: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    
    // For formatBlock, standardizing tag parameter
    if (command === "formatBlock" && arg) {
      const formatTag = arg.startsWith("<") ? arg : `<${arg}>`;
      document.execCommand("formatBlock", false, formatTag);
    } else {
      document.execCommand(command, false, arg);
    }

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    checkActiveFormats();
  };

  // Helper to insert a pre-formatted standard section
  const insertSection = (title: string, sampleContent: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const sectionHtml = `<h3>${title}</h3><p>${sampleContent}</p>`;
    document.execCommand("insertHTML", false, sectionHtml);

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Helper to insert an Image directly
  const insertImage = (url?: string) => {
    const src = url || imageUrlInput;
    if (!src || !src.trim()) return;

    if (editorRef.current) {
      editorRef.current.focus();
      const imgHtml = `<p><img src="${src.trim()}" alt="Product Image" style="max-width: 100%; height: auto; border-radius: 12px; margin: 12px 0; border: 1px solid #e5e7eb;" /></p><p></p>`;
      document.execCommand("insertHTML", false, imgHtml);
      onChange(editorRef.current.innerHTML);
    }

    setImageUrlInput("");
    setShowImagePrompt(false);
  };

  // Auto-detect pasted image URLs and convert to <img> tags
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData("text/plain")?.trim();
    if (text && (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("data:image/"))) {
      const isImageUrl = text.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) || 
                         text.includes("googleusercontent.com") || 
                         text.includes("gstatic.com") || 
                         text.includes("unsplash.com") ||
                         text.includes("cloudinary.com");

      if (isImageUrl) {
        e.preventDefault();
        const imgHtml = `<p><img src="${text}" alt="Product image" style="max-width: 100%; height: auto; border-radius: 12px; margin: 12px 0; border: 1px solid #e5e7eb;" /></p><p></p>`;
        document.execCommand("insertHTML", false, imgHtml);
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      }
    }
  };

  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);

  // Clear outline when selectedImage changes
  const clearImageSelection = useCallback(() => {
    if (editorRef.current) {
      const imgs = editorRef.current.querySelectorAll("img");
      imgs.forEach((img) => {
        img.style.outline = "none";
        img.style.boxShadow = "none";
      });
    }
    setSelectedImage(null);
  }, []);

  const selectImage = (img: HTMLImageElement) => {
    clearImageSelection();
    img.style.outline = "3px solid #D99A2B";
    img.style.outlineOffset = "3px";
    img.style.boxShadow = "0 0 0 6px rgba(217, 154, 43, 0.25)";
    setSelectedImage(img);
  };

  const deleteSelectedImage = () => {
    if (selectedImage) {
      const parent = selectedImage.parentElement;
      selectedImage.remove();
      // If parent paragraph is empty, clean it
      if (parent && parent.tagName === "P" && !parent.innerHTML.trim()) {
        parent.remove();
      }
      setSelectedImage(null);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
  };

  const resizeSelectedImage = (widthPercent: string) => {
    if (selectedImage) {
      selectedImage.style.maxWidth = widthPercent;
      selectedImage.style.width = widthPercent === "100%" ? "100%" : "auto";
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
  };

  // Handle click on images inside editor
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === "IMG") {
      e.stopPropagation();
      selectImage(target as HTMLImageElement);
    } else {
      clearImageSelection();
    }
  };

  // Handle keydown for Delete / Backspace when image is selected
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (selectedImage && (e.key === "Backspace" || e.key === "Delete")) {
      e.preventDefault();
      deleteSelectedImage();
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      checkActiveFormats();
    }
  };

  return (
    <div className="w-full border border-gray-300 rounded-2xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-gold-500 focus-within:border-gold-500 transition-all">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 p-2.5 bg-gray-50/90 border-b border-gray-200 select-none text-xs font-semibold text-gray-700">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Style Buttons Group */}
          <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-1">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCmd("bold"); }}
              className={`p-1.5 rounded-lg hover:bg-gray-200 transition-colors ${activeFormats.bold ? "bg-white shadow-xs text-gold-600 font-bold border border-gray-200" : ""}`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCmd("italic"); }}
              className={`p-1.5 rounded-lg hover:bg-gray-200 transition-colors ${activeFormats.italic ? "bg-white shadow-xs text-gold-600 font-bold border border-gray-200" : ""}`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCmd("underline"); }}
              className={`p-1.5 rounded-lg hover:bg-gray-200 transition-colors ${activeFormats.underline ? "bg-white shadow-xs text-gold-600 font-bold border border-gray-200" : ""}`}
              title="Underline (Ctrl+U)"
            >
              <Underline className="h-4 w-4" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCmd("strikeThrough"); }}
              className={`p-1.5 rounded-lg hover:bg-gray-200 transition-colors ${activeFormats.strikeThrough ? "bg-white shadow-xs text-gold-600 font-bold border border-gray-200" : ""}`}
              title="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </button>
          </div>

          {/* Alignment Buttons Group */}
          <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-1">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCmd("justifyLeft"); }}
              className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCmd("justifyCenter"); }}
              className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCmd("justifyRight"); }}
              className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </button>
          </div>

          {/* List Buttons Group */}
          <div className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-1">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCmd("insertUnorderedList"); }}
              className={`p-1.5 rounded-lg hover:bg-gray-200 transition-colors ${activeFormats.insertUnorderedList ? "bg-white shadow-xs text-gold-600 border border-gray-200" : ""}`}
              title="Bulleted List"
            >
              <List className="h-4 w-4" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCmd("insertOrderedList"); }}
              className={`p-1.5 rounded-lg hover:bg-gray-200 transition-colors ${activeFormats.insertOrderedList ? "bg-white shadow-xs text-gold-600 border border-gray-200" : ""}`}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCmd("formatBlock", "blockquote"); }}
              className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              title="Blockquote"
            >
              <Quote className="h-4 w-4" />
            </button>
          </div>

          {/* Text Size / Format Preset Options */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCmd("formatBlock", "p"); }}
              className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-xs font-semibold shadow-2xs"
            >
              Normal (P)
            </button>

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCmd("formatBlock", "h3"); }}
              className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-xs font-bold text-gray-900 shadow-2xs flex items-center gap-1"
            >
              <Heading className="w-3.5 h-3.5 text-gold-600" />
              <span>Section Heading (H3)</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCmd("formatBlock", "h2"); }}
              className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-xs font-black text-gray-900 shadow-2xs"
            >
              Main Title (H2)
            </button>
          </div>
        </div>

        {/* Quick Insert Sections Bar */}
        <div className="flex items-center gap-1 border-t sm:border-t-0 pt-1.5 sm:pt-0 border-gray-200">
          <span className="text-[10px] uppercase font-bold text-gray-400 mr-1">Insert:</span>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); insertSection("DESCRIPTION", "Enter product overview and story here..."); }}
            className="px-2 py-0.5 rounded-md bg-gold-50 border border-gold-200 text-gold-800 text-[11px] font-bold hover:bg-gold-100 transition-colors"
          >
            + Description
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); insertSection("INGREDIENTS", "Hydrolyzed Whey Isolate, Natural Flavors, Sucralose..."); }}
            className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold hover:bg-emerald-100 transition-colors"
          >
            + Ingredients
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); insertSection("NUTRITION FACTS", "Serving Size: 1 Scoop (30g) | Calories: 120 kcal | Protein: 25g | Carbs: 2g"); }}
            className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold hover:bg-blue-100 transition-colors"
          >
            + Nutrition
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); insertSection("HOW TO USE", "Add 1 scoop to 200ml cold water. Shake for 25 seconds."); }}
            className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-bold hover:bg-purple-100 transition-colors"
          >
            + How to Use
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); insertSection("FAQS", "Q: Is this authentic? A: 100% genuine with verifiable importer seal."); }}
            className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold hover:bg-amber-100 transition-colors"
          >
            + FAQs
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setShowImagePrompt(!showImagePrompt); }}
            className="px-2 py-0.5 rounded-md bg-pink-50 border border-pink-200 text-pink-800 text-[11px] font-bold hover:bg-pink-100 transition-colors flex items-center gap-1"
          >
            <ImageIcon className="w-3 h-3 text-pink-600" />
            <span>+ Image</span>
          </button>
        </div>
      </div>

      {/* Inline Image URL Input Prompt */}
      {showImagePrompt && (
        <div className="flex items-center gap-2 p-2.5 bg-pink-50/70 border-b border-pink-200 animate-in fade-in duration-200">
          <ImageIcon className="w-4 h-4 text-pink-600 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Paste image URL here (e.g. https://...)..."
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                insertImage();
              }
            }}
            className="flex-grow px-3 py-1.5 bg-white border border-pink-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-pink-500 text-gray-800"
          />
          <button
            type="button"
            onClick={() => insertImage()}
            className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
          >
            Insert Image
          </button>
          <button
            type="button"
            onClick={() => setShowImagePrompt(false)}
            className="px-2 py-1.5 text-gray-500 hover:text-gray-700 text-xs font-bold"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Floating Image Actions Toolbar */}
      {selectedImage && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-amber-50 border-b border-amber-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-amber-700" />
              Image Selected
            </span>
            <div className="h-4 w-px bg-amber-200" />
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-amber-800 mr-1">Width:</span>
              <button
                type="button"
                onClick={() => resizeSelectedImage("40%")}
                className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 border border-amber-300 text-xs font-bold text-amber-900 shadow-2xs"
              >
                Small (40%)
              </button>
              <button
                type="button"
                onClick={() => resizeSelectedImage("70%")}
                className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 border border-amber-300 text-xs font-bold text-amber-900 shadow-2xs"
              >
                Medium (70%)
              </button>
              <button
                type="button"
                onClick={() => resizeSelectedImage("100%")}
                className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 border border-amber-300 text-xs font-bold text-amber-900 shadow-2xs"
              >
                Full (100%)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={deleteSelectedImage}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Image (Backspace)</span>
            </button>
            <button
              type="button"
              onClick={clearImageSelection}
              className="p-1 rounded-lg hover:bg-amber-200 text-amber-800 cursor-pointer"
              title="Deselect image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Editable Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onClick={handleEditorClick}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyUp={checkActiveFormats}
        onMouseUp={checkActiveFormats}
        className="p-5 min-h-[320px] max-h-[650px] overflow-y-auto outline-none text-sm text-gray-900 leading-relaxed prose max-w-none [&_h2]:text-xl [&_h2]:font-black [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:bg-gray-100 [&_h3]:p-2 [&_h3]:rounded-lg [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-3 [&_img]:border [&_img]:border-gray-200 [&_img]:shadow-xs [&_img]:cursor-pointer [&_img]:transition-all"
        data-placeholder={placeholder}
      />
    </div>
  );
}

