// components/ui/wysiwyg-editor.tsx
"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useState, useRef } from 'react';

// Define button styles for reuse
const buttonClass = "p-1 rounded hover:bg-gray-200 mr-1";
const activeButtonClass = "p-1 rounded bg-gray-200 mr-1";

type WysiwygEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  name: string; // For form handling
  id?: string;
};

export function WysiwygEditor({ value, onChange, placeholder, name, id }: WysiwygEditorProps) {
  const [imageUrl, setImageUrl] = useState('');
  const hiddenInputRef = useRef<HTMLInputElement>(null);

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
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

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
    <div className="border rounded-md" onPaste={handleImagePaste}>
      <div className="bg-gray-50 p-2 border-b flex flex-wrap">
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
        className="p-3 min-h-[150px] prose max-w-none" 
      />
      
      {/* Hidden input to store HTML content for form submission */}
      <input 
        type="hidden" 
        name={name} 
        value={value} 
        id={id} 
      />
    </div>
  );
}