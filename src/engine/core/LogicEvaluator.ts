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
  private createDataProxy(ctx: EvaluationContext): any {
    return {
      // We rely on json-logic's default "var" behavior accessing properties of this object.
      // However, since we want flexible lookups, we might need to pre-compute or use a getter.
      // json-logic-js is synchronous and simple. It expects a plain JS object.
      // We will flatten the context for the evaluator.
      
      ...ctx.globals,       // Expose globals directly: "quiz.timer"
      
      // For Nodes, we map them by ID.
      // The context.nodes is already Record<ID, State>.
      // Schema says: { "var": "q1.value" }
      // Runtime has: nodes["q1"].value
      // So we expose the nodes map directly.
      ...ctx.nodes 
    };
  }

  /**
   * Built-in helpers specific to QuizCentral but not domain-specific.
   */
  private initializeBaseOperators() {
    
    // Example: String Length
    this.registerOperator("len", (a: any) => {
      if (typeof a === "string" || Array.isArray(a)) return a.length;
      return 0;
    });

    // Example: Empty check
    this.registerOperator("is_empty", (a: any) => {
      if (a === null || a === undefined) return true;
      if (typeof a === "string" && a.trim() === "") return true;
      if (Array.isArray(a) && a.length === 0) return true;
      return false;
    });
  }
}