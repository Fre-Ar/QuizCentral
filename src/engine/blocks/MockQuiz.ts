import { QuizSchema, PageNode, InteractionUnit, ContainerBlock, TextBlock, TriggerBlock, ToggleBlock, StyleSchema, StyleProperties, StyleRegistry } from "@/engine/types/schema";

// ==========
// Styles
// ==========

const TEXT_STYLE_PROPS: StyleProperties = {
  font_size: "base",
  font_weight: "bold"
};

const TEXT_STYLE: StyleSchema = {
  id: "text_style_id",
  properties: TEXT_STYLE_PROPS
};

const CONTAINER_STYLE_PROPS: StyleProperties = {
  gap: "sm",
};

const CONTAINER_STYLE: StyleSchema = {
  id: "question_container",
  properties: CONTAINER_STYLE_PROPS
};

const GREEN_BG_STYLE_PROPS: StyleProperties = {
  bg_color: "#2E6F40",
};

const GREEN_BG_STYLE: StyleSchema = {
  id: "green_bg",
  properties: GREEN_BG_STYLE_PROPS
};

const WHITE_TXT_STYLE_PROPS: StyleProperties = {
  text_color: "#FFFFFF",
};

const WHITE_TXT_STYLE: StyleSchema = {
  id: "white_text",
  properties: WHITE_TXT_STYLE_PROPS
};

const STYLES = [
  TEXT_STYLE,
  CONTAINER_STYLE,
  GREEN_BG_STYLE,
  WHITE_TXT_STYLE,
];

export const MOCK_USER_STYLES: StyleRegistry = new Map(
  STYLES.map((style) => [style.id, style.properties])
);



// ==========
// QUESTIONS
// ==========

// Q1
const Q1_TEXT: TextBlock = {
  id: "text_001",
  type: "text",
  props: {
      content: "Do you want to take this quiz?",
      styling: { classes: ["text_style_id"] },
  }
};

const Q1_TRIGGER: TriggerBlock = {
  id: "trigger_001",
  type: "trigger",
  props: {
    label: "Show question",
    disabled: false,

    styling: { classes: [] }, 

    state_logic: {
      disabled: {
        "==": [{ "var": "value" }, true] 
      }
    },

    events: {
        on_click: {
          "set": [{ "var": "value" }, true],
        },
    },
  },
}

const Q1_VIEW: ContainerBlock = {
  id: "container_001",
  type: "container",
  props: {
    behavior: {
        shuffle_children: false,
        pick_n: null,
    },
    styling: { classes: [] }, // default styles
    children: [ Q1_TEXT, Q1_TRIGGER ]  
  },
}

const Q1: InteractionUnit = {
    id: "q1",
    type: "interaction_unit",
    domain_id: "$$BOOL",

    state: {
      // TODO: CAREFUL WITH DEFAULT VALUES, NULL DOES NOT TRIGGER SAME LOGIC AS FALSE, FIX
        value: false,
        visited: false,
        required: true,
    },

    // behavior is optional

    view: Q1_VIEW
}

// Q2
const Q2_TEXT: TextBlock = {
  id: "text_002",
  type: "text",
  props: {
    content: "What is the capital of **France**?",
    styling: { classes: ["text_style_id"] },
  },
}

const Q2_option1: ToggleBlock = {
  id: "toggle_001",
  type: "toggle",
  props: {
    variant: "radio",

    label: "Paris",
    label_position: "end",

    styling: { classes: ["green_bg", "white_text"] },
    
    state_logic:{
      active: {
        "==": [{ var: "value" }, null],
      }
    },

    events: {
      on_click: { set: [{ var: "value" }, [1]] },
    },
  },
}

const Q2_option2: ToggleBlock = {
  id: "toggle_002",
  type: "toggle",
  props: {
    variant: "radio",

    label: "Berlin",
    label_position: "end",

    styling: { classes: ["green_bg", "white_text"] },
    
    state_logic:{
      active: {
        "==": [{ var: "value" }, [2]],
      }
    },

    events: {
      on_click: { set: [{ var: "value" }, [2]] },
    },
  },
}

const Q2_option3: ToggleBlock = {
  id: "toggle_003",
  type: "toggle",
  props: {
    variant: "radio",

    label: "Toulouse",
    label_position: "end",

    styling: { classes: ["green_bg", "white_text"] },

    state_logic:{
      active: {
        "==": [{ var: "value" }, [3]],
      }
    },

    events: {
      on_click: { set: [{ var: "value" }, [3]] },
    },
  },
}

const Q2_option4: ToggleBlock = {
  id: "toggle_004",
  type: "toggle",
  props: {
    variant: "radio",

    label: "Versailles",
    label_position: "end",

    styling: { classes: ["green_bg", "white_text"] },

    state_logic:{
      active: {
        "==": [{ var: "value" }, [4]],
      }
    },

    events: {
      on_click: { set: [{ var: "value" }, [4]] },
    },
  },
}

const Q2_OPTIONS: ContainerBlock = {
  id: "container_002",
  type: "container",
  props: {
    behavior: {
      shuffle_children: true,
      pick_n: null, 
    },
    styling: { classes: ["question_container"] },

    children: [ Q2_option1, Q2_option2, Q2_option3, Q2_option4],
  },
}

const Q2_VIEW: ContainerBlock = {
  id: "container_003",
  type: "container",
  props: {
    behavior: {
      shuffle_children: false,
      pick_n: null,
    },
    styling: { classes: [] }, // default styles

    children: [ Q2_TEXT, Q2_OPTIONS ],
  },
}

const Q2: InteractionUnit = {
  id: "q2",
  type: "interaction_unit",
  domain_id: [[1], [2], [3], [4]],

  state: {
    value: null,
    visited: false,
    required: false,
  },

  behavior: {
    hidden: {
      "==": [{ var: "q1.value" }, false],
    },

    listeners: {
      "q1.value": [{
        "if": [
          { "==": [{ var: "q1.value" }, true] },
          { set: [{ var: "required" }, true] },
          null,
        ],
      }],
      "quiz.timer": [{
        "if": [
          { "==": [{ var: "quiz.timer" }, 0] },
          {
            "+=": [
              { var: "quiz.score" },
              {
                int: [{ "==": [{ var: "q2.value" }, 1] }],
              },
            ],
          },
          null,
        ],
      }],
    },
  },
  view: Q2_VIEW,
}

// Page Schema
const MOCK_PAGE: PageNode = {
  id: "page01",
  title: "First Part: The Only Part.",
  blocks: [ Q1, Q2 ]
};

// --- MOCK SCHEMA ---
export const MOCK_SCHEMA: QuizSchema = {
  id: "quiz_001",
  meta: {
    title: "An example Quiz",
    description: "This is quiz is *specifically* made as an example.",
  },

  config: {
    time_limit_seconds: 20 * 60,
    navigation_mode: "free",
  },

  state: {
    // TODO: beware of type:"integer" when it isn't supported even tho it is written like that in the quiz-schema.md
    score: { type: { dom: "$$INT" }, default: 0 },
  },

  pages: [MOCK_PAGE],
};