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

  // quiz.timer interval 
  private timerInterval: NodeJS.Timeout | null = null;
  // Listeners" Maps a trigger key (e.g. "quiz.timer", "q1.value") to the List of Blocks listening to it.
  private listenerIndex: Map<string, string[]> = new Map();

  constructor(schema: QuizSchema) {
    this.schema = schema;
    this.evaluator = LogicEvaluator.getInstance();
    this.domainRegistry = DomainRegistry.getInstance();
  

    // 1. Normalize (Generate IDs for everything FIRST)
    this.normalizeIds(this.schema);

    // 2. Build the Listener Index (Performance Guardrail)
    this.indexListeners(this.schema);

    // 3. Index Schema (Builds the schemaMap)
    this.indexSchema(schema);

    // 4. Hydrate Initial State
    const initialState = this.hydrateState(schema);
    // Initialize Timer Variable
    if (schema.config.time_limit_seconds) {
      initialState.variables["quiz.timer"] = schema.config.time_limit_seconds;
    }
    this.store = new StateStore(initialState);
    
    // 5. Initial Computation (Resolve initial visibility/logic)
    this.recalculateDerivedState();
  }

  // Explicit Lifecycle Methods
  public mount() {
    if (this.schema.config.time_limit_seconds && !this.timerInterval) {
      console.log("[QuizEngine] Mounting: Timer Started");
      this.startTimer();
    }
  }

  // Cleanup
  public unmount() {
    console.log("[QuizEngine] Unmounting: Timer Stopped");
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public getStore(): StateStore {
    return this.store;
  }

  public getSchema(): QuizSchema {
    return this.schema;
  }

  public getSchemaBlock(id: string): InteractionUnit | VisualBlock | undefined {
    return this.schemaMap.get(id);
  }

  private buildNodeContextMap(nodes: Record<string, BlockRuntimeState>): EvaluationContext['nodes'] {
    const nodeContext: EvaluationContext['nodes'] = {};
    Object.values(nodes).forEach(n => {
        // Maps 'id' to the object containing 'value' and the 'computed' properties.
        nodeContext[n.id] = { 
            value: n.value, 
            ...n.computed 
        };
    });
    return nodeContext;
  }

  /**
   * The Entry Point for all User Interactions.
   */
  public dispatch(action: EngineAction, options?: { skipRecalc?: boolean }) {
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

      case "SET_VARIABLE": {
        nextState.variables = { 
          ...nextState.variables, 
          [action.name]: action.value 
        };
        hasChanges = true;
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

      // ONLY recalculate if not skipped
      if (!options?.skipRecalc) {
         // Trigger the cascade: Logic might change visibility based on new values
        this.recalculateDerivedState();
      }
    }
  }

  // ==========================================================================
  // INITIALIZATION (Hydration & Indexing)
  // ==========================================================================

  private normalizeIds(schema: QuizSchema) {
    const visit = (block: InteractionUnit | VisualBlock) => {
      // Generate ID if missing
      if (!block.id) {
        block.id = `gen_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Recurse
      if (block.type === "interaction_unit") {
        visit((block as InteractionUnit).view);
      } else if (block.type === "container") {
        (block as ContainerBlock).props.children.forEach(visit);
      }
    };

    schema.pages.forEach(p => p.blocks.forEach(visit));
  }

  private indexListeners(schema: QuizSchema) {
    const visit = (block: InteractionUnit | VisualBlock) => {
      if (block.type === "interaction_unit") {
        const iu = block as InteractionUnit;
        if (iu.behavior?.listeners) {
          // Map every trigger key to this block ID
          Object.keys(iu.behavior.listeners).forEach(triggerKey => {
            const list = this.listenerIndex.get(triggerKey) || [];
            list.push(iu.id);
            this.listenerIndex.set(triggerKey, list);
          });
        }
        visit(iu.view);
      } else if (block.type === "container") {
        (block as ContainerBlock).props.children.forEach(visit);
      }
    };
    schema.pages.forEach(p => p.blocks.forEach(visit));
  }

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

    // 1. Initialize Globals from Schema
    const variables: Record<string, any> = {};

    if (schema.state) {
      Object.entries(schema.state).forEach(([key, definition]) => {
        // Namespace them under "quiz." so {"var": "quiz.score"} works
        variables[`quiz.${key}`] = definition.default;
      });
    }

    const processBlock = (block: InteractionUnit | VisualBlock, currentScopeId?: string): RuntimeID => {
      // Use existing ID (guaranteed by normalizeIds)
      const id = block.id!;
      
      // register id in the schema map 
      // this ensures that even auto-generated blocks can be looked up by ID.
      if (!this.schemaMap.has(id)) {
        this.schemaMap.set(id, block);
      }

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

        // Recursively process children to get their IDs
        let childIds = container.props.children.map(child => processBlock(child, currentScopeId));
        
        // Behavior: Shuffle
        if (container.props.behavior?.shuffle_children) {
          childIds = shuffleArray(childIds);
        }

        // Behavior: Pick N (Subset)
        if (typeof container.props.behavior?.pick_n === 'number') {
          childIds = childIds.slice(0, container.props.behavior.pick_n);
        }
        
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
      variables: variables,
      nodes: nodes
    };
  }

  // ==========================================================================
  // LISTENER PROCESSING 
  // ==========================================================================

  private processListeners(triggerKey: string, newValue: any): void {
    const state = this.store.getState();

    // 1. OPTIMIZATION CHECK
    // If no blocks care about this trigger, exit immediately.
    const listeningBlockIds = this.listenerIndex.get(triggerKey);
    if (!listeningBlockIds || listeningBlockIds.length === 0) {
      return;
    }

    logTest("The following blocks care about", triggerKey, ":", ...listeningBlockIds)
    
    // 2. TARGETED ITERATION
    // Only iterate the specific blocks that are listening
    listeningBlockIds.forEach(id => {
      const block = this.schemaMap.get(id) as InteractionUnit; // We know it's an IU from indexing
      if (!block) return;

      const logicChain = block.behavior?.listeners?.[triggerKey];
      if (!logicChain) return;

      // RE-READ STATE inside the loop: We get the latest state (possibly modified by previous listener).
      const currentState = this.store.getState();
      
      // Build Context for evaluation
      const context: EvaluationContext = {
        globals: currentState.variables,
        nodes: {},
        ...{ [triggerKey]: newValue }, // Inject the change that just happened
        // Inject Self Value
        value: currentState.nodes[id]?.value ?? null
      };
      
      // Map nodes (Optimization: You could incrementally update this, but re-mapping is safer)
      context.nodes = this.buildNodeContextMap(currentState.nodes);

      const node = state.nodes[id];
      // resolve the local value
      let contextValue = node.value;
      if (node.scopeId && state.nodes[node.scopeId]) {
        contextValue = state.nodes[node.scopeId].value;
      }

      // Prepare Local Context (Inject 'value' for self-reference)
      const localContext = { 
        ...context, 
        value: contextValue
      };

      logTest(id, "goes ahead with logic eval under the context", localContext)

      const veridict = this.evaluator.evaluate(
        {var: 'value'}
      , localContext);
      logTest('[Veridict Value]:', veridict);

      const rawResult = this.evaluator.evaluate(logicChain as any, localContext);
      const results = Array.isArray(rawResult) ? rawResult : [rawResult];

      logTest("Listener evaluation results for block", id, ":", results);

      results.forEach(result => {
        if (result && typeof result === "object") {
          // We create a temporary array to capture the effect from the helper
           const effects: EngineAction[] = [];
           this.handleEffectResult(result, id, effects);
           
           // EXECUTE IMMEDIATELY (Atomic Update)
           // We skip recalc to avoid O(N^2) performance hit
           effects.forEach(effect => this.dispatch(effect, { skipRecalc: true }));
        }
      });
    });
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
       
      const { target, value } = result;

      logTest("Handling effect result for context:", contextId, "target:", target, "value:", value);

      // A. Global Variable Update (e.g. "quiz.score")
      if (target.startsWith("quiz.")) {
        effects.push({ type: "SET_VARIABLE", name: target, value: value });
        return;
      }

      // B. Node Resolution
      let targetNodeId = contextId;
      let targetProp = "value"; // Default property

      if (target === "value") {
        targetNodeId = contextId;
      } 
      else if (target === "required" || target === "visited") {
        targetNodeId = contextId;
        targetProp = target;
      }
      else if (target.includes(".")) {
        // "q2.value" or "q2.required"
        const parts = target.split(".");
        targetProp = parts.pop()!; // "value" or "required"
        targetNodeId = parts.join("."); // "q2"
      }

      // C. Dispatch Appropriate Action
      if (targetProp === "value") {
        effects.push({ type: "SET_VALUE", id: targetNodeId, value: value });
      } else {
        effects.push({ type: "SET_NODE_PROPERTY", id: targetNodeId, property: targetProp, value: value });
      }
    }

    // Handle Compounding Operators (+=, -=)
    if (result && result.__action === "COMPOUND") {
      const { target, operator, amount } = result;
      
      // 1. Resolve Current Value
      // We use the evaluator's existing variable lookup logic via {"var": target}
      // We need to reconstruct the context for this lookup.
      const state = this.store.getState();
      
      // Build a temporary context just for this lookup
      const context: EvaluationContext = {
        globals: state.variables,
        nodes: {}
      };

      context.nodes = this.buildNodeContextMap(state.nodes);
      
      // Special handling: if target is "value", we need the local node's value
      let baseValue;
      if (target === "value") {
         baseValue = state.nodes[contextId]?.value;
      } else {
         // Use JsonLogic to look it up: {"var": "q1.value"} or {"var": "quiz.score"}
         baseValue = this.evaluator.evaluate({ "var": target }, context);
      }

      // 2. Delegate Math
      // We construct a synthetic JsonLogic rule on the fly.
      // e.g. If operator is "+", we create rule: { "+": [ baseValue, amount ] }
      const operationRule = {
        [operator]: [ baseValue, amount ]
      };

      // Evaluate the math. 
      // We pass empty context because we have already resolved the values into literals.
      const newValue = this.evaluator.evaluate(operationRule, context);

      // 3. Dispatch the Update (Reuse SET logic)
      // We recursively call handleEffectResult with a synthetic SET action
      // so we don't duplicate the target parsing logic (properties vs values vs globals).
      
      this.handleEffectResult({ 
        __action: "SET", 
        target: target, 
        value: newValue 
      }, contextId, effects);
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
    context.nodes = this.buildNodeContextMap(nodes);

    // 2. Iterate all nodes to check Logic
    Object.values(nodes).forEach(node => {
      const schemaBlock = this.schemaMap.get(node.schemaId);
      if (!schemaBlock) return;

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
              isDisabled = this.evaluator.evaluate(sl.disabled, localContext);
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

  /**
   * Public entry point for UI components to trigger Logic Actions.
   * Handles "set", "navigate", "+=", "-=", etc. uniformly.
   */
  public executeLogicAction(logic: any, contextId: string) {
    // 1. Build Context
    const state = this.store.getState();
    const context: EvaluationContext = {
      globals: state.variables,
      nodes: {},
      // Inject "value" if the contextId refers to a node with a value
      value: state.nodes[contextId]?.value 
    };
    context.nodes = this.buildNodeContextMap(state.nodes);

    // 2. Evaluate
    // This runs the LogicEvaluator. 
    // Because we registered "set", "+=", etc. as operations that return Action Descriptors,
    // this will return objects like { __action: "SET", ... } or { __action: "MODIFY", ... }
    const result = this.evaluator.evaluate(logic, context);
    logTest("[EVAL RESULT]:", result);

    // 3. Normalize & Process
    const actions = Array.isArray(result) ? result : [result];
    const effects: EngineAction[] = [];

    actions.forEach(actionResult => {
      // Special Case: Navigation is often a direct schema keyword, not a JsonLogic op.
      // e.g. { "navigate": "p2" } -> The evaluator might just return the object if it doesn't recognize the op.
      // But ideally, we should wrap navigation in a custom op too.
      // For now, we check the raw object structure if Evaluator didn't handle it.
      
      if (actionResult && typeof actionResult === 'object') {
        // CASE A: Standard Engine Actions (SET, MODIFY) returned by Evaluator
        if (actionResult.__action) {
           this.handleEffectResult(actionResult, contextId, effects);
        } 
        // CASE B: Navigation (Legacy Schema)
        else if ("navigate" in logic) { // Check raw logic for this specific case
           effects.push({ type: "NAVIGATE", targetId: logic.navigate });
        }
      }
    });

    // 4. Dispatch All Resulting Effects
    effects.forEach(effect => this.dispatch(effect));
  }

  // ==========================================================================
  // TIMER LOGIC
  // ==========================================================================

  private startTimer() {
    this.timerInterval = setInterval(() => {
      this.handleTick();
    }, 1000);
  }

  private handleTick() {
    const state = this.store.getState();
    const currentBuffer = state.variables["quiz.timer"];

    // Safety check
    if (typeof currentBuffer !== "number") return;

    if (currentBuffer <= 0) {
      // Timer finished. Ensure we clamp to 0 and stop ticking.
      if (this.timerInterval) clearInterval(this.timerInterval);
      return;
    }

    const newValue = currentBuffer - 1;

    // 1. Update the Store (Low Cost)
    // We update variables directly.
    // React components subscribed specifically to 'quiz.timer' will re-render.
    // Others will not (if using proper selectors).
    const nextState = {
      ...state,
      variables: { ...state.variables, "quiz.timer": newValue }
    };
    
    // We commit this update immediately so the UI clock ticks smoothly
    this.store.setState(nextState);

    // 2. Process Listeners 
    logTest("new Quiz Time:", newValue)
    this.processListeners("quiz.timer", newValue);

    // 3. Final Recalculation (Run ONCE after all listeners are done)
    this.recalculateDerivedState();
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}