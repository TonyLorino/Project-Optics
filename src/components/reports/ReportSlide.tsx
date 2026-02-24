import { forwardRef } from 'react'
import Markdown from 'react-markdown'
import type { ProjectReportData } from '@/hooks/useProjectReport'
import { STATE_COLORS, LINKED_ISSUE_COLOR, LINKED_RISK_COLOR } from '@/lib/colors'

const STATUS_COLORS = {
  green: '#4ade80',
  yellow: '#facc15',
  red: '#f87171',
} as const

const HEADER_HEIGHT = 72
const FOOTER_HEIGHT = 44
const PADDING = 28
const QUADRANT_GAP = 1

interface ReportSlideProps {
  report: ProjectReportData
  areaName?: string | null
}

export const ReportSlide = forwardRef<HTMLDivElement, ReportSlideProps>(
  function ReportSlide({ report, areaName }, ref) {
    const hasDescription = !!report.description
    const bottomPad = hasDescription ? 0 : PADDING
    const quadrantHeight = 720 - PADDING - bottomPad - HEADER_HEIGHT - (hasDescription ? FOOTER_HEIGHT : 0)
    const halfHeight = Math.floor((quadrantHeight - QUADRANT_GAP) / 2)
    const contentWidth = 1280 - PADDING * 2
    const halfWidth = Math.floor((contentWidth - QUADRANT_GAP) / 2)

    return (
      <div
        ref={ref}
        style={{
          width: 1280,
          height: 720,
          paddingTop: PADDING,
          paddingLeft: PADDING,
          paddingRight: PADDING,
          paddingBottom: bottomPad,
          fontFamily: 'inherit',
        }}
        className="bg-background text-foreground flex flex-col"
      >
        {/* Header row */}
        <div style={{ height: HEADER_HEIGHT }} className="flex flex-col justify-start shrink-0">
          <h1 className="font-normal leading-tight" style={{ fontSize: '30pt' }}>
            {report.projectName}{areaName ? ` - ${areaName}` : ''}
          </h1>
          <div className="flex items-center justify-between mt-1.5" style={{ fontSize: '10pt' }}>
            <div className="flex gap-5">
              <MetaField label="Program Manager" value={report.programManager ?? '—'} />
              <MetaField label="Project Manager" value={report.projectManager ?? '—'} />
            </div>
            <div className="flex items-center gap-4">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: STATUS_COLORS[report.overallStatus] }}
              />
              <span className="font-medium">{report.progressPercent}% complete</span>
              <MetaField label="End Date" value={report.endDate ?? '—'} />
            </div>
          </div>
        </div>

        {/* Quadrant grid with cross dividers */}
        <div className="flex-1 min-h-0" style={{ height: quadrantHeight }}>
          <div className="grid grid-cols-2 grid-rows-2 h-full">
            {/* Top-left: Accomplishments */}
            <div
              className="overflow-hidden border-r border-b border-foreground/20"
              style={{ width: halfWidth, height: halfHeight }}
            >
              <QuadrantContent title="Accomplishments" height={halfHeight}>
                {report.accomplishments ? (
                  <div className="prose prose-xs dark:prose-invert max-w-none text-[10pt] leading-snug [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_p]:my-1.5">
                    <Markdown>{report.accomplishments}</Markdown>
                  </div>
                ) : (
                  <p className="text-[10pt] text-muted-foreground">—</p>
                )}
              </QuadrantContent>
            </div>

            {/* Top-right: Look Ahead */}
            <div
              className="overflow-hidden border-b border-foreground/20"
              style={{ width: halfWidth + QUADRANT_GAP, height: halfHeight }}
            >
              <QuadrantContent title="Look Ahead" height={halfHeight}>
                {report.lookAhead ? (
                  <div className="prose prose-xs dark:prose-invert max-w-none text-[10pt] leading-snug [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_p]:my-1.5">
                    <Markdown>{report.lookAhead}</Markdown>
                  </div>
                ) : (
                  <p className="text-[10pt] text-muted-foreground">—</p>
                )}
              </QuadrantContent>
            </div>

            {/* Bottom-left: Milestones */}
            <div
              className="overflow-hidden border-r border-foreground/20"
              style={{ width: halfWidth, height: halfHeight + QUADRANT_GAP }}
            >
              <QuadrantContent title="Milestones" height={halfHeight + QUADRANT_GAP}>
                {report.milestones.length === 0 ? (
                  <p className="text-[10pt] text-muted-foreground">No active milestones</p>
                ) : (
                  <table className="w-full text-[10pt]">
                    <thead>
                      <tr className="border-b border-border/60 text-left">
                        <th className="pb-1 font-medium text-muted-foreground">Name</th>
                        <th className="pb-1 font-medium text-muted-foreground text-center w-12">Status</th>
                        <th className="pb-1 font-medium text-muted-foreground text-right w-20">Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.milestones.map((m) => (
                        <tr key={m.id} className="border-b border-border/30 last:border-0">
                          <td className="py-1 pr-2 break-words">{m.name}</td>
                          <td className="py-1 text-center w-12">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: STATE_COLORS[m.state] ?? STATE_COLORS.New }}
                            />
                          </td>
                          <td className="py-1 text-right text-muted-foreground w-20">
                            {m.targetDate ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </QuadrantContent>
            </div>

            {/* Bottom-right: Watch List */}
            <div
              className="overflow-hidden"
              style={{ width: halfWidth + QUADRANT_GAP, height: halfHeight + QUADRANT_GAP }}
            >
              <QuadrantContent title="Watch List" height={halfHeight + QUADRANT_GAP}>
                {report.watchList.length === 0 ? (
                  <p className="text-[10pt] text-muted-foreground">No open risks or issues</p>
                ) : (
                  <table className="w-full text-[10pt]">
                    <thead>
                      <tr className="border-b border-border/60 text-left">
                        <th className="pb-1 font-medium text-muted-foreground w-12">Type</th>
                        <th className="pb-1 font-medium text-muted-foreground">Title</th>
                        <th className="pb-1 font-medium text-muted-foreground text-right w-24">Owner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.watchList.map((w) => (
                        <tr key={w.id} className="border-b border-border/30 last:border-0">
                          <td className="py-1 pr-2 w-12">
                            <span
                              className="inline-block px-1.5 py-0 rounded text-[10pt] font-medium"
                              style={{
                                backgroundColor: w.type === 'Issue' ? LINKED_ISSUE_COLOR : LINKED_RISK_COLOR,
                                color: w.type === 'Issue' ? '#7f1d1d' : '#78350f',
                              }}
                            >
                              {w.type}
                            </span>
                          </td>
                          <td className="py-1 pr-2 break-words">{w.title}</td>
                          <td className="py-1 text-right text-muted-foreground w-24 break-words">
                            {w.owner}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </QuadrantContent>
            </div>
          </div>
        </div>

        {/* Footer band: Description */}
        {hasDescription && (
          <div
            style={{
              height: FOOTER_HEIGHT,
              marginLeft: -PADDING,
              marginRight: -PADDING,
              paddingLeft: PADDING,
              paddingRight: PADDING,
              backgroundColor: '#4b4b4b',
              color: '#f5f0e8',
            }}
            className="shrink-0 flex items-center justify-center overflow-hidden"
          >
            <div className="text-[10pt] text-center line-clamp-2 max-w-full leading-relaxed">
              <Markdown>{report.description!}</Markdown>
            </div>
          </div>
        )}
      </div>
    )
  },
)

function QuadrantContent({
  title,
  height,
  children,
}: {
  title: string
  height: number
  children: React.ReactNode
}) {
  return (
    <div className="px-3 py-2 h-full flex flex-col" style={{ maxHeight: height }}>
      <h3 className="font-semibold mb-1.5 shrink-0 text-foreground/80" style={{ fontSize: '12pt' }}>{title}</h3>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground/70">{label}: </span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
