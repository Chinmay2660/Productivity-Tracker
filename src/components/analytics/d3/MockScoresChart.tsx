"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { formatTooltip, getChartTheme, hideTooltip, useChartSize } from "./utils";

type MockScoreDatum = { label: string; value: number; subject: string };

interface MockScoresChartProps {
  data: MockScoreDatum[];
  color?: string;
}

const MARGIN = { top: 12, right: 16, bottom: 32, left: 36 };

export default function MockScoresChart({ data, color = "#13C8A5" }: MockScoresChartProps) {
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
      .scalePoint()
      .domain(data.map((d) => d.label))
      .range([0, width])
      .padding(0.5);

    const y = d3.scaleLinear().domain([0, 100]).nice().range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call((axis) => axis.select(".domain").remove())
      .call((axis) =>
        axis.selectAll("text").attr("fill", theme.muted).attr("font-size", 10).attr("dy", "0.8em")
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

    const line = d3
      .line<MockScoreDatum>()
      .x((d) => x(d.label) ?? 0)
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    const path = g
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2.5)
      .attr("d", line);

    const totalLength = path.node()?.getTotalLength() ?? 0;
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(900)
      .attr("stroke-dashoffset", 0);

    const dots = g
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => x(d.label) ?? 0)
      .attr("cy", (d) => y(d.value))
      .attr("r", 0)
      .attr("fill", color)
      .attr("stroke", theme.card)
      .attr("stroke-width", 2);

    dots
      .transition()
      .duration(400)
      .delay((_, i) => 500 + i * 80)
      .attr("r", 5);

    dots
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("r", 7);
        formatTooltip(
          tooltipRef.current!,
          `<strong>${d.label}</strong><br/>${d.subject}: ${d.value}/100`,
          event.offsetX,
          event.offsetY - 28
        );
      })
      .on("mousemove", (event, d) => {
        formatTooltip(
          tooltipRef.current!,
          `<strong>${d.label}</strong><br/>${d.subject}: ${d.value}/100`,
          event.offsetX,
          event.offsetY - 28
        );
      })
      .on("mouseleave", function () {
        d3.select(this).attr("r", 5);
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
