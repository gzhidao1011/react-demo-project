---
name: data-visualization
description: Implement data visualization including charts, graphs, dashboards, and analytics. Use when creating charts, graphs, or data visualization components.
---

# Data Visualization

Implement data visualization using chart libraries.

## Quick Checklist

When implementing data visualization:

- [ ] **Chart library** selected (Recharts, Chart.js, etc.)
- [ ] **Data format** prepared
- [ ] **Chart type** selected
- [ ] **Responsive design** implemented
- [ ] **Interactive features** added
- [ ] **Loading state** handled
- [ ] **Empty state** handled

## Recharts Setup

### 1. Install Recharts

```bash
pnpm add recharts
```

### 2. Basic Chart Component

```tsx
// apps/web/app/components/LineChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface LineChartProps {
  data: ChartData[];
  dataKey: string;
  color?: string;
}

export function LineChartComponent({ data, dataKey, color = "#8884d8" }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey={dataKey} stroke={color} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### 3. Bar Chart

```tsx
// apps/web/app/components/BarChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface BarChartProps {
  data: ChartData[];
  dataKey: string;
  color?: string;
}

export function BarChartComponent({ data, dataKey, color = "#82ca9d" }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey={dataKey} fill={color} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### 4. Pie Chart

```tsx
// apps/web/app/components/PieChart.tsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface PieChartProps {
  data: { name: string; value: number }[];
  colors?: string[];
}

const DEFAULT_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"];

export function PieChartComponent({ data, colors = DEFAULT_COLORS }: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

## Chart Hook

### 1. useChartData Hook

```tsx
// packages/hooks/src/useChartData.ts
import { useMemo } from "react";

interface ChartDataPoint {
  [key: string]: string | number;
}

export function useChartData<T extends ChartDataPoint>(
  data: T[],
  options: {
    xKey: string;
    yKey: string;
    groupBy?: string;
  }
) {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    if (options.groupBy) {
      // Group data by specified key
      const grouped = data.reduce((acc, item) => {
        const key = String(item[options.groupBy!]);
        if (!acc[key]) {
          acc[key] = { name: key, [options.yKey]: 0 };
        }
        acc[key][options.yKey] += Number(item[options.yKey]);
        return acc;
      }, {} as Record<string, ChartDataPoint>);

      return Object.values(grouped);
    }

    return data.map((item) => ({
      name: String(item[options.xKey]),
      [options.yKey]: Number(item[options.yKey]),
    }));
  }, [data, options]);

  return chartData;
}
```

### 2. Usage

```tsx
import { useChartData } from "@repo/hooks";
import { LineChartComponent } from "./components/LineChart";

export function SalesChart({ sales }: { sales: Sale[] }) {
  const chartData = useChartData(sales, {
    xKey: "date",
    yKey: "amount",
  });

  return <LineChartComponent data={chartData} dataKey="amount" />;
}
```

## Dashboard Component

### 1. Dashboard Layout

```tsx
// apps/web/app/components/Dashboard.tsx
import { LineChartComponent } from "./LineChart";
import { BarChartComponent } from "./BarChart";
import { PieChartComponent } from "./PieChart";

export function Dashboard({ data }: { data: DashboardData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="card">
        <h3>销售趋势</h3>
        <LineChartComponent data={data.sales} dataKey="value" />
      </div>
      
      <div className="card">
        <h3>产品分布</h3>
        <BarChartComponent data={data.products} dataKey="count" />
      </div>
      
      <div className="card">
        <h3>分类占比</h3>
        <PieChartComponent data={data.categories} />
      </div>
    </div>
  );
}
```

## Best Practices

### ✅ Good Practices

- Use responsive containers
- Handle empty data states
- Show loading states
- Use appropriate chart types
- Add tooltips and legends
- Format data before rendering
- Use consistent colors
- Make charts accessible

### ❌ Anti-Patterns

- Don't render charts without data
- Don't skip loading states
- Don't use wrong chart types
- Don't ignore responsive design
- Don't skip accessibility

## Related Rules

- Component Development: `.cursor/skills/component-development/SKILL.md`
- Performance Optimization: `.cursor/skills/performance-optimization/SKILL.md`
