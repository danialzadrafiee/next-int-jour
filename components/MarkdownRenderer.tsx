// components/MarkdownRenderer.tsx
"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';

interface MarkdownRendererProps {
  content: string;
}

// Basic cache to avoid re-fetching image dimensions repeatedly in one render
const imageDimensionCache = new Map<string, { width: number; height: number }>();

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || '/uploads';

  // Custom component to handle the ![[filename.png]] syntax
  const renderCustomImage = (filename: string) => {
    const imagePath = `${imageBaseUrl}/images/${filename}`;

    // For Next/Image, we ideally need width/height or fill={true}.
    // Getting actual dimensions is tricky without server-side processing or
    // loading the image first. Using fill is often easier for responsive layouts.
    // Or provide fixed reasonable dimensions. Let's try fill.
    return (
      <div key={filename} className="relative w-full my-4 aspect-video overflow-hidden rounded-md border"> {/* Adjust aspect ratio as needed */}
        <Image
          src={imagePath}
          alt={filename}
          fill
          style={{ objectFit: 'contain' }} // 'contain' or 'cover'
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Help browser optimize loading
          onError={(e) => {
            console.warn(`Image not found or failed to load: ${imagePath}`);
            // Optionally replace with a placeholder or hide
             e.currentTarget.style.display = 'none';
             const parent = e.currentTarget.parentElement;
             if (parent) {
                const warning = document.createElement('p');
                warning.textContent = `⚠️ Image not found: ${filename}`;
                warning.className = 'text-red-500 text-sm';
                parent.appendChild(warning);
             }
          }}
        />
      </div>
    );
  };

  // Regex to find ![[filename.ext]]
  const pattern = /!\[\[([^\]]+)\]\]/g;
  const parts: (string | React.ReactNode)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }
    // Add the rendered image component
    const filename = match[1];
    parts.push(renderCustomImage(filename));
    lastIndex = pattern.lastIndex;
  }

  // Add any remaining text after the last match
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  // Render the parts, wrapping text segments in ReactMarkdown
  return (
    <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none dark:prose-invert">
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          // Render normal markdown text
          return (
             <ReactMarkdown key={`text-${index}`} remarkPlugins={[remarkGfm]}>
                {part}
             </ReactMarkdown>
          );
        } else {
          // Render the custom image component
          return <React.Fragment key={`image-${index}`}>{part}</React.Fragment>;
        }
      })}
    </div>
  );
};

export default MarkdownRenderer;