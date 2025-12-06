import { QuizSchema, PageNode, InteractionUnit, ContainerBlock, TextBlock, TriggerBlock, ToggleBlock, StyleSchema, StyleProperties, StyleRegistry, TemplateDefinition, TemplateInstance } from "@/engine/types/schema";

// ==========
// Styles
// ==========

const TEXT_STYLE_PROPS: StyleProperties = {
  font_size: "base",
  font_weight: "regular",
  font_style: "normal",
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
        "==": [{ var: "value" }, true] 
      }
    },

    events: {
      on_click: {
        "set": [{ ref: "value" }, true],
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
        "==": [{ var: "value" }, [1]],
      }
    },

    events: {
      on_click: { "set": [{ var: "value" }, [1]] },
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
      on_click: { "set": [{ var: "value" }, [2]] },
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
      on_click: { "set": [{ var: "value" }, [3]] },
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
      on_click: { "set": [{ var: "value" }, [4]] },
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
          { "set": [{ ref: "required" }, true] }, // TODO: CHANGE SET SYNTAX SO IT REQUIRES A REF OBJECT
          null,
        ],
      }],
      "quiz.timer": [{
        "if": [
          { "==": [{ var: "quiz.timer" }, 0] },
          {
            "+=": [
              { ref: "quiz.score" },
              { int: [ { "==": [ { "var": "q2.value" }, 1 ] } ] },
            ],
          },
          null,
        ],
      }],
    },
  },
  view: Q2_VIEW,
}

// Q3 (Template)
const Q3_TEXT = {
  type: "text",
  props: {
    content: { param: "question" },
    styling: { classes: { param: "question_text_style" } },
  },
}

const Q3_option = {
  type: "toggle",
  props: {
    variant: "radio",

    label: { var: "opt.label" },
    label_position: "end",

    styling: { classes: { param: "option_style" } },
    
    state_logic:{
      active: {
        "==": [{ var: "value" }, [{ var: "opt.value" }]],
      }
    },

    events: {
      on_click: { "set": [{ var: "value" }, [{ var: "opt.value" }]] },
    },
  },
}

const Q3_OPTIONS = {
  type: "container",
  props: {
    behavior: {
      shuffle_children: { param: "shuffle_options" },
      pick_n: null, 
    },
    styling: { classes: { param: "option_container_style" } },

    children: {
      $$map: {
        source: { param: "options" },
        as: "opt",
        template: Q3_option
      },
    }
  }
}

const Q3_VIEW = {
  type: "container",
  props: {
    behavior: {
      shuffle_children: false,
      pick_n: null,
    },
    styling:{ classes: { param: "container_style" } },

    children: [ Q3_TEXT, Q3_OPTIONS ],
  },
}

const Q3_Domain = {
  $$map: {
    source: { param: "options" },
    as: "opt", 
    template: [{ var: "opt.value" }], 
  }
}

const Q3_TEMPLATE: TemplateDefinition = {
  type: "template",
  id: "tpl_mcq_single", 
  name: "Scored MCQ",
  parameters: {
    question: "string", 
    options: [
      { label: "string", value: "any", points: "number" },
    ],
    container_style: ["style_id"], 
    question_text_style: ["style_id"],
    option_container_style: ["style_id"],
    option_style: ["style_id"],

    shuffle_options: "boolean",
  },

  structure: {
    type: "interaction_unit",
    domain_id: Q3_Domain, // [ [1], [2], [3], [4] ]

    state: {
      value: null,
      visited: false,
      required: true,
    },

    behavior: {
      "quiz.timer": {
        if: [
          { "==": [{ var: "quiz.timer" }, 0] },
          {
            "+=": [
              { ref: "quiz.score" },
              {
                $$switch: {
                  on: { var: "value" },
                  cases: {
                    $$map: {
                      source: { param: "options" },
                      as: "opt",
                      template: {
                        match: { var: "opt.value" },
                        result: { var: "opt.points" },
                      },
                    },
                  },
                  default: 0,
                },
              },
            ],
          },
          null,
        ],
      },
    },

    view: Q3_VIEW,
  }
};


const Q3_INSTANCE: TemplateInstance = {
  type: "template_instance", 
  id: "q2",

  template_id: "tpl_mcq_single",

  state: {
    required: false,
  },

  behavior: {
    hidden: {
      "==": [{ var: "q1.value" }, false],
    },

    listeners: {
      "q1.value": {
        if: [
          { "==": [{ var: "q1.value" }, true] },
          { set: [{ var: "required" }, true] },
          null,
        ],
      }
    }
  },

  parameters: {
    question: "What is the capital of **France**?",
    options: [
      { label: "Paris", value: 1, points: 1.0 },
      { label: "Berlin", value: 2, points: -1.0 },
      { label: "Toulouse", value: 3, points: 0.0 },
      { label: "Versailles", value: 4, points: 0.5 },
    ],
    container_style: [], // no style, default
    question_text_style: ["text_style_id"],
    option_container_style: ["question_container"],
    option_style: ["green_bg", "white_text"],

    shuffle_options: true,
  },
}

// Q4
const Q4_TEXT: TextBlock = {
  type: "text",
  props: {
      content: "Increase the counter!",
      styling: { classes: [] },
  }
};

const Q4_TRIGGER: TriggerBlock = {
  type: "trigger",
  props: {
    label: "Increase counter",
    disabled: false,

    styling: { classes: ["green_bg"] }, 

    events: {
      on_click: {
        "+=": [{ ref: "value" }, 1],
      },
    },
  },
}

const Q4_LABEL: TextBlock = {
  type: "text",
  props: {
    content: "0",
    styling: { classes: ["text_style_id"] },
  }
};

const Q4_VIEW: ContainerBlock = {
  type: "container",
  props: {
    behavior: {
      shuffle_children: false,
      pick_n: null,
    },
    styling: { classes: [] }, // default styles

    children: [ Q4_TEXT, Q4_TRIGGER, Q4_LABEL ],
  },
}

const Q4: InteractionUnit = {
  id: "q4",
  type: "interaction_unit",
  domain_id: "$$INT",

  state: {
    value: 0,
    visited: false,
    required: true,
  },

  view: Q4_VIEW
}



// Page Schema
const MOCK_PAGE: PageNode = {
  id: "page01",
  title: "First Part: The Only Part.",
  blocks: [ Q1, Q2, Q4 ]
};

// --- MOCK SCHEMA ---
export const MOCK_SCHEMA: QuizSchema = {
  id: "quiz_001",
  meta: {
    title: "An example Quiz",
    description: "This is quiz is *specifically* made as an example.",
  },

  config: {
    time_limit_seconds: 10,
    navigation_mode: "free",
  },

  state: {
    // TODO: beware of type:"integer" when it isn't supported even tho it is written like that in the quiz-schema.md
    score: { type: { dom: "$$INT" }, default: 0 },
  },

  pages: [MOCK_PAGE],
};