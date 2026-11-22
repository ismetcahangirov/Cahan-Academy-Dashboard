import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, Skeleton } from '../../components/ui';
import { EdelweissGlyph } from '../../components/ornament';

/**
 * ActivityChart — monthly "held lessons" line for the dashboard (DESIGN.md "Charts"): one wine
 * series with a soft wine-tint area, hairline grid, edelweiss point markers and small-caps month
 * labels. Drawn in real pixels (ResizeObserver) so text never scales; the line draws once on mount.
 * The data is also exposed as an sr-only table.
 */
const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const HEIGHT = 240;
const PAD = { top: 22, right: 14, bottom: 34, left: 34 };

const getActivityData = (stats) => {
  if (stats?.monthlyActivity?.length > 0) {
    return stats.monthlyActivity.map(({ month, value }) => ({ month, value }));
  }
  // No data yet: an empty chart for the last 7 months
  const currentMonth = new Date().getMonth();
  return Array.from({ length: 7 }, (_, index) => ({
    month: MONTH_KEYS[(currentMonth - 6 + index + 12) % 12],
    value: 0,
  }));
};

const niceTicks = (max) => {
  if (max <= 4) return Array.from({ length: Math.max(max, 1) + 1 }, (_, i) => i);
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => +(i * step).toFixed(6));
};

// Monotone cubic (Fritsch–Carlson): smooth, never overshoots below zero or above a peak.
const monotonePath = (pts) => {
  if (pts.length < 2) return pts.length ? `M${pts[0].x},${pts[0].y}` : '';
  const n = pts.length;
  const dx = [];
  const m = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1].x - pts[i].x;
    m[i] = (pts[i + 1].y - pts[i].y) / dx[i];
  }
  const tan = [m[0]];
  for (let i = 1; i < n - 1; i++) tan[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  tan[n - 1] = m[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      tan[i] = 0;
      tan[i + 1] = 0;
      continue;
    }
    const a = tan[i] / m[i];
    const b = tan[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      tan[i] = k * a * m[i];
      tan[i + 1] = k * b * m[i];
    }
  }
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${pts[i].x + h},${pts[i].y + tan[i] * h} ${pts[i + 1].x - h},${pts[i + 1].y - tan[i + 1] * h} ${pts[i + 1].x},${pts[i + 1].y}`;
  }
  return d;
};

// Measures the chart box; a callback ref so it also works when the box mounts after the skeleton.
const useWidth = () => {
  const [width, setWidth] = useState(0);
  const observer = useRef(null);
  const ref = useCallback((el) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!el) return;
    setWidth(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    observer.current = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.current.observe(el);
  }, []);
  useEffect(() => () => observer.current?.disconnect(), []);
  return [ref, width];
};

const ActivityChart = ({ stats, isLoading, title, subtitle }) => {
  const { t } = useTranslation();
  const gradientId = useId().replace(/:/g, '');
  const [boxRef, width] = useWidth();
  const [hover, setHover] = useState(null);

  const heading = title || t('dashboard.activityChart');
  const data = getActivityData(stats);
  const ticks = niceTicks(Math.max(...data.map((d) => d.value), 0));
  const top = ticks[ticks.length - 1] || 1;
  const innerW = Math.max(width - PAD.left - PAD.right, 0);
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const slot = data.length ? innerW / data.length : 0;
  const baseY = PAD.top + innerH;
  const points = data.map((d, i) => ({
    ...d,
    label: t(`dashboard.months.${d.month}`),
    x: PAD.left + slot * (i + 0.5),
    y: baseY - (d.value / top) * innerH,
  }));
  const line = monotonePath(points);
  const area = points.length ? `${line}L${points[points.length - 1].x},${baseY}L${points[0].x},${baseY}Z` : '';
  const last = points[points.length - 1];
  const active = hover != null ? points[hover] : null;

  return (
    <Card variant="ornate" className="p-5 sm:p-6">
      {isLoading ? (
        <div className="space-y-6" aria-busy="true">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3.5 w-64" />
            </div>
            <Skeleton className="h-9 w-12" />
          </div>
          <Skeleton className="h-[200px] w-full rounded-[var(--radius-md)]" />
        </div>
      ) : (
        <>
          <CardHeader
            title={heading}
            subtitle={subtitle || t('dashboard.activityChartSubtitle')}
            actions={
              <div className="text-right">
                <p className="num text-[2rem] font-semibold leading-none text-accent-text">{last?.value ?? 0}</p>
                <p className="sc mt-1 text-[0.75rem] text-ink-muted">{t('dashboard.thisMonth')}</p>
              </div>
            }
            className="px-1"
          />

          <div ref={boxRef} className="relative mt-4" style={{ height: HEIGHT }}>
            {width > 0 && (
              <svg
                width={width}
                height={HEIGHT}
                viewBox={`0 0 ${width} ${HEIGHT}`}
                aria-hidden="true"
                focusable="false"
                className="block overflow-visible"
                onMouseLeave={() => setHover(null)}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" className="[stop-color:var(--accent)] [stop-opacity:0.2] dark:[stop-opacity:0.95]" />
                    <stop offset="100%" className="[stop-color:var(--accent)] [stop-opacity:0]" />
                  </linearGradient>
                </defs>

                {/* hairline grid + y ticks */}
                {ticks.map((tick) => {
                  const y = baseY - (tick / top) * innerH;
                  return (
                    <g key={tick}>
                      <line
                        x1={PAD.left}
                        x2={width - PAD.right}
                        y1={y}
                        y2={y}
                        className="stroke-[var(--line)]"
                        strokeWidth="1"
                        strokeDasharray={tick === 0 ? undefined : '2 5'}
                      />
                      <text x={PAD.left - 10} y={y} dy="0.35em" textAnchor="end" fontSize="12" className="num fill-current text-ink-subtle">
                        {tick}
                      </text>
                    </g>
                  );
                })}

                {/* hover guide */}
                {active && (
                  <line
                    x1={active.x}
                    x2={active.x}
                    y1={PAD.top - 6}
                    y2={baseY}
                    className="stroke-[var(--line-strong)]"
                    strokeWidth="1"
                    strokeDasharray="3 4"
                  />
                )}

                <path d={area} fill={`url(#${gradientId})`} className="orn-reveal" />
                <g className="orn-draw">
                  <path
                    d={line}
                    pathLength="1"
                    fill="none"
                    className="stroke-[var(--accent-text)]"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>

                {/* edelweiss markers on a surface disc so the line never runs through them */}
                {points.map((p, i) => {
                  const isLast = i === points.length - 1;
                  const big = isLast || hover === i;
                  const size = big ? 20 : 13;
                  return (
                    <g key={p.month} className="orn-reveal" style={{ animationDelay: `${Math.min(i, 8) * 40 + 250}ms` }}>
                      <circle cx={p.x} cy={p.y} r={big ? 9 : 6.5} className="fill-[var(--surface)]" />
                      <EdelweissGlyph
                        x={p.x - size / 2}
                        y={p.y - size / 2}
                        width={size}
                        height={size}
                        className="text-accent-text"
                      />
                    </g>
                  );
                })}

                {/* small-caps month labels */}
                {points.map((p, i) => (
                  <text
                    key={`${p.month}-label`}
                    x={p.x}
                    y={HEIGHT - 8}
                    textAnchor="middle"
                    fontSize="12"
                    className={`sc fill-current ${hover === i || i === points.length - 1 ? 'text-accent-text' : 'text-ink-muted'}`}
                  >
                    {p.label}
                  </text>
                ))}

                {/* hit areas */}
                {points.map((p, i) => (
                  <rect
                    key={`${p.month}-hit`}
                    x={p.x - slot / 2}
                    y={0}
                    width={slot}
                    height={HEIGHT}
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseEnter={() => setHover(i)}
                  />
                ))}
              </svg>
            )}

            {active && (
              <div
                className="card pointer-events-none absolute z-10 min-w-[6.5rem] px-3 py-2 text-center shadow-[var(--shadow-md)]"
                style={
                  // near the top the tooltip would cover the header figure: put it beside the point instead
                  active.y > 84
                    ? { left: active.x, top: active.y - 16, transform: 'translate(-50%, -100%)' }
                    : { left: active.x - 18, top: active.y, transform: 'translate(-100%, -50%)' }
                }
              >
                <p className="sc text-[0.72rem] text-ink-muted">{active.label}</p>
                <p className="num text-[1.35rem] font-semibold leading-tight text-ink">{active.value}</p>
              </div>
            )}

            <table className="sr-only" aria-label={heading}>
              <tbody>
                {points.map((p) => (
                  <tr key={p.month}>
                    <th scope="row">{p.label}</th>
                    <td>{p.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
};

export default ActivityChart;
