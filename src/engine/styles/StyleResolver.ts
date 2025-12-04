import { StyleProperties, StylingProps } from "../types/schema";

/**
 * Result of the resolution process.
 * Passed directly to React components: <div className={className} style={style} />
 */
export interface ResolvedStyle {
  className: string;
  style: React.CSSProperties;
}

// ============================================================================
// TOKEN MAPPINGS (Design System Configuration)
// ============================================================================

const SPACING = {
  none: "0",
  sm: "2",   // 0.5rem
  md: "4",   // 1rem
  lg: "6",   // 1.5rem
  xl: "8",   // 2rem
  auto: "auto"
};

const TEXT_SIZES = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl"
};

const RADIUS = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  full: "rounded-full"
};

// ============================================================================
// RESOLVER LOGIC
// ============================================================================

export class StyleResolver {
  
  /**
   * Main entry point.
   * Converts a block's StylingProps into React-ready attributes.
   * * @param props The styling configuration from the block
   * @param classRegistry Optional map of reusable StyleIDs to Properties (from Schema)
   */
  public static resolve(
    props?: StylingProps, 
    classRegistry?: Map<string, StyleProperties>
  ): ResolvedStyle {
    if (!props) return { className: "", style: {} };

    let combinedProps: StyleProperties = {};

    // 1. Merge Reusable Classes (if registry provided)
    if (props.classes && classRegistry) {
      props.classes.forEach(styleId => {
        const base = classRegistry.get(styleId);
        if (base) combinedProps = { ...combinedProps, ...base };
      });
    }

    // 2. Apply Overrides (Last one wins)
    if (props.overrides) {
      combinedProps = { ...combinedProps, ...props.overrides };
    }

    // 3. Compile to CSS
    return this.compile(combinedProps);
  }

  /**
   * Compiles a flat Property object into Tailwind classes + Inline Styles
   */
  private static compile(p: StyleProperties): ResolvedStyle {
    const classes: string[] = [];
    const style: React.CSSProperties = {};

    // --- LAYOUT ---
    if (p.display) classes.push(p.display === "none" ? "hidden" : p.display);
    
    // Flex/Grid Parent
    if (p.gap) classes.push(`gap-${SPACING[p.gap]}`);
    if (p.align_items) classes.push(`items-${p.align_items}`);
    if (p.justify_content) classes.push(`justify-${p.justify_content}`);
    
    // Flex Child
    if (p.flex_grow) classes.push("grow");
    if (p.flex_shrink) classes.push("shrink");

    // --- SPACING ---
    if (p.padding) classes.push(p.padding === "none" ? "p-0" : `p-${SPACING[p.padding]}`);
    if (p.margin) classes.push(p.margin === "none" ? "m-0" : `m-${SPACING[p.margin]}`);

    // --- SIZING ---
    if (p.width) classes.push(p.width === "full" ? "w-full" : p.width === "screen" ? "w-screen" : "w-auto");
    if (p.height) classes.push(p.height === "full" ? "h-full" : p.height === "screen" ? "h-screen" : "h-auto");
    if (p.max_width) classes.push(p.max_width === "content" ? "max-w-prose" : `max-w-${p.max_width}`);

    // --- APPEARANCE ---
    // Background Color: If it's a hex code, use inline style. If it's a var, use style.
    if (p.bg_color) {
      if (p.bg_color.startsWith("#") || p.bg_color.startsWith("rgb")) {
        style.backgroundColor = p.bg_color;
      } else {
        // Assume it's a tailwind class token like "bg-red-500" if user passes raw string?
        // Or strict mapping? For MVP, we assume hex usually goes to style.
        classes.push(`bg-${p.bg_color}`); 
      }
    }
    
    if (p.opacity !== undefined) style.opacity = p.opacity;

    // Borders
    if (p.border && p.border !== "none") {
      classes.push("border");
      if (p.border === "thick") classes.push("border-4");
    }
    if (p.border_style) classes.push(`border-${p.border_style}`);
    if (p.border_color) style.borderColor = p.border_color;
    if (p.radius) classes.push(RADIUS[p.radius] || "rounded-none");
    if (p.shadow && p.shadow !== "none") classes.push(`shadow-${p.shadow}`);

    // --- TYPOGRAPHY ---
    if (p.text_color) style.color = p.text_color;
    if (p.font_family) classes.push(`font-${p.font_family}`);
    if (p.font_size) classes.push(TEXT_SIZES[p.font_size] || "text-base");
    if (p.font_weight) classes.push(`font-${p.font_weight}`);
    if (p.font_style === "italic") classes.push("italic");
    if (p.text_align) classes.push(`text-${p.text_align}`);
    
    // --- INTERACTION ---
    if (p.cursor) classes.push(`cursor-${p.cursor}`);

    return {
      className: classes.join(" "),
      style
    };
  }
}