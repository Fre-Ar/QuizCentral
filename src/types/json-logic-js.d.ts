declare module "json-logic-js" {
  const jsonLogic: {
    apply: (rule: any, data?: any) => any;

    add_operation: (name: string, func: Function) => void;
  };

  export default jsonLogic;
}
