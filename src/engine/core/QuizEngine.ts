import { StateStore } from "./StateStore";
import { LogicEvaluator } from "./LogicEvaluator";
import { DomainRegistry } from "../domains/DomainRegistry";
import { 
  QuizSchema, PageNode, InteractionUnit, VisualBlock, ContainerBlock, MetaphorBlock
} from "../types/schema";
import { 
  QuizSessionState, BlockRuntimeState, RuntimeID, EngineAction, EvaluationContext 
} from "../types/runtime";
import { logTest } from "@/lib/utils";

/**
 * The Orchestrator.
 * Manages the transition from Static Schema -> Active Session.
 * Handles the "Reactivity Loop" (Input -> Logic -> State).
 */
export class QuizEngine {
  private store: StateStore;
  private schema: QuizSchema;
  private evaluator: LogicEvaluator;
  private domainRegistry: DomainRegistry;

  // Schema Lookup Map (Optimization for O(1) access during runtime)
  private schemaMap: Map<string, InteractionUnit | VisualBlock> = new Map();

  constructor(schema: QuizSchema) {
    this.schema = schema;
    this.evaluator = LogicEvaluator.getInstance();
    this.domainRegistry = DomainRegistry.getInstance();
    
    // 1. Index Schema (Builds the schemaMap)
    this.indexSchema(schema);

    // 2. Hydrate Initial State
    const initialState = this.hydrateState(schema);
    this.store = new StateStore(initialState);
    
    // 3. Initial Computation (Resolve initial visibility/logic)
    this.recalculateDerivedState();
  }

  public getStore(): StateStore {
    return this.store;
  }

  public getSchemaBlock(id: string): InteractionUnit | VisualBlock | undefined {
    return this.schemaMap.get(id);
  }

  /**
   * The Entry Point for all User Interactions.
   */
  public dispatch(action: EngineAction) {
    const currentState = this.store.getState();
    let nextState = { ...currentState }; // Shallow copy root
    let hasChanges = false;

    logTest("Dispatching action:", action);

    switch (action.type) {
      case "SET_VALUE": {
        const node = nextState.nodes[action.id];
        if (!node) {
          console.warn(`Attempted to set value for unknown node: ${action.id}`);
          return;
        }

        // 1. Apply Mutation (Value and Touch)
        // Apply Value & Touch
        const nextNode = {
          ...node,
          value: action.value,
          touched: true,
          // Immediate Validation
          validation: this.validateNode(action.value, node.schemaId)
        };
        nextState.nodes = { ...nextState.nodes, [action.id]: nextNode };

        hasChanges = true;

        // 2. Commit State Immediately (so listeners see the new value)
        logTest("Committing state for SET_VALUE:", nextState);
        this.store.setState(nextState);

        // 3. Process Listeners (Side Effects)
        // e.g. "q1.value" changed -> Run "q2" listeners
        const sideEffects = this.processListeners(`${action.id}.value`, action.value);
        if (sideEffects.length > 0) {
           // If listeners caused MORE changes, we dispatch them recursively or apply them here.
           // For simplicity, we apply them to the *current* nextState reference if possible, 
           // but since we already committed, we should just let the recursion handle it via dispatch.
           sideEffects.forEach(effect => this.dispatch(effect));
           return; // dispatch will handle the subsequent recalculation
        }
        break;
      }

      case "SET_NODE_PROPERTY": {
        const node = nextState.nodes[action.id];
        if (!node) {
          console.warn(`Attempted to set value for unknown node: ${action.id}`);
          return;
        }

        // We strictly limit what properties can be set for safety
        if (action.property === "required" || action.property === "visited") {
          // TODO: MERGE VISITED AND TOUCHED
           // Determine where the property lives. 
           // 'visited' is on root, 'required' is in 'computed'.
           
           let nextNode = { ...node };
           
           if (action.property === "visited") {
             nextNode.visited = action.value;
           } else if (action.property === "required") {
             nextNode.computed = { ...node.computed, required: action.value };
           }

           nextState.nodes = { ...nextState.nodes, [action.id]: nextNode };
           hasChanges = true;
        }
        break;
      }

      case "NAVIGATE": {
        // Logic to validate current page before moving could go here
        nextState.currentStepId = action.targetId;
        nextState.history = [...nextState.history, action.targetId];
        hasChanges = true;
        break;
      }

      // TODO: Implement other actions like EXECUTE_LISTENER AND MAYBE INIT_SESSION
      default:
        console.warn(`Unhandled action type: ${(action as any).type}`);
        break;
    }

    if (hasChanges) {
      this.store.setState(nextState);
      // Trigger the cascade: Logic might change visibility based on new values
      this.recalculateDerivedState();
    }
  }

  // ==========================================================================
  // INITIALIZATION (Hydration & Indexing)
  // ==========================================================================

  private indexSchema(schema: QuizSchema) {
    const visit = (block: InteractionUnit | VisualBlock) => {
      if (block.id) this.schemaMap.set(block.id, block);
      
      if (block.type === "interaction_unit") {
        visit((block as InteractionUnit).view);
      } else if (block.type === "container") {
        (block as ContainerBlock).props.children.forEach(visit);
      }
    };

    schema.pages.forEach(p => p.blocks.forEach(visit));
  }

  private hydrateState(schema: QuizSchema): QuizSessionState {
    const nodes: Record<RuntimeID, BlockRuntimeState> = {};

    const processBlock = (block: InteractionUnit | VisualBlock, currentScopeId?: string): RuntimeID => {
      // Use existing ID or generate stable internal ID
      const id = block.id || `gen_${Math.random().toString(36).substr(2, 9)}`;
      
      const baseState: BlockRuntimeState = {
        id: id,
        schemaId: block.id || id,
        scopeId: currentScopeId,
        value: null,
        visited: false,
        touched: false,
        validation: { isValid: true, errors: [] },
        computed: { hidden: false, disabled: false, required: false },
      };

      logTest("Hydrating block:", id, "of type:", block.type, "with scope:", currentScopeId);

      // 1. Interaction Units: Initialize Logic State
      if (block.type === "interaction_unit") {
        const iu = block as InteractionUnit;
        baseState.value = iu.state.value; 
        baseState.computed.required = iu.state.required || false;
        
        // Recurse into the View (it might be a container)
        processBlock(iu.view, id); 
      }

      // 2. Containers: Recurse Children
      if (block.type === "container") {
        const container = block as ContainerBlock;
        const childIds = container.props.children.map(child => processBlock(child, currentScopeId));
        baseState.childrenIds = childIds;
      }

      nodes[id] = baseState;
      return id;
    };

    schema.pages.forEach(page => {
      page.blocks.forEach(block => processBlock(block));
    });

    return {
      sessionId: `sess_${Date.now()}`,
      schemaId: schema.id,
      startTime: Date.now(),
      updatedAt: Date.now(),
      status: "active",
      currentStepId: schema.pages[0]?.id || "",
      history: [schema.pages[0]?.id || ""],
      variables: {}, 
      nodes: nodes
    };
  }

  // ==========================================================================
  // LISTENER PROCESSING 
  // ==========================================================================

  private processListeners(triggerKey: string, newValue: any): EngineAction[] {
    const state = this.store.getState();
    const effects: EngineAction[] = [];
    
    // Build context for evaluation
    const context: EvaluationContext = {
      globals: state.variables,
      nodes: {},
      ...{ [triggerKey]: newValue } // Inject the change that just happened
    };
    Object.values(state.nodes).forEach(n => {
      context.nodes[n.id] = { value: n.value, ...n.computed };
    });

    // Iterate ALL blocks to find listeners
    // Optimization: In prod, pre-index listeners by triggerKey
    this.schemaMap.forEach((block, id) => {
      if (block.type !== "interaction_unit") return;
      const iu = block as InteractionUnit;
      
      const listeners = iu.behavior?.listeners;
      logTest("Processing listeners for block:", id, "Listeners:", listeners, "for triggerKey:", triggerKey);
      if (!listeners || !listeners[triggerKey]) return;

      const logicChain = listeners[triggerKey];
      // logicChain is an array of expressions (steps) or a single expression
      // The schema implies: "if": [ condition, action, else ]
      // We evaluate the WHOLE thing. The return value should be the Action Description.
      
      // We assume logicChain is an "if" that returns an Action Object, e.g. {"set": ...}
      // However, LogicEvaluator returns the RESULT of operations. 
      // We need to interpret the "set" operator as returning an Action Descriptor, not performing it.
      
      // HACK for MVP: We use the LogicEvaluator, but we need 'set' to return data, not void.
      // Standard JsonLogic 'set' doesn't exist. We must rely on our evaluator returning the struct.
      // IF logicChain contains "set", we assume the schema intention is side-effect.
      
      const result = this.evaluator.evaluate(logicChain as any, context);

      logTest("Listener evaluation result for block", id, ":", result);

      if (result && Array.isArray(result)) {
        logTest("It's an array!")
        result.forEach((res: any) =>
        this.handleEffectResult(res, id, effects));
      }
      
      if (result && typeof result === "object") {
        this.handleEffectResult(result, id, effects);
      }
    });

    return effects;
  }

  private handleEffectResult(result: any, contextId: string, effects: EngineAction[]) {
    // Check if the result describes a known action
    // Schema convention: { "set": [ target, value ] } returned by the IF
    
    // Since we can't easily return the "Instruction" from standard JsonLogic without custom operators
    // that return the instruction rather than executing it, we infer from the structure if possible.
    // OR we assume the LogicEvaluator has been configured to return the *Action Object* for 'set'.
    
    // For this MVP, let's look at the result. 
    // If the 'if' evaluated to the 'true' branch, and that branch was { "set": ... }
    // The evaluator would try to run "set".
    
    // CRITICAL: We need a custom 'set' operator in LogicEvaluator that returns 
    // a special signature instead of trying to mutate anything.
    // e.g. return { __action: "SET", target: args[0], value: args[1] }
    
    if (result && result.__action === "SET") {
       // Target Resolution
       // If target is {"ref": "required"}, it means update 'computed.required' for self
       // If target is {"ref": "value"}, it means update 'value' for self
       
       const target = result.target; 
       const val = result.value;

       logTest("Handling effect result for context:", contextId, "target:", target, "value:", val);

       if (target === "required" || target === "visited") {
          effects.push({ type: "SET_NODE_PROPERTY", id: contextId, property: target, value: val });
       } else if (target === "value") {
          effects.push({ type: "SET_VALUE", id: contextId, value: val });
       }
    }
  }

  // ==========================================================================
  // REACTIVITY LOOP (The Update Cycle)
  // ==========================================================================

  private recalculateDerivedState() {
    const state = this.store.getState();
    const nodes = state.nodes;
    const updates: Record<RuntimeID, BlockRuntimeState> = {};
    let hasUpdates = false;

    // 1. Build Context
    // We map every node's value and computed state so logic can access it.
    // e.g. {"var": "q1.value"} or {"var": "q1.computed.hidden"}
    const context: EvaluationContext = {
      globals: state.variables,
      nodes: {}, // Mapped below
    };

    // Optimize: Map values for the evaluator
    Object.values(nodes).forEach(n => {
      context.nodes[n.id] = { value: n.value, ...n.computed };
    });

    // 2. Iterate all nodes to check Logic
    Object.values(nodes).forEach(node => {
      const schemaBlock = this.schemaMap.get(node.schemaId);
      if (!schemaBlock) return;

      // --- DEBUGGING START ---
      // We are looking specifically for the Trigger
      if (node.id === "trigger_001") {
         logTest(`[DEBUG Trigger] ID: ${node.id}, ScopeID: ${node.scopeId}`);
         if (node.scopeId) {
            logTest(`[DEBUG Trigger] Parent Value:`, nodes[node.scopeId]?.value);
         }
      }
      // --- DEBUGGING END ---

      // RESOLVE THE LOCAL VALUE
      // If I have a Scope (Parent IU), use its value.
      // If not (I am the IU), use my own value.
      let contextValue = node.value;
      if (node.scopeId && nodes[node.scopeId]) {
        contextValue = nodes[node.scopeId].value;
      }

      // 1. Prepare Local Context (Inject 'value' for self-reference)
      // This fixes the issue where blocks refer to {"var": "value"}
      const localContext = { 
        ...context, 
        value: contextValue
      };

      // --- DEBUGGING START ---
      if (node.id === "trigger_001") {
         logTest(`[DEBUG Trigger] Local Context Value:`, localContext.value);
      }
      // --- DEBUGGING END ---

      let isHidden = node.computed.hidden;
      let isDisabled = node.computed.disabled;

      // 2. CHECK INTERACTION UNIT BEHAVIOR
      if (schemaBlock.type === "interaction_unit") {
        const iu = schemaBlock as InteractionUnit;
        if (iu.behavior) {
          if (iu.behavior.hidden) {
            isHidden = this.evaluator.evaluate(iu.behavior.hidden, localContext);
          }
          if (iu.behavior.disabled) {
            isDisabled = this.evaluator.evaluate(iu.behavior.disabled, localContext);
          }
        }
      }

      // 3. CHECK VISUAL BLOCK STATE LOGIC (Triggers, Toggles, etc)
      if ((schemaBlock as any).props?.state_logic) {
         const sl = (schemaBlock as MetaphorBlock).props.state_logic;
         if (sl) {
            if (sl.hidden) {
               isHidden = this.evaluator.evaluate(sl.hidden, localContext);
            }
            if (sl.disabled) {
              const result = this.evaluator.evaluate(sl.disabled, localContext);
              // --- DEBUGGING START ---
               if (node.id === "trigger_001") {
                  logTest(`[DEBUG Trigger] Evaluated Logic:`, JSON.stringify(sl.disabled));
                  logTest(`[DEBUG Trigger] Result:`, result);
               }
               // --- DEBUGGING END ---
              isDisabled = result;
            }
         }
      }

      if (isHidden !== node.computed.hidden || isDisabled !== node.computed.disabled) {
        updates[node.id] = {
          ...node,
          computed: { ...node.computed, hidden: isHidden, disabled: isDisabled }
        };
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      this.store.setState({
        ...state,
        nodes: { ...nodes, ...updates }
      });
    }
  }
  
  private validateNode(value: any, schemaId: string): { isValid: boolean, errors: string[] } {
    const block = this.schemaMap.get(schemaId);
    
    if (block?.type === "interaction_unit") {
      const iu = block as InteractionUnit;
      
      // 1. Domain Validation
      const isDomainValid = this.domainRegistry.validate(value, iu.domain_id);
      if (!isDomainValid) {
        return { isValid: false, errors: ["Invalid Format"] };
      }

      // 2. Context Validators (e.g., x > y)
      // Note: This requires the context, but for MVP validation we often check only the value.
      // If we need cross-field validation here, we would pass 'context' to this function.
      
      return { isValid: true, errors: [] };
    }
    return { isValid: true, errors: [] };
  }
}