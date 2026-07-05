'use client'

import * as React from 'react'
import * as RechartsPrimitive from 'recharts'
import { cn } from '@/lib/utils'

/**
 * Lightweight chart primitives in the shadcn/ui style, adapted for Tailwind v4
 * and recharts 3. `ChartContainer` injects per-series CSS variables
 * (`--color-<key>`) so series colours stay theme-aware in light and dark mode.
 */

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
  }
}

type ChartContextProps = { config: ChartConfig }

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }
  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >['children']
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-sector]:outline-none [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(
    ([, cfg]) => cfg.color,
  )
  if (!colorConfig.length) return null

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart=${id}] {\n${colorConfig
          .map(([key, cfg]) => (cfg.color ? `  --color-${key}: ${cfg.color};` : null))
          .filter(Boolean)
          .join('\n')}\n}`,
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
  hideLabel = false,
  hideIndicator = false,
  indicator = 'dot',
  nameKey,
  className,
}: {
  active?: boolean
  payload?: any[]
  label?: any
  labelFormatter?: (value: any, payload: any[]) => React.ReactNode
  formatter?: (value: any, name: any, item: any, index: number) => React.ReactNode
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: 'line' | 'dot' | 'dashed'
  nameKey?: string
  className?: string
}) {
  const { config } = useChart()

  if (!active || !payload?.length) return null

  const tooltipLabel = hideLabel ? null : (
    <div className="font-medium text-foreground">
      {labelFormatter ? labelFormatter(label, payload) : label}
    </div>
  )

  return (
    <div
      className={cn(
        'grid min-w-[9rem] items-start gap-1.5 rounded-xl border border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm',
        className,
      )}
    >
      {tooltipLabel}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || 'value'}`
          const itemConfig = config[key] ?? config[item.dataKey as string]
          const indicatorColor = item.payload?.fill || item.color

          return (
            <div
              key={item.dataKey ?? index}
              className="flex w-full items-center gap-2"
            >
              {formatter ? (
                formatter(item.value, item.name, item, index)
              ) : (
                <>
                  {!hideIndicator && (
                    <span
                      className={cn('shrink-0 rounded-[2px]', {
                        'h-2.5 w-2.5': indicator === 'dot',
                        'h-2.5 w-1': indicator === 'line',
                        'h-2.5 w-0 border-[1.5px] border-dashed bg-transparent':
                          indicator === 'dashed',
                      })}
                      style={{
                        background: indicator !== 'dashed' ? indicatorColor : undefined,
                        borderColor: indicatorColor,
                      }}
                    />
                  )}
                  <div className="flex flex-1 items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      {itemConfig?.label || item.name}
                    </span>
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {typeof item.value === 'number'
                        ? item.value.toLocaleString()
                        : item.value}
                    </span>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ChartLegend = RechartsPrimitive.Legend

function ChartLegendContent({
  payload,
  className,
  nameKey,
}: {
  payload?: any[]
  className?: string
  nameKey?: string
}) {
  const { config } = useChart()
  if (!payload?.length) return null

  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-4 pt-3', className)}>
      {payload.map((item) => {
        const key = `${nameKey || item.dataKey || 'value'}`
        const itemConfig = config[key]
        return (
          <div key={String(item.value)} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: item.color }}
            />
            <span className="text-muted-foreground">{itemConfig?.label || item.value}</span>
          </div>
        )
      })}
    </div>
  )
}

export {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  useChart,
}
