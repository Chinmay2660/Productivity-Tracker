"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { formatTooltip, getChartTheme, hideTooltip, useChartSize } from "./utils";

type StudyHoursDatum = { label: string; value: number };

interface StudyHoursChartProps {
  data: StudyHoursDatum[];
  color?: string;
}

const MARGIN = { top: 12, right: 12, bottom: 32, left: 36 };

export default function StudyHoursChart({ data, color = "#25A6EE" }: StudyHoursChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { containerRef, size } = useChartSize();

  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current || size.width === 0 || data.length === 0) return;

    const theme = getChartTheme();
    const width = size.width - MARGIN.left - MARGIN.right;
    const height = size.height - MARGIN.top - MARGIN.bottom;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("width", size.width)
      .attr("height", size.height)
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, width])
      .padding(0.25);

    const y = d3
      .scaleLinear()
      .domain([0, Math.max(d3.max(data, (d) => d.value) ?? 0, 0.5)])
      .nice()
      .range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call((axis) => axis.select(".domain").remove())
      .call((axis) =>
        axis.selectAll("text").attr("fill", theme.muted).attr("font-size", 11).attr("dy", "0.8em")
      );

    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickSize(-width))
      .call((axis) => axis.select(".domain").remove())
      .call((axis) =>
        axis.selectAll("text").attr("fill", theme.muted).attr("font-size", 11)
      )
      .call((axis) =>
        axis.selectAll(".tick line").attr("stroke", theme.grid).attr("stroke-dasharray", "3,3")
      );

    const bars = g
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d.label) ?? 0)
      .attr("width", x.bandwidth())
      .attr("rx", 4)
      .attr("fill", color)
      .attr("opacity", 0.9)
      .attr("y", height)
      .attr("height", 0);

    bars
      .transition()
      .duration(600)
      .delay((_, i) => i * 40)
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => height - y(d.value));

    bars
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("opacity", 1);
        formatTooltip(
          tooltipRef.current!,
          `<strong>${d.label}</strong><br/>${d.value}h studied`,
          event.offsetX,
          event.offsetY - 28
        );
      })
      .on("mousemove", (event, d) => {
        formatTooltip(
          tooltipRef.current!,
          `<strong>${d.label}</strong><br/>${d.value}h studied`,
          event.offsetX,
          event.offsetY - 28
        );
      })
      .on("mouseleave", function () {
        d3.select(this).attr("opacity", 0.9);
        hideTooltip(tooltipRef.current!);
      });
  }, [color, data, size]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg ref={svgRef} className="overflow-visible" />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute z-10 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs shadow-md"
        style={{ opacity: 0, transform: "translate(-50%, -100%)" }}
      />
    </div>
  );
}
