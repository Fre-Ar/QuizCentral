import { DomainDefinition, DomainID, DomainTransform } from "../types/schema";
import { LogicEvaluator } from "../core/LogicEvaluator";
import { EvaluationContext } from "../types/runtime";
import { deepEqual } from "@/lib/utils";

// Primitive domains
const string_domain = "$$STRING";
const int_domain = "$$INT";
const bool_domain = "$$BOOL";
const float_domain = "$$FLOAT";
const array_domain = "$$ARRAY";
const any_domain = "$$ANY";


/**
 * Manages Domain Theory.
 * Handles storage of definitions.
 * Implements "Reverse Validation" to check if a value belongs to a generative pipeline
 * without generating the full set.
 */
export class DomainRegistry {
  private static instance: DomainRegistry;
  
  private definitions: Map<DomainID, DomainDefinition> = new Map();
  private cache: Map<DomainID, any[]> = new Map(); // Memoized generated sets

  // Reserved IDs for infinite primitives
  private static PRIMITIVES = new Set([string_domain, int_domain, bool_domain, float_domain, array_domain, any_domain]);

  private constructor() {}

  public static getInstance(): DomainRegistry {
    if (!DomainRegistry.instance) {
      DomainRegistry.instance = new DomainRegistry();
    }
    return DomainRegistry.instance;
  }

  /**
   * Load schema definitions into the registry.
   */
  public register(defs: DomainDefinition[]) {
    defs.forEach(d => this.definitions.set(d.id, d));
  }

  /**
   * Main Entry Point: Validates if a value belongs to a Domain.
   */
  public validate(value: any, domainId: DomainID): boolean {
    // 1. Handle Primitives (Base Axioms)
    if (domainId === any_domain) return true;
    if (domainId === int_domain) return Number.isInteger(value);
    if (domainId === float_domain) return typeof value === "number" && !Number.isNaN(value);
    if (domainId === string_domain) return typeof value === "string";
    if (domainId === bool_domain) return typeof value === "boolean";
    if (domainId === array_domain) return Array.isArray(value);

    // TODO: REMOVE THIS HOTFIX (allowed domainIds to be arrays when that's a bad way to handle this)
    if (Array.isArray(domainId)) {
      // Array Domain: value must be in the array
      // Simple set membership check
      // Note: If domain elements are arrays (like [1]), we need deep equality check
      // for inclusions.
      return domainId.some(item => deepEqual(item, value));
      
    }

    const def = this.definitions.get(domainId);
    if (!def) {
      console.warn(`Validation failed: Unknown Domain ${domainId}`);
      return false;
    }

    // 2. Validate Construct (Composite Types)
    if (def.definition.construct) {
      return this.validateConstruct(value, def.definition.construct);
    }

    // 3. Validate Pipeline (Reverse Engineer)
    // If source is explicit array, we treat it as a "Union of literals" at the bottom of the stack.
    return this.validateReversePipeline(
      value, 
      def.definition.transforms || [], 
      def.definition.source
    );
  }

  /**
   * Walks backwards through the pipeline.
   * Concept: We have a candidate value 'y'. 
   * We want to know if it could have come from 'source'
   * after applying the transforms in reverse.
   */
  private validateReversePipeline(
    currentValue: any, 
    transforms: DomainTransform[], 
    source: any[] | DomainID
  ): boolean {
    
    // We iterate backwards (End -> Start)
    for (let i = transforms.length - 1; i >= 0; i--) {
      const t = transforms[i];

      // A. FILTER
      // Logic: If the value exists here, it MUST satisfy the filter condition.
      // If it doesn't satisfy the filter, it couldn't have passed through.
      if ('filter' in t) {
        const satisfiesFilter = LogicEvaluator.getInstance().evaluate(
          t.filter.expr, 
          { globals: { x: currentValue }, nodes: {} }
        );
        if (!satisfiesFilter) return false;
      }

      // B. MAP
      // Logic: Invert the operation. y = f(x) -> x = f_inverse(y)
      // We check if a valid pre-image exists.
      else if ('map' in t) {
        const preImage = this.invertMap(currentValue, t.map.expr);
        if (preImage === undefined) return false; // Inversion impossible (e.g. invalid type cast)
        currentValue = preImage; // Step back
      }

      // C. UNION
      // Logic: The value could come from the Main Pipeline OR the Unioned Domain.
      // If it validates against the Union Domain, we are done (Success).
      // If not, we continue up the Main Pipeline.
      else if ('union' in t) {
        if (this.validate(currentValue, t.union.with)) {
          return true; // Short-circuit: It belongs to the other branch
        }
        // If false, it MUST belong to the main branch, so we continue loop.
      }

      // D. COMBINE
      // Logic: Deconstruct the value. z = Combine(x, y).
      // We need to split z into x and y, then validate x (Main Pipeline) and y (Combined Domain).
      else if ('combine' in t) {
        const parts = this.deconstructCombine(currentValue, t.combine.expr);
        if (!parts) return false; // Could not split
        
        // parts.y must belong to the secondary domain
        if (!this.validate(parts.y, t.combine.with)) return false;

        // parts.x becomes the new currentValue to continue up the main pipeline
        currentValue = parts.x; 
      }
    }

    // 4. Base Case: Source Check
    // We have reached the top of the pipeline.
    if (Array.isArray(source)) {
      // Explicit Set
      return source.includes(currentValue);
    } else {
      // Recursive Domain Reference
      return this.validate(currentValue, source);
    }
  }

  /**
   * INVERTER LOGIC
   * Attempts to reverse a JsonLogic expression.
   * Returns undefined if mathematically/logically impossible.
   */
  private invertMap(val: any, expr: any): any {
    // Simple Case: Expression is a direct variable (Identity)
    if (expr === "x" || (typeof expr === "object" && expr.var === "x")) return val;

    // We assume standard JsonLogic object structure: { "op": [arg1, arg2] }
    const op = Object.keys(expr)[0];
    const args = expr[op];
    
    // We assume the expression structure is [ {var: "x"}, CONSTANT ] or vice versa
    // We need to find which arg is the variable.
    const xIndex = this.findVarIndex(args);
    if (xIndex === -1) return undefined; // 'x' not found in expression
    
    const constant = args[1 - xIndex]; // The other argument

    // DEBUG: IF THERE'S A BUG WITH VALIDATION, IT IS 99% COMING FROM THIS MESS.
    try {
      switch (op) {
        case "+": return val - constant; // Inverse of Add is Sub
        case "-": 
          // if x - 5 = val -> x = val + 5
          // if 5 - x = val -> x = 5 - val
          return xIndex === 0 ? val + constant : constant - val;
        case "*": return val / constant; // Inverse of Mult is Div
        case "/": 
          // if x / 5 = val -> x = val * 5
          // if 5 / x = val -> x = 5 / val
          return xIndex === 0 ? val * constant : constant / val;
        case "str": 
          // Inverse of Stringify is Parse. 
          // We must check if val is actually a string representation of the target type?
          // This is ambiguous. We assume int/float parsing.
          if (typeof val !== 'string') return undefined;
          const num = Number(val);
          return isNaN(num) ? undefined : num;
        case "int":
          // Inverse of Int is... uncertain (loss of precision).
          // We assume strict inverse: valid only if val is an int.
          return val.toString(); 
        default:
          console.warn(`Cannot invert operator: ${op}`);
          return undefined;
      }
    } catch (e) {
      return undefined;
    }
  }

  /**
   * DECONSTRUCTOR LOGIC
   * Splits a combined value back into components.
   */
  private deconstructCombine(val: any, expr: any): { x: any, y: any } | null {
    const op = Object.keys(expr)[0];
    
    // Case 1: String Concatenation "X of Y"
    // We need the separator.
    if (op === "cat") {
      // Assuming expr is [ {var: x}, " separator ", {var: y} ]
      const args = expr[op];
      const separator = args[1]; 
      
      if (typeof val !== 'string' || typeof separator !== 'string') return null;
      if (!val.includes(separator)) return null;

      const [partX, partY] = val.split(separator); // Naive split, careful if X contains separator
      return { x: partX, y: partY };
    }

    // Case 2: Tuple/Array Construction
    // Assuming expr creates [x, y]
    if (Array.isArray(val) && val.length === 2) {
      return { x: val[0], y: val[1] };
    }

    return null;
  }

  /**
   * Validates structure constraints (Shape & Size).
   * Supports Arrays, Tuples, and Records via "Named Slots" and "Default" logic.
   */
  private validateConstruct(value: any, construct: NonNullable<DomainDefinition['definition']['construct']>): boolean {
    // Arrays in JS are Objects with keys "0", "1", etc.
    // This allows uniform validation for Tuples and Records.
    if (typeof value !== 'object' || value === null) return false;

    const keys = Object.keys(value);

    // 1. Size Check
    const min = construct.size?.min ?? 0;
    const max = construct.size?.max ?? Infinity;
    
    if (keys.length < min || keys.length > max) return false;

    // 2. Shape Validation
    if (construct.shape) {
      const shape = construct.shape;
      const defaultDef = shape["default"]; // The fallback domain

      for (const key of keys) {
        let targetDomainId: DomainID | undefined;

        // A. Is this key explicitly defined? (Named Slot or Specific Index)
        if (Object.prototype.hasOwnProperty.call(shape, key) && key !== "default") {
          targetDomainId = shape[key].dom;
        } 
        // B. If not, does a default exist? (Variable Slot)
        else if (defaultDef) {
          targetDomainId = defaultDef.dom;
        }

        // C. If neither, the key is strictly forbidden.
        if (!targetDomainId) {
          return false; 
        }

        // D. Recursive Validation
        if (!this.validate(value[key], targetDomainId)) {
          return false;
        }
      }
    } else {
      // If no shape is defined, but size > 0, it's a "Any Object" scenario?
      // Strict interpretation: No shape = No allowed keys (Empty Object only).
      if (keys.length > 0) return false;
    }
    
    return true;
  }

  private findVarIndex(args: any[]): number {
    return args.findIndex(a => a === "x" || (typeof a === "object" && a.var === "x"));
  }

  /**
   * Generates the set of all valid values for a domain.
   * * Uses Forward Pipeline execution (Source -> Transform -> Result).
   * * Throws if the domain is infinite (Abstract).
   */
  public generate(domainId: DomainID): any[] {
    // 1. Check Cache
    if (this.cache.has(domainId)) {
      return this.cache.get(domainId)!;
    }

    // 2. Load Definition
    const def = this.definitions.get(domainId);
    if (!def) {
      if (DomainRegistry.PRIMITIVES.has(domainId as string)) {
        throw new Error(`Cannot generate infinite primitive domain: ${domainId}`);
      }
      throw new Error(`Domain not found: ${domainId}`);
    }

    // 3. Resolve Source
    let data: any[] = [];
    
    // A. Explicit Source (Array literal)
    if (Array.isArray(def.definition.source)) {
      data = [...def.definition.source];
    } 
    // B. Recursive Source (Reference to another Domain)
    else if (typeof def.definition.source === "string") {
      data = this.generate(def.definition.source);
    }

    // 4. Apply Forward Pipeline
    if (def.definition.transforms) {
      data = this.processPipeline(data, def.definition.transforms);
    }

    // 5. Cache and Return
    this.cache.set(domainId, data);
    return data;
  }

  // ==========================================================================
  // FORWARD PIPELINE LOGIC
  // ==========================================================================

  private processPipeline(data: any[], transforms: DomainTransform[]): any[] {
    let current = [...data]; // Clone to avoid mutating cached sources
    const evaluator = LogicEvaluator.getInstance();

    for (const t of transforms) {
      
      // A. FILTER: Keep items where expression is true
      if ('filter' in t) {
        current = current.filter(item => {
          // We inject 'x' (the current item) as a temporary global variable
          // so the evaluator can resolve {"var": "x"}
          return evaluator.evaluate(t.filter.expr, this.createLoopContext(item));
        });
      }
      
      // B. MAP: Transform items
      else if ('map' in t) {
        current = current.map(item => {
          evaluator.evaluate(t.map.expr, this.createLoopContext(item));
        });
      }

      // C. UNION: Add items from another domain
      else if ('union' in t) {
        const otherSet = this.generate(t.union.with);
        // We do not deduplicate automatically unless the domain definition specifically adds a unique filter,
        // but standard set theory usually implies unique elements. 
        // For performance, we just concat here.
        current = current.concat(otherSet);
      }

      // D. COMBINE: Cartesian Product (Nested Loop)
      else if ('combine' in t) {
        const otherSet = this.generate(t.combine.with);
        const combined: any[] = [];
        
        // Iterate every pair (x, y)
        for (const itemX of current) {
          for (const itemY of otherSet) {
            // Evaluates the combination expression (e.g., concatenation)
            // Context: x = item from stream, y = item from combined domain
            const result = evaluator.evaluate(t.combine.expr, {
              globals: { x: itemX, y: itemY },
              nodes: {}
            });
            combined.push(result);
          }
        }
        current = combined;
      }
    }
    
    return current;
  }


  private createLoopContext(item: any): EvaluationContext {
    return {
      // We inject 'x' (the current item) as a temporary global variable
      // so the evaluator can resolve {"var": "x"}
      globals: {x : item}, 
      nodes: {}, // Domains are pure; they don't see Quiz State
    };
  }

}