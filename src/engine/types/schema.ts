/**
 * QUIZ CENTRAL SCHEMA DEFINITION
 * Source of Truth for the Quiz Engine.
 */

// ============================================================================
// 1. PRIMITIVES & LOGIC
// ============================================================================

/**
 * JsonLogic Expression.
 * Represents a logic tree that resolves to a value at runtime.
 * We use a loose definition here because JsonLogic is extremely flexible,
 * but the Engine will enforce supported operators.
 */
export type LogicExpression = 
  | string
  | number
  | boolean
  | { [operator: string]: LogicExpression | LogicExpression[] | any };

export type InteractionState = {
  value: any; // The current value held by the block
  visited?: boolean; // Has the user interacted/focused?
  required?: boolean; // Is valid input mandatory?
};

// ============================================================================
// 2. DOMAIN SCHEMA (Data Modeling)
// ============================================================================

export type DomainID = string;

export interface DomainDefinition {
  id: DomainID;
  
  // The generative pipeline
  definition: {
    // TODO: MAKE SOURCE OPTIONAL, VALIDATE IF EITHER SOURCE OR CONSTRUCT EXISTS
    source: any[] | DomainID; // Explicit values or reference to another domain
    
    transforms?: DomainTransform[];
    
    // For composite domains (Objects/Tuples)
    construct?: {
      shape?: Record<string, { dom: DomainID }>;
      size?: { min?: number; max?: number };
    };
  };

  markers?: {
    neutral?: any;
    polarity?: 'pos' | 'neg' | 'bipolar';
  };

  relations?: Record<string, DomainRelation>;
  operations?: Record<string, DomainOperation>;
}

export type DomainTransform = 
  | { union: { with: DomainID } }
  | { filter: { expr: LogicExpression } }
  | { map: { expr: LogicExpression } }
  | { combine: { with: DomainID; as?: string; expr: LogicExpression } };

export interface DomainRelation {
  // Rule-based definition
  rule?: LogicExpression;
  
  // Graph-based definition (Adjacency List)
  explicit?: {
    transitive?: boolean;
    symmetric?: boolean;
    graph: Record<string, (string | { not: string })[]>;
  };
}

export interface DomainOperation {
  rule?: LogicExpression;
  explicit?: {
    transitive?: boolean;
    symmetric?: boolean;
    graph?: Record<string, Record<string, string>[]>; // e.g. red + blue = purple
  };
}

// ============================================================================
// 3. STYLE SCHEMA
// ============================================================================

export type StyleID = string;

export interface StyleProperties {
  // --- LAYOUT & POSITIONING ---
  display?: "block" | "flex" | "grid" | "none";
  // Box Model
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  margin?: "none" | "sm" | "md" | "lg" | "auto";
  // Sizing
  width?: "auto" | "full" | "screen";
  height?: "auto" | "full" | "screen";
  max_width?: "sm" | "md" | "lg" | "content";
  // Flex/Grid Alignment
  gap?: "none" | "sm" | "md" | "lg";
  align_items?: "start" | "center" | "end" | "stretch";
  justify_content?: "start" | "center" | "end" | "between";
  // Flex Child (Self)
  flex_grow?: boolean;
  flex_shrink?: boolean;

  // --- APPEARANCE ---
  bg_color?: string; // hex code
  opacity?: number; // 0.0 to 1.0
  // Borders
  border?: "none" | "thin" | "thick";
  border_style?: "solid" | "dashed" | "dotted";
  border_color?: string;
  radius?: "none" | "sm" | "md" | "full";
  // Depth
  shadow?: "none" | "sm" | "md" | "lg";

   // --- TYPOGRAPHY ---
  text_color?: string; // if the content is a coloureable icon, this fills it.
  font_family?: "sans" | "serif" | "mono";
  font_size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl"; // if the content is an icon, this sizes it.
  font_weight?: "regular" | "bold";
  font_style?: "italic" | "normal";
  text_align?: "left" | "center" | "right" | "justify";
  line_height?: "tight" | "base" | "loose";
  text_deco?: "none" | "underline" | "through";

   // --- INTERACTION ---
  cursor?: "auto" | "pointer" | "not-allowed" | "text";
}

export interface StyleSchema {
  id: StyleID;
  extends?: StyleID;
  properties: StyleProperties;
  states?: {
    hover?: Partial<StyleProperties>;
    active?: Partial<StyleProperties>;
    focus?: Partial<StyleProperties>;
    disabled?: Partial<StyleProperties>;
  };
}

export interface StylingProps {
  classes: StyleID[];
  overrides?: Partial<StyleProperties>;
}

// ============================================================================
// 4. BLOCK SCHEMA (The UI Tree)
// ============================================================================

// --- BASE BLOCK ---
export interface BaseBlock {
  type: string;
  id: string; 
}

export interface BaseProps {
  styling?: StylingProps;
}

// --- ROOT NODES ---

export interface QuizSchema {
  id: string;
  meta: {
    title: string;
    description?: string;
  };
  config: {
    time_limit_seconds?: number;
    navigation_mode: "linear" | "free";
  };
  // state stores globally defined variables, like the quiz score
  state?: Record<string, { type: { dom: DomainID }; default: any }>;
  pages: PageNode[];
}

export interface PageNode {
  id: string;
  title?: string;
  blocks: (InteractionUnit | VisualBlock)[];
}

// --- INTERACTION UNIT (The Logic Wrapper) ---

export interface InteractionUnit extends BaseBlock{
  type: "interaction_unit";
  domain_id: DomainID;
  
  state: InteractionState;
  
  behavior?: {
    hidden?: LogicExpression;
    disabled?: LogicExpression;
    context_validators?: {
      rule: LogicExpression;
      error_message: string;
    }[];
    listeners?: Record<string, LogicExpression[]>; // Action sequence
  };

  view: VisualBlock;
}

// --- VISUAL BLOCKS (The Renderers) ---

export type VisualBlock = 
  | StaticBlock
  | MetaphorBlock 
  | ContainerBlock;

// 1. Static Content

export type StaticBlock = TextBlock | ImageBlock | DividerBlock;

export interface TextBlock extends BaseBlock {
  type: "text";
  props: TextProps;
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  props: ImageProps;
}

export interface DividerBlock extends BaseBlock {
  type: "divider";
  props: BaseProps;
}

export interface TextProps extends BaseProps {
  content: string;
}

export interface ImageProps extends BaseProps {
  src: string; 
  alt: string; 
  aspect?: string;
}


// 2. Interactive Metaphors (Inputs)
export type MetaphorBlock = 
  | TriggerBlock 
  | ToggleBlock 
  | InputBlock 
  | SliderBlock 
  | SelectBlock;

export interface TriggerBlock extends BaseBlock {
  type: "trigger";
  props: TriggerProps;
}

export interface ToggleBlock extends BaseBlock {
  type: "toggle";
  props: ToggleProps;
}

export interface InputBlock extends BaseBlock {
  type: "input";
  props: InputProps;
}

export interface SliderBlock extends BaseBlock {
  type: "slider";
  props: SliderProps;
}

export interface SelectBlock extends BaseBlock {
  type: "select";
  props: SelectProps;
}


interface BaseMetaphorProps extends BaseProps {
  disabled?: boolean;
  state_logic?: {
    active?: LogicExpression;
    disabled?: LogicExpression;
    hidden?: LogicExpression;
  };
  // Expanded Events with LogicExpression values
  events?: {
    on_click?: LogicExpression;       // Click / Tap
    on_change?: LogicExpression;      // Value modification
    on_input?: LogicExpression;       // Keystroke / immediate input
    on_focus?: LogicExpression;       // Element gains focus
    on_blur?: LogicExpression;        // Element loses focus
    on_mouse_enter?: LogicExpression; // Hover start
    on_mouse_leave?: LogicExpression; // Hover end
    on_submit?: LogicExpression;      // Form/Enter key submission
  };
}

export interface TriggerProps extends BaseMetaphorProps {
  label: string;
}

export interface ToggleProps extends BaseMetaphorProps {
  variant: "checkbox" | "radio" | "switch" | { icon_on: string; icon_off: string };
  label: string;
  label_position?: "start" | "end";
}

export interface InputProps extends BaseMetaphorProps {
  mode: "text" | "numeric" | "decimal" | "tel" | "email";
  lines?: number;
  placeholder?: string;
}

export interface SliderProps extends BaseMetaphorProps {
  show_ticks?: boolean;
  show_track?: boolean;
  show_value_tooltip?: boolean;
  orientation?: "horizontal" | "vertical";
}

export interface SelectProps extends BaseMetaphorProps {
  variant: "dropdown" | "listbox" | "chips";
  placeholder?: string;
  clearable?: boolean;
}

// 3. Structural Containers
export interface ContainerBlock extends BaseBlock {
  type: "container";
  props: ContainerProps;
}

export interface ContainerProps extends BaseProps {
  children: (InteractionUnit | VisualBlock)[];
  behavior?: {
    shuffle_children?: boolean;
    pick_n?: number;
  };
}