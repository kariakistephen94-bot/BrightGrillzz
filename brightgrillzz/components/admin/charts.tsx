'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const nairaCompact = (v: number) =>
  '₦' + (v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + 'M' : Math.round(v / 1000) + 'K')

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[240px] w-full items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
      {label}
    </div>
  )
}

/* ------------------------- Revenue area chart ------------------------- */

const revenueConfig = {
  revenue: { label: 'Revenue', color: 'var(--color-chart-1)' },
} satisfies ChartConfig

export function RevenueAreaChart({ data }: { data: { period: string; revenue: number }[] }) {
  if (!data.length) return <EmptyChart label="No revenue yet" />
  return (
    <ChartContainer config={revenueConfig} className="aspect-auto h-[280px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <defs>
          <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="4 4" />
        <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={10} minTickGap={16} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => nairaCompact(Number(v))}
        />
        <ChartTooltip
          cursor={{ strokeDasharray: '4 4' }}
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={(value) => (
                <div className="flex flex-1 items-center justify-between gap-3">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {nairaCompact(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-revenue)"
          strokeWidth={2.5}
          fill="url(#fillRevenue)"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}

/* ------------------------- Orders bar chart ------------------------- */

const ordersConfig = {
  orders: { label: 'Orders', color: 'var(--color-chart-1)' },
} satisfies ChartConfig

export function OrdersBarChart({ data }: { data: { day: string; orders: number }[] }) {
  if (!data.length) return <EmptyChart label="No orders yet" />
  return (
    <ChartContainer config={ordersConfig} className="aspect-auto h-[240px] w-full">
      <BarChart data={data} margin={{ left: -8, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="4 4" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} />
        <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        <Bar dataKey="orders" fill="var(--color-orders)" radius={[8, 8, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ChartContainer>
  )
}

/* ------------------------- Category donut ------------------------- */

export function CategoryDonut({
  data,
}: {
  data: { category: string; value: number; key: string }[]
}) {
  if (!data.length) return <EmptyChart label="No sales yet" />
  const donutData = data.map((c, i) => ({ ...c, fill: `var(--color-chart-${(i % 5) + 1})` }))
  const total = donutData.reduce((sum, d) => sum + d.value, 0)
  const config = Object.fromEntries(
    data.map((c, i) => [c.key, { label: c.category, color: `var(--color-chart-${(i % 5) + 1})` }]),
  ) satisfies ChartConfig

  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-[240px]">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              nameKey="category"
              hideLabel
              formatter={(value, _name, item) => (
                <div className="flex flex-1 items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      className="h-2.5 w-2.5 rounded-[3px]"
                      style={{ background: item?.payload?.fill }}
                    />
                    {item?.payload?.category}
                  </span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {Number(value)}%
                  </span>
                </div>
              )}
            />
          }
        />
        <Pie
          data={donutData}
          dataKey="value"
          nameKey="category"
          innerRadius={62}
          outerRadius={92}
          paddingAngle={3}
          strokeWidth={0}
        >
          {donutData.map((entry) => (
            <Cell key={entry.key} fill={entry.fill} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) - 6}
                      className="fill-foreground text-2xl font-bold"
                    >
                      {total}%
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 16}
                      className="fill-muted-foreground text-xs"
                    >
                      of sales
                    </tspan>
                  </text>
                )
              }
              return null
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}

/* ------------------------- AOV line chart ------------------------- */

const aovConfig = {
  aov: { label: 'Avg. order value', color: 'var(--color-chart-4)' },
} satisfies ChartConfig

export function AovLineChart({ data }: { data: { period: string; aov: number }[] }) {
  if (!data.length) return <EmptyChart label="No data yet" />
  return (
    <ChartContainer config={aovConfig} className="aspect-auto h-[240px] w-full">
      <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="4 4" />
        <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={10} minTickGap={16} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={52}
          domain={['dataMin - 200', 'dataMax + 200']}
          tickFormatter={(v) => nairaCompact(Number(v))}
        />
        <ChartTooltip
          cursor={{ strokeDasharray: '4 4' }}
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={(value) => (
                <div className="flex flex-1 items-center justify-between gap-3">
                  <span className="text-muted-foreground">Avg. order value</span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {'₦' + Number(value).toLocaleString()}
                  </span>
                </div>
              )}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="aov"
          stroke="var(--color-aov)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  )
}
