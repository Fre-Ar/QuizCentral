# Blocks
## Quiz
```typescript
{
  "id": string;
    
  "meta": {
    "title": string;
    "description"?: string; // Markdown supported
  };

  "config": {
    // 1. TIME LIMIT
    // Global countdown. If 0 or undefined, infinite.
    "time_limit_seconds"?: number;

    // 2. NAVIGATION
    // "linear": User cannot go back. Forward only.
    // "free": User can navigate Previous/Next freely.
    "navigation_mode": "linear" | "free";
    
    // 3. PROGRESSION (Implicit)
    // The engine enforces that all IUs with 'state.required = true' 
    // on the current page must be valid before 'Next' is enabled.
  };

  // GLOBAL STATE
  // Variables that persist across pages (e.g. "score").
  "state"?: Record<string, {
    "type": "integer" | "boolean" | "string",
    "default": any,
  }>;

  // THE STRUCTURE
  // A flat list of Pages. 
  // If you want "Sections", use a Container Block with a Heading inside the Page.
  "pages": PageNode[]
}
```

## Page
```typescript
interface PageNode {
  id: string;
  
  // OPTIONAL HEADER
  // Useful for the Sidebar/Progress bar (e.g. "Step 1: Personal Info")
  title?: string;

  // THE CONTENT
  // A list of IUs, Containers, or Visual Blocks.
  // The Renderer stacks these vertically (Single Column).
  blocks: (InteractionUnit | VisualBlock)[]; 
}
```

## Interaction Block

```typescript
{
  "id": string,
  "type": "interaction_unit",
  
  // 1. THE MODEL (Data Binding)
  "domain_id": string, 
  
  // 2. THE STATE (Lifecycle)
  "state": {
    "value": any, // Must match Domain Primitive (or be null)
    "visited"?: boolean, // Default false. Becomes true on 'blur'.
    "required"?: boolean // Default false. The user manually enables it.
  },

  // 3. THE CONTROLLER (Contextual Behavior)
  // Logic that depends on the Environment (Other questions, Time, User Profile).
  // Domain Rules (x < 5) live in the Domain. 
  // Context Rules (x < Question1.value) live here.
  "behavior"?: {
    // Visibility: Should this block exist in the DOM?
    "hidden"?: LogicExpression, 

    // Mutability: Is this block interactive?
    // (Overrides visual props.disabled if present)
    "disabled"?: LogicExpression, 

    // Contextual Validation: Extra rules specific to this instance
    "context_validators"?: [
      {
        "rule": LogicExpression, // e.g. { ">": [{"var": "value"}, {"var": "block_001.value"}] }
        "error_message": string
      },
      {...},
    ],
    
    // Side Effects: Trigger actions on external state changes
    // e.g. "If Timer hits 0, set value to null"
    "listeners"?: {
      // KEY: The Variable ID to watch (The Trigger)
      // The engine monitors this value. When it changes, this block runs.
      "quiz.timer": { 
        // listens for quiz.timer to be 0, upon which it runs the set value action. Otherwise, it doesn't do anything when quiz.timer changes.
        "if": [
          { "==": [ { "var": "quiz.timer" }, 0 ] },
          { "set": [ { "var": "value" }, null ] },
          null
        ]
      }
    }
  },

  // 4. THE VIEW (Visual Composition)
  // The Root Block that renders this IU. 
  // Typically a container containing labels and inputs.
  "view": VisualBlock
}
```

### Example 1: 5 star rating system
``` typescript
{
  "id": "iu_satisfaction_rating",
  "type": "interaction_unit",
  "domain_id": "dom_rating_5", // Range(1, 5)
  
  "tate": {
    "value": null,
    "visited"?: false, // default
    "required"?: true // usually it would be optional, for demonstration's sake, it is required here
  },

  "behavior": {
    // Logic: Only show this rating if the user actually bought something
    "hidden": { "==": [{ "var": "q_purchase_made.value" }, false] }
  },

  // THE COMPOSITE VIEW
  "view": {
    "type": "container", // Container
    "props": {
      "styling": {
        "classes": ["horizontal_list"], // add gap, margin, flex horizontal, etc. May also define styles that all of its children will use (unless the children orrivide these)
      }
      // Child 1: The Question Label
      "children": [
        {
          "type": "text",
          "props": { 
            "content": "How would you rate our service?",
            "styling": { "classes": ["text_label"] } // defines typograhy, font family, color, etc
          }
        },
        // Child 2: The Interactive Stars (The Repeater)
        {
          "type": "repeater",
          "source": { "domain_id": "dom_rating_5" }, // Generates [1, 2, 3, 4, 5]
          "template": {
            "type": "toggle", 
            "props": {
              "variant": { "icon_on": "star_filled", "icon_off": "star_outline" },
              "label": "", // No text label, just icon
              
              "styling": { "classes": ["icon_lg", "text_amber"] },
              
              // LOGIC: The "Fill Left" Behavior
              // Active if Main Value >= Current Item (1..5)
              "state_logic": {
                "active": { ">=": [{ "var": "value" }, { "var": "item" }] }
              },
              
              // EVENT: Click sets the Main Value
              "events": {
                "on_click": { "set": [{ "var": "value" }, { "var": "item" }] }
              }
            }
          }
        },
      ]
    }
  }
}
```

### Example 2: Feedback text
``` typescript
{
  "id": "iu_feedback_text",
  "type": "interaction_unit",
  "domain_id": "dom_string_lt_140", // any string with less than 140 characters
  
  "state": {
    "value": "",
    // no need to explicitely write 'visited' when it starts at false
    // no need to explicitely write 'required' when it is at false (default)
  },

  "behavior": {
    // Only enabled if Rating was low (< 3)
    "disabled": { ">=": [{ "var": "iu_satisfaction_rating.value" }, 3] }
  },

  "view": {
    "type": "container",
    "props": {
      "styling": {
        "classes": ["horizontal_list"], 
      }
      "children": [
        {
          "type": "text",
          "props": { 
            "content": "What went wrong? (Optional)",
            "styling": { "classes": ["text_label"] } // defines typograhy, font family, color, etc
          }
        },
        {
          "type": "input", // Standard Input Atom
          "props": {
            // Functional constraints
            "mode": "text",
            "lines": 3,
            // UX Text
            "placeholder": "Tell us more...",
            
            "styling": { "classes": ["input_default"] },
            // no need to have state_logic if there is no custom logic for this specific sub-block (disabled property is inherited)
            // no need to have events if there are no extra events to add.
          }
        }
      ]
    }
  }
}
```

### Data Signature

#### Domain 
Domains can be continuous/discrete, finite or infinite sets who can pontentially be generated by rules. This set is then governed by a set of relations. This set then may have operations defined for it.
```typescript
{
  "id": string,
  // generator of domain
  "definition": { 
    // The initial elements of a domain (before the pipeline is applied) are defined by the source.
    "source": [
      [...], // either an explicit set of values, or one of the 4 reserved ids that define the set of all strings, set of ints, set of reals or set of bools.
      // The user may also pass a domain id. If the id's original domain changes, this one also does.
    ], 
    // Transforms are applied successively, this represents the pipeline. 
    // These transforms are memoryless, and thus cannot generate recursively defined domains (like the fibonnacci sequence).
    // Allowing recursively defined domains would pose problems as 1) validation would no longer be O(1) and 2) simulation validation may not halt for non-monotic sequences.
    "transforms"?: [ 
      { "union":  
        { "with": id } // the user may pass in an explicitely defined domain, but an id will be created for it and passed in instead of the hard-coded set.
      },     
      { "filter": 
        { "expr": Expression } // filter expects an expression that returns True or False (e.g., using operators such as '==', 'in', '<' or '>'). For an input to be valid, it must return True for this test. This corresponds to set difference and intersection.
      },  
      { "map":
        { "expr": Expression } // map expects an expression that returns any single value.   
      },  
      { "combine": {
          "with": id,
          "as"?: string, // 'y' by default
          "expr": Expression // combine expects an expression that returns 1 value (by pair-wise combination with another value of the given domain).  
        } 
      },     
    ]
  },

  // Semantic Anchors, used for scales (ordinal domains)
  "markers"?: {
    // semantic center
    // Useful in grading behavior: If (val > 10) Sentiment = Positive.
    "neutral"?: element
    "polarity"?: 'pos' | 'neg' | 'bipolar'
  }
  // supports piece-wise definitions of relations 
  // supports rules-based definitions of equality, ordinal comparisons, etc
  // relations always return a boolean confirming the relation between the 2 elements
  // These are extra relations on top of already existing relations based on the base scalar types
  // relations have 4 optional keywords: 'rule', 'exception',  
  "relations": {
    // Rules-based
    // Best for: Infinite sets, Math, String logic.
    // Variables: 'x' and 'y' are the two elements being compared.
    "==": { // Overriding default strict equality (e.g., Case Insensitive)
      "rule"?: {  // expects a boolean Expression.
        "==": [ 
          { "lowercase": [ {"var": "x"} ] },
          { "lowercase": [ {"var": "y"} ] } 
        ] 
      },
      // no exceptions to the rule
    },

    // Rules-based with if-else expression to override default behavior of relation or introduce exceptions
    "is_divisible_by": {
      "rule"?: { 
        "if": [
          // 1. Exception: Denominator is 0 -> FALSE
          // if condition
          { "==": [{ "var": "y" }, 0] }, 
          // then
          false,
          // 2. Rule: Modulo is 0 -> TRUE
          // else if
          { "==": [{ "%": [{ "var": "x" }, { "var": "y" }] }, 0] },
          // then
          true,
          // 3. Default
          // else
          false 
        ]  
      },
    }

    // Graph-based (Explicit Topology)
    // Best for: Finite sets, Cyclic logic (RPS), Graph edges.
    // Structure: Adjacency List.
    // Returns: True if edge exists, False otherwise.
    "beats": {
      // no rules
      "explicit"?: { // only explicitely defined 'exceptions'
        "transitive": false, // x -> y && y -> z does not implies x -> z
        "symmetric": false,  // x -> y does not imply y -> x
        "graph": {  // expects an adjacency list.
          "rock":     ["scissors"],
          "paper":    ["rock"],
          "scissors": ["paper"]
        }
      }
    },

    // Synonmy list (Undirected Equivalence)
    "is_synonym_of": {
      // no rules
      "explicit"?: {
        "transitive": true,// will create missing transitive edges (quick <-> rapid)
        "symmetric": true, // will create missing symmetric edges (quick -> fast, rapid -> fast)
        "graph": {
          "fast": ["quick", "rapid"],
          "slow": ["sluggish"]
        }
      }
    },

    // Graph based with explicitely excluded edges
    "is_mutually_intelligible": {
      "explicit"?: {
        "transitive": true,
        "symmetric": true, 
        "graph": {
          // this removes a potential edge between portuguese and romanian, but not with any other element.
          "portuguese": ["spanish", "italian", {"not": "romanian"}],
          "italian": ["romanian"]
        }
      }
    }
  },

  "operations": {
    // supports any closed operator that takes in 2 points of this domain and maps it to a point of the domain
    "+": {
      "rule"?: {
        "%": [
          { "+": [{ "var": "a" }, { "var": "b" }] },
          12 // Hardcoded modulus for this domain
        ]
      },
    },

    // Example: String Concatenation with separator
    "merge": {

      "explicit"?: {
        "transitive": true, // associative flag
        "symmetric": true,  // commutative flag
        "graph": {
          "red": [
            {"blue": "purple"},
            {"yellow": "orange"}
          ],
          "blue": [
            {"yellow": "green"}
          ]
        }
      },
      "rule"?: {
        "cat": [{ "var": "a" }, "-", { "var": "b" }]
      }
    }
  }

}
```

#### Expressions
Using JsonLogic: 
```typescript
// filter expr: x % 2 == 0
{
  // supports boolean operators between predicates ('and', 'or', 'not').
  // supports membership of given domain for all types ('in' keyword).
  // supports equality for all types ('==')
  // supports ordinal comparisons for strings and numbers like min, max ('<', '>').
  // supports number operations like step (modulus '%').
  // supports string operators like length ('len').
  // by default, x refers to the element of this domain.
  "==": [
    { "%": [
      { "var": "x" }, 2
      ] 
    }, 0
  ]
}

// filter expr: x in Domain.
{
  "in": [
    { "var": "x" }, {"dom": id}
  ]
}

// map expr: x * 5
{
  // supports boolean operators ('and', 'or', 'not') for boolean types.
  // supports '+', '-', '*', '/', '%' for numbers
  // supports 'append', 'len' for strings
  // supports type conversion 'str()', 'bool()' for all types
  // supports type conversion 'int()', 'float()' for all types, with possible non-defined behavior/exceptions for strings.
  "*": [
    { "var": "x" }, 5
  ]
}

// combine expr: '{x} of {y}'
{
  // supports one-to-many operations like flatMaps (e.g., 'Ace' is mapped to 'Ace of Hearts', 'Ace of Diamonds', etc.). In this case, all the resulting elements individually become elements of the domain.
  // By default, 'y' refers to the element of the given domain, x is from the streamed domain.
  "cat": [
    { "var": "x" }, ' of ',  { "var": "y" }
  ]
}
```


#### Structure Data
Composite Domains are simply domains which define a `"construct"` inside their `"definition"`.

Defining same-domain arrays and tuples:
```typescript
{
  "id": string,
  "definition": {
    // Array with min and max length, with all its entries being of a same domain
    "construct": 
      "shape": {
        "default": {"dom": id}
      },
      "size": {
        "min": int,
        "max": int
      }
  },

  // Relations & Operations apply to the structure as a whole
  "relations": { ... }, // access an entry covered under 'default', use indices starting at 0
  // ex: {"var": "x.0" } // accesses the 1st entry
  // ex: {"var": "x.0.1" } // accesses the 2nd entry of the 1st entry
  "operations": { ... }
}
```
Defining records and multi-domain tuples
```typescript
{
  "id": string,
  "definition": {
    // Array with min and max length, with all its entries being of a same domain
    "construct": 
      // shape defines the set of allowable keys
      "shape": {
        // naming variables with '.' inside of them is strictly forbidden
        "id": {"dom": id1},
        "0": {"dom": id2},
        "default": {"dom": id3} 
        // We treat the object as a fixed set of "Named Slots" plus a variable set of "Numeric Slots".
        // Algorithm:
        // 1. Reserve Named Slots: Count all keys in shape that are not integers (e.g., "id"). Let this be K_{named}.
        // 2. Calculate Numeric Budget: Budget = Size_{max} - K_{named}.
        // 3. Iterate Indices: Run loop for i from 0 to Budget - 1.
        // 4. Resolve Domain: 
        // - If shape[i] exists -> Use Explicit Domain.
        // - Else if shape["default"] exists -> Use Default Domain.
        // - Else -> Stop (Structure is effectively full or restricted at this index).
      },
      // size defines the requirements of the structural element (how many keys does it need, how many keys is it allowed to have)
      "size": {
        "min"?: int, // default 0   (no min)
        "max"?: int  // default inf (no max)
        // If the number of explicitely defined entries is lower than max size (and there is not a "default" entry), we throw a Schema Definition Error to tell the user the schema is invalid.
        // If the number is higher, it should still be allowed, but any element of this domain will, by consequence, never have the full defined shape. We warn the user of this behavior. This is the "Sparse" structure case.
      }
      
  },

  "relations": { ... }, 
  // ex: {"var": "x.id" } // accesses the entry named "id".
  // {"keys": [ {"var": "x"} ] } // accesses the list of keys (strings) so logic can be applied based on keys. They can however not be changed (they're immutable).
  "operations": { ... }
}
```

### View Blocks

#### Static Formatters
```typescript
{
  "type": "text",
  "props": {
    "content": "What is the capital of **France**?", // Markdown support, '{"icon": "icon_name"} is also supported.
    "styling": {
      "classes": [ style_id, ... ],
      "overrides"?: StyleProperties
    }
  }
}

{
  "type": "image",
  "props": {
    "src": "url", 
    "alt": "A map of Europe",
    "aspect": "16:9",
    "styling": {
      "classes": [ style_id, ... ],
      "overrides"?: StyleProperties
    }
  }
}

{
  "type": "divider",
  "props": {
    "styling": {
      "classes": [ style_id, ... ], // defines thickness through the 'border' style prop
      "overrides"?: StyleProperties
    }
  }
}
```

#### Metaphor List

```typescript
// Button
{
  "type": "trigger",
  "props": {
    "label": "Submit",
    "disabled": false, // Default state

    "styling": {
      "classes": [ style_id, ... ],
      "overrides"?: StyleProperties
    },
  
    // Logic-Driven Styling
    // Maps a Style State (active/checked, disabled, hidden) to a JsonLogic Boolean expression.
    // If true, the renderer applies that state's styles.
    "state_logic"?: {
      "active"?: LogicExpression,   // when the Expression is true, this IU is active
      "disabled"?: LogicExpression, // when the Expression is true, this IU is disabled
      "hidden"?: LogicExpression    // when the Expression is true, this IU is hidden
    },

    // Event Handlers
    // Maps a native event to an Operation on the IU State.
    "events"?: {
      "on_click"?: { 
        // value refers to the current input value, which is an element of the domain (and may thus be a string, number, boolean, or even a construct)
        "set": [
          { "var": "value" }, args
        ]
      }
    }

  }
}
// Toggle on/off
{
  "type": "toggle",
  "props": {
    "variant": "checkbox" | "radio" | "switch" | {"icon_on": "icon_name", "icon_off": "icon_name" }, // supports custom on/off states
    // The label is strictly the text *attached* to the clickable area.
    // (e.g., "I agree to terms")
    "label": "Option A", 
    "label_position": "end" | "start",
    
    "styling": { ... },
    "state_logic"?: { ... },
    "events"?: { ... }i
  }
}
// Type-in input
{
  "type": "input",
  "props": {
    // Functional constraints
    "mode": "text" | "numeric" | "decimal" | "tel" | "email",
    "lines": number, // If 1, default input field, if multiline then textarea. The box size is fixed (cannot be expanded but should be scrollable if the lines is > 1)
    
    // UX Text
    "placeholder": "Type your answer...",
    
    "styling": { ... },
    "state_logic"?: { ... },
    "events"?: { ... }
  }
}
// Slider 
{
  "type": "slider",
  "props": {
    // Visuals
    "show_ticks": boolean,
    "show_track": boolean,
    "show_value_tooltip": boolean, // Bubble showing value while dragging
    "orientation": "horizontal" | "vertical",

    "styling": { ... },
    "state_logic"?: { ... },
    "events"?: { ... }
  }
}

{
  "kind": "select",
  "props": {
    "variant": "dropdown" | "listbox" | "chips",
    "placeholder": "Select an option",
    "clearable": boolean // Show 'X' to reset
    
    "styling": { ... },
    "state_logic"?: { ... },
    "events"?: { ... }
  }
}
```


#### Styles
We first introduce a Styles Registry which defines an array of reusable styles "classes" composed of strict design tokens.
Then we define a style schema:
```typescript
{
  "id": string,

  // INHERITANCE 
  // Allows creating variants without re-defining everything.
  // e.g., "style_card_error" extends "style_card_base"
  "extends"?: string,

  // 1. BASE STATE PROPERTIES
  // These always override 'extends'
  "properties": StyleProperties,

  // 2. INTERACTIVE STATES
  // Each state is a Partial overrides object of the same Properties type.
  "states"?: {
    "hover"?:   StyleProperties, // Mouse over
    "active"?:  StyleProperties, // Click / Press down
    "focus"?:   StyleProperties, // Keyboard tab / Input select
    "disabled"?: StyleProperties // Logic: enabled=false
  }
}
```

##### Style Properties
```typescript
{
  // --- LAYOUT & POSITIONING ---
  "display"?: "block" | "flex" | "grid" | "none", // Critical for hiding elements
  
  // Box Model
  "padding"?: "none" | "sm" | "md" | "lg" | "xl",
  "margin"?:  "none" | "sm" | "md" | "lg" | "auto",
  
  // Sizing
  "width"?:   "auto" | "full" | "screen", // w-full
  "height"?:  "auto" | "full" | "screen", // h-full
  "max_width"?: "sm" | "md" | "lg" | "content", // max-w-prose
  
  // Flex/Grid Alignment (Parent)
  "gap"?:     "none" | "sm" | "md" | "lg",
  "align_items"?: "start" | "center" | "end" | "stretch", // Cross Axis
  "justify_content"?: "start" | "center" | "end" | "between", // Main Axis

  // Flex Child (Self)
  "flex_grow"?: boolean, // flex-1
  "flex_shrink"?: boolean,
  
  // --- APPEARANCE ---
  "bg_color"?: string, // hex or token
  "opacity"?: number, // 0.0 to 1.0
  
  // Borders
  "border"?:     "none" | "thin" | "thick",
  "border_style"?: "solid" | "dashed" | "dotted",
  "border_color"?: string,
  "radius"?:     "none" | "sm" | "md" | "full", // rounded-lg
  
  // Depth
  "shadow"?: "none" | "sm" | "md" | "lg", // shadow-lg

  // --- TYPOGRAPHY ---
  "text_color"?: string, // if the content is a coloureable icon, this fills it.
  "font_family"?: "sans" | "serif" | "mono", 
  "font_size"?:   "xs" | "sm" | "base" | "lg" | "xl" | "2xl", // if the content is a coloureable icon, this sizes it.
  "font_weight"?: "regular" | "bold",
  "font_style"?:  "italic" | "normal",
  "text_align"?:  "left" | "center" | "right" | "justify",
  "line_height"?: "tight" | "base" | "loose",
  "text_deco"?:   "none" | "underline" | "through",

  // --- INTERACTION ---
  "cursor"?: "auto" | "pointer" | "not-allowed" | "text"
}
```

## Container Block

```typescript
{
  "type": "container",
  "props": {
    "children": [],
    // BEHAVIOR CONFIG
    "behavior": {
      // 1. RANDOMIZATION
      // If true, the Renderer shuffles the 'children' array before mounting.
      // Seeded by the Session ID to ensure consistency on refresh.
      "shuffle_children": boolean, // Default false
      
      // 2. SUBSET (Optional)
      // "Pick 3 random questions from this pool of 10"
      // Works in tandem with shuffle.
      "pick_n": number // Default null (Show all)
    },
    "styling": {
      "classes": [ style_id, ...? ],
      "overrides"?: StyleProperties
    }
  }
}


{
  // The repeater creates multiple copies of the template. It designed to be passed in as a child of a container
  "type": "repeater", // Iterates over a data source (may be a finite domain, may be an array)
  "source": { "domain_id": "dom_rating_5" }, // Generates [1, 2, 3, 4, 5]
  
  // The Template (Rendered 5 times)
  // This may only be used with finite domains
  // Inside here, "item" refers to the current number (1..5)
  "template": {
    "type": "toggle",
    "props": {
      "variant": {"icon_on": "gold_star", "icon_off": "grey_star" }, 

      "label": "",  // render no label
      "label_position": "end" | "start",
      
      "styling": { "classes": ["style_star_interactive"] },
      // LOGIC: Uses "item" variable
      "state_logic": {
        "checked": { ">=": [{ "var": "value" }, { "var": "item" }] }
      },
      
      // ACTION: Uses "item" variable
      "events": {
        "on_click": { "set": [ { "var": "value" },  { "var": "item" } ] }
      }
    }
  }
}
```

## Quiz Page
- page bg (color, gradient, img)
- page width
- header/footer(?)
- progress counter/bar (?)