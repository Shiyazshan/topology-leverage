export interface ChildNodeType {
    label: string;
    x: null | number;
    y: null | number;
  }
  
  export type ChildNodeProps =
    | { children: string[]; type: "parent" }
    | { children: ChildNodeType[]; type: "child" };
  
  export type NodeType = {
    id: string;
    x: number | null;
    y: number | null;
    label: string;
  } & ChildNodeProps;
  