import { QuizSchema, PageNode, InteractionUnit, VisualBlock, TemplateDefinition, TemplateInstance } from "../types/schema";


export class TemplateCompiler {
  private templates: Map<string, TemplateDefinition>;

  constructor(templates: TemplateDefinition[]) {
    this.templates = new Map(templates.map(t => [t.id, t]));
  }

  /**
   * Main Entry Point
   */
  public compile(schema: any): QuizSchema {
    // Deep clone to avoid mutating original schema
    const root = JSON.parse(JSON.stringify(schema));

    return {
      ...root,
      pages: root.pages.map((page: PageNode) => ({
        ...page,
        blocks: this.compileBlockList(page.blocks)
      }))
    };
  }

  private compileBlockList(blocks: any[]): any[] {
    return blocks.flatMap(block => {

      // 1. Handle Template Instances (The "Expansion" step)
      // This must happen first because it might return multiple blocks.
      if (block.type === "template_instance") {
        return this.expandTemplate(block as TemplateInstance);
      }

      // 2. Recurse Children (The "Walk" step)
      // Handles Containers or any future block that holds an array of blocks.
      if (block.props?.children && Array.isArray(block.props.children)) {
        // If 'children' is a "$$map" object here, we technically can't process it 
        // because we lack the parameter context. 
        // (Macros like $$map are strictly handled inside expandTemplate -> expandDirectives).
        block.props.children = this.compileBlockList(block.props.children);
      }

      // 3. Recurse Views (Interaction Units)
      // Interaction Units hold a single 'view' block, not an array of children.
      if (block.type === "interaction_unit" && block.view) {
        // compileBlockList expects an array, so we Wrap to reuse logic -> Compile -> Unwrap
        const compiledView = this.compileBlockList([block.view]);
        block.view = compiledView[0];
      }

      // 4. Return the (potentially modified) block
      return [block];
    });
  }

  /**
   * The Core Logic: Merging Instance with Template and Expanding Macros
   */
  private expandTemplate(instance: TemplateInstance): any {
    const template = this.templates.get(instance.template_id);
    if (!template) {
      throw new Error(`Template not found: ${instance.template_id}`);
    }

    // 1. Prepare Context (Merge Defaults + Instance Params)
    // TODO: Add type validation against template.parameters definition here
    const context = { 
      param: instance.parameters // Namespace params under "param" to match {"param": "x"} syntax
    };

    // 2. Expand Directives ($$map, $$switch, {"param": ...})
    // We expand the structure *before* applying overrides to ensure the structure is concrete.
    const expandedStructure = this.expandDirectives(
      JSON.parse(JSON.stringify(template.structure)), 
      context
    );

    // 3. Apply Overrides (Instance Properties overwrite Template)
    
    // A. ID
    expandedStructure.id = instance.id;

    // B. State (Shallow Merge)
    if (instance.state) {
      expandedStructure.state = {
        ...(expandedStructure.state || {}),
        ...instance.state
      };
    }

    // C. Behavior (Deep Merge)
    if (instance.behavior) {
      const baseBehav = expandedStructure.behavior || {};
      const overBehav = instance.behavior;

      expandedStructure.behavior = {
        ...baseBehav,
        // Overwrite simple keys
        ...(overBehav.hidden ? { hidden: overBehav.hidden } : {}),
        ...(overBehav.disabled ? { disabled: overBehav.disabled } : {}),
        
        // Merge Listeners
        listeners: {
          ...(baseBehav.listeners || {}),
          ...(overBehav.listeners || {})
        },
        
        // Concatenate Validators
        context_validators: [
          ...(baseBehav.context_validators || []),
          ...(overBehav.context_validators || [])
        ]
      };
    }

    // D. Recurse!
    // The expanded structure might contain *nested* template instances or containers with children.
    // We must pass the result back through compileBlockList.
    // Since compileBlockList expects an array, and this returns one block, we wrap/unwrap.
    if (expandedStructure.view) {
       expandedStructure.view = this.compileBlockList([expandedStructure.view])[0];
    }

    return expandedStructure;
  }

  // ==========================================================================
  // MACRO EXPANSION ENGINE
  // ==========================================================================

  private expandDirectives(node: any, context: any): any {
    // 1. Handle Primitive Replacement: { "param": "key" } or { "var": "opt.x" }
    // Note: { "var": ... } is usually runtime logic, BUT in your schema, 
    // you use it inside $$map templates to access build-time loop variables.
    if (this.isReplacementNode(node)) {
      return this.resolveReplacement(node, context);
    }

    // 2. Handle Arrays (Recurse)
    if (Array.isArray(node)) {
      return node.map(item => this.expandDirectives(item, context));
    }

    // 3. Handle Objects (Directives or Recurse)
    if (typeof node === "object" && node !== null) {
      
      // A. $$map
      if ("$$map" in node) {
        return this.processMap(node["$$map"], context);
      }

      // B. $$switch
      if ("$$switch" in node) {
        return this.processSwitch(node["$$switch"], context);
      }

      // C. Standard Object Recursion
      const newNode: any = {};
      for (const key in node) {
        // Special Case: "children" might be a $$map object that returns an array.
        // If expandDirectives returns an array but the key expects one, it's fine.
        // If the key expects an object but gets an array, we might have an issue.
        // In your schema, $$map replaces the object entirely, which is handled by check A above.
        // But if $$map is the *value* of a key (e.g. "children": { "$$map": ... }), check A handles the value.
        newNode[key] = this.expandDirectives(node[key], context);
      }
      return newNode;
    }

    // 4. Primitives (Return as is)
    return node;
  }

  /**
   * Checks if a node is a simple replacement instruction like {"param": "x"}
   */
  private isReplacementNode(node: any): boolean {
    if (typeof node !== "object" || node === null) return false;
    const keys = Object.keys(node);
    if (keys.length !== 1) return false;
    return keys[0] === "param" || keys[0] === "var"; 
  }

  private resolveReplacement(node: any, context: any): any {
    if ("param" in node) {
      return this.getValueByPath(context.param, node.param);
    }
    if ("var" in node) {
      // In build-time context (inside $$map), we check if this variable exists in our context.
      // If it does (e.g. "opt.value"), we resolve it.
      // If it DOESN'T (e.g. "quiz.score"), we leave it as a runtime {"var":...} node.
      const val = this.getValueByPath(context, node.var);
      if (val !== undefined) return val;
      return node; // Return original node for runtime evaluation
    }
    return node;
  }

  private processMap(config: any, context: any): any[] {
    const { source, as, template } = config;
    
    // Resolve source array. 
    // TODO: Handle source being a finite domain (generating a domain)
    // CORRECTION: It might not be needed since that is handled in the engine

    // We recursively expand source first to resolve the param reference.
    const sourceArray = this.expandDirectives(source, context);

    if (!Array.isArray(sourceArray)) {
      // If generation failed or source is empty, return empty array
      return [];
    }

    return sourceArray.map((item: any) => {
      // Create isolated scope: Parent Context + Loop Variable
      const loopContext = { ...context, [as]: item };
      return this.expandDirectives(JSON.parse(JSON.stringify(template)), loopContext);
    });
  }

  private processSwitch(config: any, context: any): any {
    const { on, cases, default: def } = config;

    // Resolve 'cases'. It might be a static array, or a $$map that generates an array.
    const casesArray = this.expandDirectives(cases, context);

    if (!Array.isArray(casesArray)) {
      return def;
    }

    // Build the If-Chain Backwards
    let logicChain = def;

    for (let i = casesArray.length - 1; i >= 0; i--) {
      const { match, result } = casesArray[i];
      logicChain = {
        "if": [
          { "==": [on, match] }, // Condition
          result,                // True
          logicChain             // False (Next condition)
        ]
      };
    }

    return logicChain;
  }

  private getValueByPath(obj: any, path: string): any {
    if (!path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }
}
