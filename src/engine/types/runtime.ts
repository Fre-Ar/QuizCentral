import { DomainID } from "./schema";

/**
 * QUIZ CENTRAL RUNTIME DEFINITION
 * * This defines the mutable state tree that powers the active application.
 * It is completely decoupled from React (can run in a Worker/Node).
 */

// ============================================================================
// 1. IDENTIFIERS & KEYS
// ============================================================================

/**
 * RuntimeID is the unique key for a block instance in the state map.
 * * - For static blocks: Matches the Schema ID (e.g., "q_name").
 * - For repeated blocks: composite key (e.g., "q_skills:0:level").
 */
export type RuntimeID = string;

// ============================================================================
// 2. ROOT STATE TREE
// ============================================================================

export interface QuizSessionState {
  // --- Metadata ---
  sessionId: string;
  schemaId: string;
  startTime: number; // Unix timestamp
  updatedAt: number;
  status: "idle" | "active" | "completed";

  // --- Navigation ---
  // We track the linear history to support "Back" functionality accurately
  currentStepId: string; // The ID of the current PageNode
  history: string[];     // Stack of visited Page IDs

  // --- Global Memory ---
  // Corresponds to 'state' in QuizSchema.
  // These are variables accessible globally (e.g., "score", "flag_qualified")
  variables: Record<string, any>; 

  // --- The Node Graph ---
  // A flat map of every active block's state.
  // This is the source of truth for the UI.
  nodes: Record<RuntimeID, BlockRuntimeState>;
}

// ============================================================================
// 3. NODE STATE
// ============================================================================

export interface BlockRuntimeState {
  id: RuntimeID;
  schemaId: string; // Reference to the static definition

  // Link to the parent InteractionUnit that owns the data
  scopeId?: string;
  
  // --- Data Binding ---
  // The actual value held by this block. 
  // For Containers, this might be null. 
  // For IUs, it matches the Domain.
  value: any; 

  // --- Lifecycle Flags ---
  visited: boolean; // True if user focused/blurred
  touched: boolean; // True if user modified value

  // --- Validation ---
  // Computed by the Engine based on Domain Rules + Context Validators
  validation: {
    isValid: boolean;
    errors: string[]; // List of human-readable error strings
  };

  // --- Computed Behavior ---
  // The Engine resolves LogicExpressions (hidden, disabled) into booleans
  // so the View layer implies renders them.
  computed: {
    hidden: boolean;
    disabled: boolean;
    required: boolean; // Derived from state.required
  };

  // --- Hierarchy Management ---
  // For standard containers: strict order from schema.
  // For random containers: the shuffled order.
  // For repeaters: the list of generated Virtual IDs (e.g., ["item:0", "item:1"]).
  childrenIds?: RuntimeID[]; 
}

// ============================================================================
// 4. CONTEXT & EVALUATION
// ============================================================================

/**
 * Passed to the LogicEvaluator. 
 * Represents the scope in which an expression is evaluated.
 */
export interface EvaluationContext {
  // Global variables (quiz.score)
  globals: Record<string, any>;
  
  // The values of all other nodes (access by ID)
  nodes: Record<RuntimeID, any>;

  value?: any; // The current node's value (for convenience)
}

// ============================================================================
// 5. ENGINE ACTIONS
// ============================================================================

/**
 * Strict payloads for modifying state.
 * The State Store should only be mutated via these actions.
 */
export type EngineAction = 
  | { type: "INIT_SESSION"; schema: any; initialState?: any }
  | { type: "SET_VALUE"; id: RuntimeID; value: any }
  | { type: "SET_NODE_PROPERTY"; id: RuntimeID; property: string; value: any }
  | { type: "NAVIGATE"; targetId: string } // Next/Prev/Jump
  | { type: "EXECUTE_LISTENER"; ruleId: string }; // Trigger side-effects