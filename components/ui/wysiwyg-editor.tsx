// components/ui/wysiwyg-editor.tsx
"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useState, useRef, useCallback, useEffect } from 'react';

const buttonClass = "p-1 rounded hover:bg-gray-200 mr-1";
const activeButtonClass = "p-1 rounded bg-gray-200 mr-1";

type WysiwygEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  name: string;
  id?: string;
};

const DEBOUNCE_DELAY = 300;

export function WysiwygEditor({ value, onChange, placeholder, name, id }: WysiwygEditorProps) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestHtmlRef = useRef(value);

  const debouncedOnChange = useCallback((html: string) => {
    onChange(html);
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => { // TypeScript should infer the type of 'editor' here
      const newHtml = editor.getHTML();
      latestHtmlRef.current = newHtml;

      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }

      updateTimerRef.current = setTimeout(() => {
        debouncedOnChange(latestHtmlRef.current);
      }, DEBOUNCE_DELAY);
    },
    editorProps: {
      attributes: {
        class: 'prose focus:outline-none max-w-none',
      },
    },
    // Removed immediatelyRender: false
    // Removed onContentUpdate
  });

  // Cleanup the timer when the component unmounts
  useEffect(() => {
    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, []);

  // Handle external value changes: Tiptap's useEditor automatically
  // handles updates to the 'content' prop passed during hook initialization.
  // If the parent changes the 'value' prop after the initial render,
  // Tiptap will update the editor content accordingly.

  if (!editor) {
    return null;
  }

  const handleImagePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;

    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();

        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
              editor.chain().focus().setImage({ src: result }).run();
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleImageUpload = () => {
    hiddenInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          editor.chain().focus().setImage({ src: result }).run();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="border rounded-md flex flex-col" onPaste={handleImagePaste}>
      <div className="bg-gray-50 p-2 border-b flex flex-wrap flex-shrink-0">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? activeButtonClass : buttonClass}
          title="Bold"
        >
          <span className="font-bold">B</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? activeButtonClass : buttonClass}
          title="Italic"
        >
          <span className="italic">I</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? activeButtonClass : buttonClass}
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? activeButtonClass : buttonClass}
          title="Numbered List"
        >
          1. List
        </button>
         <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? activeButtonClass : buttonClass}
          title="Blockquote"
        >
          ❝
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={buttonClass}
          title="Horizontal Rule"
        >
          ---
        </button>
         <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className={buttonClass}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          ↩️
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className={buttonClass}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          ↪️
        </button>
        <button
          type="button"
          onClick={handleImageUpload}
          className={buttonClass}
          title="Insert Image"
        >
          🖼️ Image
        </button>
        <input
          ref={hiddenInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <EditorContent
        editor={editor}
        className="p-3 prose max-w-none flex-grow"
      />

      <input
        type="hidden"
        name={name}
        value={value}
        id={id}
      />

      <style jsx global>{`
        .tiptap.ProseMirror {
          min-height: 400px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          padding: 1rem;
        }

        .tiptap > div[contenteditable="true"] {
             min-height: 100%;
             flex-grow: 1;
        }

         .p-3 {
           padding: 0 !important;
         }
      `}</style>
    </div>
  );
}