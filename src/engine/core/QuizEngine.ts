import { StateStore } from "./StateStore";
import { LogicEvaluator } from "./LogicEvaluator";
import { DomainRegistry } from "../domains/DomainRegistry";
import { 
  QuizSchema, PageNode, InteractionUnit, VisualBlock, ContainerBlock
} from "../types/schema";
import { 
  QuizSessionState, BlockRuntimeState, RuntimeID, EngineAction, EvaluationContext 
} from "../types/runtime";

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

  /**
   * The Entry Point for all User Interactions.
   */
  public dispatch(action: EngineAction) {
    const currentState = this.store.getState();
    let nextState = { ...currentState }; // Shallow copy root
    let hasChanges = false;

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
        break;
      }

      case "SET_VISITED": {
        const node = nextState.nodes[action.id];
        if (node && !node.visited) {
          nextState.nodes = {
            ...nextState.nodes,
            [action.id]: { ...node, visited: true }
          };
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

    const processBlock = (block: InteractionUnit | VisualBlock): RuntimeID => {
      // Use existing ID or generate stable internal ID
      const id = block.id || `gen_${Math.random().toString(36).substr(2, 9)}`;
      
      const baseState: BlockRuntimeState = {
        id: id,
        schemaId: block.id || id,
        value: null,
        visited: false,
        touched: false,
        validation: { isValid: true, errors: [] },
        computed: { hidden: false, disabled: false, required: false },
      };

      // 1. Interaction Units: Initialize Logic State
      if (block.type === "interaction_unit") {
        const iu = block as InteractionUnit;
        baseState.value = iu.state.value; 
        baseState.computed.required = iu.state.required || false;
        
        // Recurse into the View (it might be a container)
        processBlock(iu.view); 
      }

      // 2. Containers: Recurse Children
      if (block.type === "container") {
        const container = block as ContainerBlock;
        const childIds = container.props.children.map(child => processBlock(child));
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
      const originalSchema = this.schemaMap.get(node.schemaId);
      
      if (originalSchema && originalSchema.type === "interaction_unit") {
        const iu = originalSchema as InteractionUnit;
        
        if (iu.behavior) {
          const isHidden = iu.behavior.hidden 
            ? this.evaluator.evaluate(iu.behavior.hidden, context) 
            : false;
            
          const isDisabled = iu.behavior.disabled 
            ? this.evaluator.evaluate(iu.behavior.disabled, context) 
            : false;

          if (isHidden !== node.computed.hidden || isDisabled !== node.computed.disabled) {
            updates[node.id] = {
              ...node,
              computed: { ...node.computed, hidden: isHidden, disabled: isDisabled }
            };
            hasUpdates = true;
          }
        }
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