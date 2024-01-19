import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { NodeType, ChildNodeType } from "../types";
import {
  CHILD_BG_COLOR,
  CHILD_HEIGHT,
  CHILD_ICON_SIZE,
  CHILD_WIDTH,
  CONNECTOR_LINE_COLOR,
  PARENT_BG_COLOR,
  PARENT_HEIGHT,
  PARENT_ICON_SIZE,
  PARENT_WIDTH,
} from "../constants";

const INITIAL_NODES: NodeType[] = [
  {
    id: "google",
    icon: "/icons/google.svg",
    x: window.innerWidth / 2 - PARENT_WIDTH / 2,
    y: PARENT_HEIGHT / 2,
    label: "Google",
    type: "parent",
    children: ["ny_sites", "vo_sites"],
  },
  {
    id: "ny_sites",
    icon: "/icons/us-flag.svg",
    x: window.innerWidth / 2 - PARENT_WIDTH * 2,
    y: PARENT_HEIGHT * 2,
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
    id: "vo_sites",
    icon: "/icons/us-flag.svg",
    x: window.innerWidth / 2 - PARENT_WIDTH / 2,
    y: PARENT_HEIGHT * 2,
    label: "Vermont Sites",
    type: "child",
    children: [
      { label: "VO-1", x: null, y: null },
      { label: "VO-2", x: null, y: null },
    ],
  },
  {
    id: "ban_sites",
    icon: "/icons/us-flag.svg",
    x: window.innerWidth / 2 + PARENT_WIDTH,
    y: PARENT_HEIGHT * 2,
    label: "New Jersey Sites",
    type: "child",
    children: [{ label: "NJ-1", x: null, y: null }],
  },
];

export const HomeScreen = () => {
  const parentRef = useRef<SVGSVGElement | null>(null);

  const [nodes, setNodes] = useState<NodeType[]>(INITIAL_NODES);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  // to parent container nodes
  const onParentDrag = (event: any, d: NodeType) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === d.id ? { ...node, x: event.x, y: event.y } : node
      )
    );
  };

  // to move child nodes
  const onChildDrag = (event: any, d: ChildNodeType) => {
    // @ts-expect-error
    setNodes((prevNodes) =>
      prevNodes.map((node) => ({
        ...node,
        children: node.children.map((child, i) => {
          const getX =
            (child as ChildNodeType).x !== null
              ? Math.min(
                  (child as ChildNodeType).x + event.dx,
                  PARENT_WIDTH - (i + 1) * CHILD_WIDTH
                )
              : event.x;
          const getY =
            (child as ChildNodeType).y !== null
              ? Math.min(
                  (child as ChildNodeType).y + event.dy,
                  PARENT_HEIGHT - CHILD_HEIGHT
                )
              : event.x;

          return typeof child !== "string" && child.label === d.label
            ? {
                ...child,
                x: Number(getX <= -i * CHILD_WIDTH ? -(i * CHILD_WIDTH) : getX),
                y: Number(getY <= 0 ? 0 : getY),
              }
            : child;
        }),
      }))
    );
  };

  useEffect(() => {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
  }, []);

  // render parent container and child nodes after initiating D3.
  useEffect(() => {
    const svg = d3.select(parentRef.current);

    const render = () => {
      // parent container and child node elements
      const node = svg
        .selectAll<SVGGElement, NodeType>(".node")
        .data(nodes, (d) => d.id);
      const subChildNode = svg.selectAll<SVGGElement, NodeType>(".child-group");

      // init container group
      const childNodeEnter = node
        .enter()
        .append("g")
        .attr("class", "node")
        .call(d3.drag<SVGGElement, NodeType>().on("drag", onParentDrag)); // apply drag behavior to container nodes

      // position and render rectangles for each container
      childNodeEnter
        .append("rect")
        .attr("width", PARENT_WIDTH)
        .attr("height", PARENT_HEIGHT)
        .style("fill", PARENT_BG_COLOR)
        .attr("rx", 20);

      // add label for container nodes
      childNodeEnter
        .append("text")
        .attr("x", 150)
        .attr("y", PARENT_HEIGHT - PARENT_HEIGHT / 3)
        .attr("text-anchor", "middle")
        .text((d) => d.label);

      // add icons
      childNodeEnter
        .append("image")
        .attr("xlink:href", (d) => d.icon) // assuming that `icon` is the path to the image
        .attr("x", (d) =>
          d.type === "parent"
            ? PARENT_WIDTH / 2 - PARENT_ICON_SIZE / 2
            : PARENT_WIDTH / 2 - CHILD_ICON_SIZE / 2
        ) // adjust the x-coordinate as needed
        .attr("y", (d) =>
          d.type === "parent"
            ? PARENT_HEIGHT - PARENT_HEIGHT / 2 - PARENT_ICON_SIZE / 1.5
            : PARENT_HEIGHT - PARENT_HEIGHT / 2 - CHILD_ICON_SIZE / 1.5
        ) // adjust the y-coordinate as needed
        .attr("width", (d) =>
          d.type === "parent" ? PARENT_ICON_SIZE : CHILD_ICON_SIZE
        ) // adjust the width as needed
        .attr("height", (d) =>
          d.type === "parent" ? PARENT_ICON_SIZE : CHILD_ICON_SIZE
        ); // adjust the height as needed

      // init child group
      const childGroups = childNodeEnter
        .selectAll<SVGGElement, NodeType>(".child-group")
        .data((d) => d.children as ChildNodeType[])
        .enter()
        .append("g")
        .attr("class", "child-group")
        .call(d3.drag<SVGGElement, ChildNodeType>().on("drag", onChildDrag)); // apply drag behavior to child nodes

      // position and render rectangles for each child inside the main node
      childGroups
        .filter((d) => typeof d !== "string")
        .append("rect")
        .attr("width", CHILD_WIDTH)
        .attr("height", CHILD_HEIGHT)
        .attr("x", (d, i) => (d.x === null ? i * CHILD_WIDTH : d.x))
        .attr("y", (d) => (d.y === null ? 0 : d.y))
        .style("fill", CHILD_BG_COLOR)
        .attr("rx", 50);

      // Render text labels for each child inside the main node
      childGroups
        .append("text")
        .attr("x", (_, i) => i * CHILD_WIDTH + CHILD_WIDTH / 2)
        .attr("y", () => CHILD_HEIGHT / 2)
        .attr("text-anchor", "middle")
        .text((d) => d.label)
        .style("font-size", "12px");

      node
        .merge(childNodeEnter)
        // apply the transform to the parent groups
        .attr(
          "transform",
          (d) => `translate(${Number(d.x || 0)},${Number(d.y || 0)})`
        );

      // update the position of child nodes
      subChildNode.attr("transform", (child) => {
        // find child from updated state in `nodes`
        let alphaChild = nodes
          .flatMap((n) => n.children as ChildNodeType[])
          .find((n) => n.label === (child as NodeType).label);

        if (!alphaChild)
          alphaChild = {
            ...child,
            x: 0,
            y: 0,
          };

        return `translate(${alphaChild.x},${alphaChild.y})`;
      });

      node.exit().remove();

      // linking lines
      const link = svg
        .selectAll<SVGLineElement, NodeType>(".link")
        .data(nodes.slice(1));

      const linkEnter = link.enter().append("line").attr("class", "link");

      link
        .merge(linkEnter)
        .attr("x1", () => (nodes[0].x || 0) + PARENT_WIDTH / 2)
        .attr("y1", () => (nodes[0].y || 0) + PARENT_HEIGHT)
        .attr("x2", (d) => (d.x || 0) + 150)
        .attr("y2", (d) => d.y || 0)
        .attr("stroke", CONNECTOR_LINE_COLOR);

      link.exit().remove();
    };

    render();
  }, [onChildDrag, onParentDrag, nodes]);

  return <svg ref={parentRef} width={width} height={height} />;
};
