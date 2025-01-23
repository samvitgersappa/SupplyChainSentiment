import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Warehouse } from '../types';

interface Props {
  warehouses: Warehouse[];
}

export const WarehouseSimulation: React.FC<Props> = ({ warehouses }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 600;

    // Clear previous content
    svg.selectAll("*").remove();

    // Set up the simulation
    const simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id((d: any) => d.id))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Draw warehouses as nodes
    const nodes = warehouses.map(w => ({
      id: w.id,
      name: w.name,
      inventory: w.inventory
    }));

    // Create links between warehouses
    const links = [];
    for (let i = 0; i < warehouses.length; i++) {
      for (let j = i + 1; j < warehouses.length; j++) {
        links.push({
          source: warehouses[i].id,
          target: warehouses[j].id
        });
      }
    }

    // Draw links
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .style("stroke", "#999")
      .style("stroke-opacity", 0.6);

    // Draw nodes
    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 20)
      .style("fill", "#69b3a2");

    // Add labels
    const labels = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .text(d => d.name)
      .style("text-anchor", "middle")
      .style("fill", "#fff")
      .style("font-size", "12px");

    // Update positions
    simulation
      .nodes(nodes)
      .on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

        node
          .attr("cx", (d: any) => d.x)
          .attr("cy", (d: any) => d.y);

        labels
          .attr("x", (d: any) => d.x)
          .attr("y", (d: any) => d.y);
      });

    simulation.force("link")?.links(links);
  }, [warehouses]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Warehouse Simulation</h2>
      <svg ref={svgRef} width="800" height="600" className="border border-gray-200"></svg>
    </div>
  );
};