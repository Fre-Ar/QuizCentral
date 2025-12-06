import jsonLogic from "json-logic-js";
import { EvaluationContext } from "../types/runtime";
import { LogicExpression } from "../types/schema";

/**
 * The Brain of the Quiz Engine.
 * Wraps json-logic-js to execute schema-defined rules against runtime state.
 */
export class LogicEvaluator {
  private static instance: LogicEvaluator;

  // Registry of custom operators (e.g., 'beats', 'is_synonym_of')
  // These are often injected by the DomainRegistry.
  private customOperators: Map<string, Function>;

  private constructor() {
    this.customOperators = new Map();
    this.initializeBaseOperators();
    this.overrideEquality();
  }

  public static getInstance(): LogicEvaluator {
    if (!LogicEvaluator.instance) {
      LogicEvaluator.instance = new LogicEvaluator();
    }
    return LogicEvaluator.instance;
  }

  /**
   * Registers a new operator available to the logic engine.
   * @param name The operator key (e.g., "str_len")
   * @param func The implementation
   */
  public registerOperator(name: string, func: Function) {
    this.customOperators.set(name, func);
    jsonLogic.add_operation(name, func);
  }

  /**
   * Evaluates a LogicExpression against a specific Context.
   * * @param rule The JsonLogic rule from the schema
   * @param context The snapshot of data (Globals, Nodes, Locals)
   */
  public evaluate(rule: LogicExpression, context: EvaluationContext): any {
    if (!rule) return null;

    // 1. Prepare the Data Proxy
    // We create a proxy to intercept "var" calls.
    // This allows us to flatten the lookup logic:
    // "quiz.timer" -> context.globals.quiz.timer
    // "q1.value"   -> context.nodes['q1'].value
    const dataProxy = this.createDataProxy(context);

    try {
      return jsonLogic.apply(rule, dataProxy);
    } catch (error) {
      console.error(`Logic Evaluation Failed:`, { rule, error });
      return null;
    }
  }

  /**
   * Creates a helper object that maps variable paths to the correct context bucket.
   * This is critical because our Runtime State is normalized (flat), 
   * but the Schema refers to things hierarchically or via shortcuts.
   */
  private createDataProxy(context: EvaluationContext): any {
    const { globals, nodes, ...locals } = context;

    // Unflatten globals so "quiz.timer" becomes { quiz: { timer: val } }
    // This allows JsonLogic {"var": "quiz.timer"} to work.
    const nestedGlobals = this.unflatten(globals || {});
    const dataProxy = {
      ...nestedGlobals,
      ...(nodes || {}),
      ...locals
    };
    return dataProxy;
  }

  /**
   * Helper to convert flat dot-notation keys to nested objects.
   * { "quiz.timer": 10 } -> { quiz: { timer: 10 } }
   */
  private unflatten(data: Record<string, any>): Record<string, any> {
    const result: any = {};
    for (const key in data) {
      if (key.includes('.')) {
        const parts = key.split('.');
        let current = result;
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part]) current[part] = {};
          current = current[part];
        }
        current[parts[parts.length - 1]] = data[key];
      } else {
        result[key] = data[key];
      }
    }
    return result;
  }

  /**
   * Built-in helpers specific to QuizCentral but not domain-specific.
   */
  private initializeBaseOperators() {
    
    // String Length
    this.registerOperator("len", (a: any) => {
      if (typeof a === "string" || Array.isArray(a)) return a.length;
      return 0;
    });

    // Empty check
    this.registerOperator("is_empty", (a: any) => {
      if (a === null || a === undefined) return true;
      if (typeof a === "string" && a.trim() === "") return true;
      if (Array.isArray(a) && a.length === 0) return true;
      return false;
    });

    // Convert to integer
    this.registerOperator("int", (a: any) => {
      if (a === null || a === undefined) return 0;

      if (typeof a === "number") {
        // Ensure integer (e.g., 3.7 -> 3)
        return Math.trunc(a);
      }

      if (typeof a === "boolean") {
        return a ? 1 : 0;
      }

      if (typeof a === "string") {
        const parsed = parseInt(a, 10);
        return isNaN(parsed) ? 0 : parsed;
      }

      // Fallback to null if impossible
      return null;
    });

    // REFERENCE OPERATOR
    // Usage: { "ref": "q1.value" }
    // Returns: { __type: "pointer", path: "q1.value" }
    this.registerOperator("ref", (path: any) => {
      return { __type: "pointer", path: path };
    });

    // SET OPERATOR (Side Effect)
    // Usage: { "set": [ { "ref": "q1.value" }, true ] }
    this.registerOperator("set", (target: any, value: any) => {
      
      // Validation: Ensure we are setting a Reference, not a random value
      if (target && typeof target === "object" && target.__type === "pointer") {
        return { 
          __action: "SET", 
          target: target.path, // Unwrap the path string here
          value: value 
        };
      }

      console.warn("Invalid 'set' operation: Target must be a {ref: 'path'}", target);
      return null;
    });

    // COMPOUNDING OPERATORS (+=, -=)
    // Usage: { "+=": [ { "ref": "score" }, 10 ] }
    const registerCompoundOp = (op: string, instruction: string) => {
      this.registerOperator(op, (target: any, amount: any) => {
        if (target && typeof target === "object" && target.__type === "pointer") {
          return { 
            __action: "COMPOUND", 
            operator: instruction, // "+", "-"
            target: target.path, 
            amount: amount 
          };
        }
        return null;
      });
    };

    registerCompoundOp("+=", "+");
    registerCompoundOp("-=", "-");
    registerCompoundOp("*=", "*");
    registerCompoundOp("/=", "/");
    registerCompoundOp("%=", "%");
    registerCompoundOp("append", "cat");
  }

  /**
   * Overrides the default "==" operator to support Value Equality for Arrays.
   * Standard JS "==" checks references for arrays ([1] == [1] is false).
   * We want [1] == [1] to be true.
   */
  private overrideEquality() {
    // We register a custom function for "==".
    // JsonLogic checks its internal operation registry before using built-ins.
    jsonLogic.add_operation("==", (a: any, b: any) => {
      // 1. Array Value Check
      if (Array.isArray(a) && Array.isArray(b)) {
        return this.deepEqual(a, b);
      }
      
      // 2. Standard Loose Equality for everything else
      // This preserves 1 == "1" behavior if you rely on it.
      return a == b; 
    });
  }

  /**
   * Recursive Deep Equality Check.
   * Optimized for Arrays and Primitives.
   */
  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true; // Identical references or primitives

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    // TODO: Add Object support here if your schema compares objects.
    // For MVP/Arrays, we stop here to save perf.
    return false;
  }
}