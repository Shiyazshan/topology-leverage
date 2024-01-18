import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { NodeType,ChildNodeType} from "../utils";

const CONTAINER_HEIGHT = 225;
const CONTAINER_WIDTH = 300;

const CHILD_HEIGHT = 50;
const CHILD_WIDTH = 60;

// Child labels must to be distinct on every container.
const INITIAL_NODES: NodeType[] = [
  {
    id: "google",
    x: window.innerWidth / 2 - 150,
    y: 100,
    label: "Google",
    type: "parent",
    children: ["nySites", "caSites"],
  },
  {
    id: "nySites",
    x: 100,
    y: 400,
    label: "New York Sites",
    type: "child",
    children: [
      { label: "NY-1", x: null, y: null },
      { label: "NY-2", x: null, y: null },
      { label: "NY-3", x: null, y: null },
      { label: "NY-4", x: null, y: null },
    ],
  },
  {
    id: "caSites",
    x: 500,
    y: 400,
    label: "California Sites",
    type: "child",
    children: [
      { label: "CS-1", x: null, y: null },
      { label: "CS-2", x: null, y: null },
    ],
  },
  {
    id: "banSites",
    x: 900,
    y: 400,
    label: "New Jersey Sites",
    type: "child",
    children: [{ label: "NJ-1", x: null, y: null }],
  },
];

const MainApp = () => {
  const containerRef = useRef<SVGSVGElement | null>(null);

  const [nodes, setNodes] = useState<NodeType[]>(INITIAL_NODES);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  //to move container nodes
  const drag = d3.drag<SVGGElement, NodeType>().on("drag", (event, d) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === d.id ? { ...node, x: event.x, y: event.y } : node
      )
    );
  });

  // to move child nodes
  const childDrag = d3
    .drag<SVGGElement, ChildNodeType>()
    .on("drag", (event, d) => {
      // @ts-expect-error 
      setNodes((prevNodes) =>
        prevNodes.map((node) => ({
          ...node,
          children: node.children.map((child, i) => {
            const validX =
              (child as ChildNodeType).x !== null
                ? Math.min(
                    (child as ChildNodeType).x + event.dx,
                    CONTAINER_WIDTH - (i + 1) * CHILD_WIDTH
                  )
                : event.x;
            const validY =
              (child as ChildNodeType).y !== null
                ? Math.min(
                    (child as ChildNodeType).y + event.dy,
                    CONTAINER_HEIGHT - CHILD_HEIGHT
                  )
                : event.x;

            return typeof child !== "string" && child.label === d.label
              ? {
                  ...child,
                  x: Number(
                    validX <= -i * CHILD_WIDTH ? -(i * CHILD_WIDTH) : validX
                  ),
                  y: Number(validY <= 0 ? 0 : validY),
                }
              : child;
          }),
        }))
      );
    });

  useEffect(() => {
    setWidth(window.innerWidth - 10);
    setHeight(window.innerHeight - 10);
  }, []);
  
  // init d3 and render containers and nodes
  useEffect(() => {
    const svg = d3.select(containerRef.current);

    const render = () => {
      // container and child node elements
      const node = svg
        .selectAll<SVGGElement, NodeType>(".node")
        .data(nodes, (d) => d.id);
      const subNodes = svg.selectAll<SVGGElement, NodeType>(".child-group");

      // init container group
      const nodeEnter = node
        .enter()
        .append("g")
        .attr("class", "node")
        .call(drag); // apply drag behavior to container nodes

      // position and render rectangles for each container
      nodeEnter
        .append("rect")
        .attr("width", CONTAINER_WIDTH)
        .attr("height", CONTAINER_HEIGHT)
        .style("fill", "#9fafd1")
        .attr("rx", 20);

      // add label for container nodes
      nodeEnter
        .append("text")
        .attr("x", 150)
        .attr("y", CONTAINER_HEIGHT - CONTAINER_HEIGHT / 3)
        .attr("text-anchor", "middle")
        .text((d) => d.label);

      // init child group
      const childGroups = nodeEnter
        .selectAll<SVGGElement, NodeType>(".child-group")
        .data((d) => d.children as ChildNodeType[])
        .enter()
        .append("g")
        .attr("class", "child-group")
        .call(childDrag); // apply drag behavior to child nodes

      // position and render rectangles for each child inside the main node
      childGroups
        .filter((d) => typeof d !== "string")
        .append("rect")
        .attr("width", CHILD_WIDTH)
        .attr("height", CHILD_HEIGHT)
        .attr("x", (d, i) => (d.x === null ? i * CHILD_WIDTH : d.x))
        .attr("y", (d) => (d.y === null ? 0 : d.y))
        .style("fill", "#ffffff")
        .attr("rx", 50);

      // Render text labels for each child inside the main node
      childGroups
        .append("text")
        .attr("x", (_, i) => i * CHILD_WIDTH + CHILD_WIDTH / 2)
        .attr("y", () => CHILD_HEIGHT / 2)
        .attr("text-anchor", "middle")
        .text((d) => d.label)
        .style("font-size", "12px");  

      // update node with nodeEnter
      node
        .merge(nodeEnter)
        // apply the transform to the container groups
        .attr(
          "transform",
          (d) => `translate(${Number(d.x || 0)},${Number(d.y || 0)})`
        );

      // update the position of child nodes
      subNodes.attr("transform", (child) => {
        // find child from updated state in `nodes`
        let currChild = nodes
          .flatMap((n) => n.children as ChildNodeType[])
          .find((n) => n.label === (child as NodeType).label);

        if (!currChild)
          currChild = {
            ...child,
            x: 0,
            y: 0,
          };

        return `translate(${currChild.x},${currChild.y})`;
      });

      node.exit().remove();

      // linking lines
      const link = svg
        .selectAll<SVGLineElement, NodeType>(".link")
        .data(nodes.slice(1));

      const linkEnter = link.enter().append("line").attr("class", "link");

      link
        .merge(linkEnter)
        .attr("x1", () => (nodes[0].x || 0) + 150)
        .attr("y1", () => (nodes[0].y || 0) + 225)
        .attr("x2", (d) => (d.x || 0) + 150)
        .attr("y2", (d) => d.y || 0)
        .attr("stroke", "#dfe4ef");

      link.exit().remove();
    };

    render();
  }, [childDrag, drag, nodes]);

  return <svg ref={containerRef} width={width} height={height} />;
};

export default MainApp;
