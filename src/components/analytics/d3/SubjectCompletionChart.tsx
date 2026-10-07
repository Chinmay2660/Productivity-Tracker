"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { formatTooltip, getChartTheme, hideTooltip, useChartSize } from "./utils";

type SubjectDatum = { label: string; value: number };

interface SubjectCompletionChartProps {
  data: SubjectDatum[];
  color?: string;
}

const MARGIN = { top: 8, right: 16, bottom: 24, left: 108 };

export default function SubjectCompletionChart({
  data,
  color = "#A361CF",
}: SubjectCompletionChartProps) {
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

    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, height])
      .padding(0.28);

    const x = d3.scaleLinear().domain([0, 100]).range([0, width]);

    g.append("g")
      .call(d3.axisBottom(x).ticks(5).tickFormat((v) => `${v}%`).tickSize(-height))
      .attr("transform", `translate(0,${height})`)
      .call((axis) => axis.select(".domain").remove())
      .call((axis) =>
        axis.selectAll("text").attr("fill", theme.muted).attr("font-size", 11)
      )
      .call((axis) =>
        axis.selectAll(".tick line").attr("stroke", theme.grid).attr("stroke-dasharray", "3,3")
      );

    g.append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .call((axis) => axis.select(".domain").remove())
      .call((axis) =>
        axis
          .selectAll("text")
          .attr("fill", theme.foreground)
          .attr("font-size", 11)
          .each(function () {
            const text = d3.select(this);
            const label = text.text();
            if (label.length > 14) text.text(`${label.slice(0, 13)}…`);
          })
      );

    const bars = g
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("y", (d) => y(d.label) ?? 0)
      .attr("height", y.bandwidth())
      .attr("rx", 4)
      .attr("fill", color)
      .attr("opacity", 0.9)
      .attr("x", 0)
      .attr("width", 0);

    bars
      .transition()
      .duration(700)
      .delay((_, i) => i * 50)
      .attr("width", (d) => x(d.value));

    bars
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("opacity", 1);
        formatTooltip(
          tooltipRef.current!,
          `<strong>${d.label}</strong><br/>${d.value}% complete`,
          event.offsetX,
          event.offsetY - 28
        );
      })
      .on("mousemove", (event, d) => {
        formatTooltip(
          tooltipRef.current!,
          `<strong>${d.label}</strong><br/>${d.value}% complete`,
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
