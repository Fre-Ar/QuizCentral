import React from "react";
import { ImageBlock as ImageBlockSchema } from "../../types/schema";
import { useStyleResolver } from "@/engine/hooks/useStyleResolver";

interface ImageBlockProps {
  block: ImageBlockSchema;
}

export const ImageBlock: React.FC<ImageBlockProps> = ({ block }) => {
  const { props } = block;

  // 1. Resolve Styles
  const { className, style } = useStyleResolver(props.styling);

  // 2. Aspect Ratio Logic
  // Maps schema aspect strings to Tailwind classes
  const aspectClass = 
    props.aspect === "16:9" ? "aspect-video" :
    props.aspect === "4:3" ? "aspect-4/3" :
    props.aspect === "1:1" ? "aspect-square" :
    ""; // Default/Natural

  const baseClasses = `max-w-full h-auto object-cover rounded ${aspectClass} ${className}`;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <img
        id={block.id}
        src={props.src}
        alt={props.alt}
        className={baseClasses}
        style={style}
        loading="lazy"
      />
    </div>
  );
};