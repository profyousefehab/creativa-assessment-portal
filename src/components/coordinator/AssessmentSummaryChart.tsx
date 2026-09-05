import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Award,
  CheckCircle2,
  Filter,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { AssessmentChartItem } from '../../services/db';

interface AssessmentSummaryChartProps {
  data: AssessmentChartItem[];
  onNavigateCourse?: (courseId: string) => void;
}

type FilterOption = 'ALL' | 'PRE_TEST' | 'POST_TEST' | 'ACTIVE_ONLY';

export const AssessmentSummaryChart: React.FC<AssessmentSummaryChartProps> = ({
  data,
  onNavigateCourse,
}) => {
  const [filter, setFilter] = useState<FilterOption>('ALL');

  // Filter items based on active pill
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (filter === 'PRE_TEST') return item.type === 'PRE_TEST';
      if (filter === 'POST_TEST') return item.type === 'POST_TEST';
      if (filter === 'ACTIVE_ONLY') return item.totalAttempts > 0;
      return true;
    });
  }, [data, filter]);

  // Aggregate metrics
  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        overallAvgCompletion: 0,
        overallAvgScore: 0,
        totalEvaluatedAttempts: 0,
        topScoreItem: null as AssessmentChartItem | null,
        topCompletionItem: null as AssessmentChartItem | null,
      };
    }

    const itemsWithAttempts = filteredData.filter((i) => i.totalAttempts > 0);
    const avgComp =
      itemsWithAttempts.length > 0
        ? Math.round(
            itemsWithAttempts.reduce((acc, i) => acc + i.completionRate, 0) /
              itemsWithAttempts.length
          )
        : 0;

    const itemsWithScores = filteredData.filter((i) => i.completedAttempts > 0);
    const avgSc =
      itemsWithScores.length > 0
        ? Math.round(
            itemsWithScores.reduce((acc, i) => acc + i.averageScore, 0) /
              itemsWithScores.length
          )
        : 0;

    const totalCompleted = filteredData.reduce(
      (acc, i) => acc + i.completedAttempts,
      0
    );

    // Top performers
    let topScore: AssessmentChartItem | null = null;
    let topComp: AssessmentChartItem | null = null;

    filteredData.forEach((item) => {
      if (item.completedAttempts > 0) {
        if (!topScore || item.averageScore > topScore.averageScore) {
          topScore = item;
        }
      }
      if (item.totalAttempts > 0) {
        if (!topComp || item.completionRate > topComp.completionRate) {
          topComp = item;
        }
      }
    });

    return {
      overallAvgCompletion: avgComp,
      overallAvgScore: avgSc,
      totalEvaluatedAttempts: totalCompleted,
      topScoreItem: topScore,
      topCompletionItem: topComp,
    };
  }, [filteredData]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: AssessmentChartItem = payload[0].payload;
      return (
        <div
          id={`chart-tooltip-${item.assessmentId}`}
          className="bg-white p-4 rounded-2xl border border-[#e5e5e5] shadow-xl max-w-xs text-xs text-[#222222] space-y-3 z-50 pointer-events-none transition-all"
        >
          {/* Header */}
          <div className="border-b border-[#e5e5e5] pb-2">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] tracking-wide uppercase ${
                  item.type === 'PRE_TEST'
                    ? 'bg-[#e6eff8] text-[#004e9e]'
                    : 'bg-[#ecfdf5] text-[#047857]'
                }`}
              >
                {item.typeLabel}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                  item.status === 'PUBLISHED'
                    ? 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]'
                    : 'bg-[#fffbeb] text-[#b45309] border border-[#fde68a]'
                }`}
              >
                {item.status}
              </span>
            </div>
            <p className="font-bold text-[#222222] text-sm leading-snug">
              {item.courseName}
            </p>
            <p className="text-[11px] text-[#616161] mt-0.5">
              Instructor: {item.instructorName} • {item.categoryName}
            </p>
          </div>

          {/* Metrics comparison */}
          <div className="space-y-2.5">
            {/* Completion Rate */}
            <div>
              <div className="flex items-center justify-between font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-[#004e9e]">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#004e9e] inline-block" />
                  Completion Rate:
                </span>
                <span className="text-[#222222] text-sm font-bold">
                  {item.completionRate}%
                </span>
              </div>
              <div className="w-full bg-[#e5e5e5] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#004e9e] h-full rounded-full transition-all"
                  style={{ width: `${item.completionRate}%` }}
                />
              </div>
              <p className="text-[10px] text-[#616161] mt-1">
                {item.completedAttempts} completed of {item.totalAttempts} started{' '}
                {item.inProgressAttempts > 0 && `(${item.inProgressAttempts} in progress)`}
              </p>
            </div>

            {/* Average Score */}
            <div>
              <div className="flex items-center justify-between font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-[#e59d30]">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#f8af43] inline-block" />
                  Average Score:
                </span>
                <span className="text-[#222222] text-sm font-bold">
                  {item.completedAttempts > 0 ? `${item.averageScore}%` : 'N/A'}
                </span>
              </div>
              <div className="w-full bg-[#e5e5e5] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#f8af43] h-full rounded-full transition-all"
                  style={{ width: `${item.averageScore}%` }}
                />
              </div>
              <p className="text-[10px] text-[#616161] mt-1">
                {item.completedAttempts > 0 ? (
                  <>
                    Avg {item.avgPointsAwarded} / {item.maxPoints} pts • High: {item.highestScorePct}% / Low: {item.lowestScorePct}%
                  </>
                ) : (
                  'No submitted attempts yet'
                )}
              </p>
            </div>
          </div>

          {/* Click hint */}
          {onNavigateCourse && (
            <div className="pt-2 border-t border-[#e5e5e5] text-[10px] font-semibold text-[#004e9e] flex items-center gap-1">
              <span>Click bar to inspect course results</span>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="active-assessments-summary-chart"
      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
    >
      {/* Top Header & Interactive Filter Bar */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#004e9e] shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Completion Rate vs. Average Score
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cohort assessment performance benchmark across active courses
            </p>
          </div>
        </div>

        {/* Filter Tabs - Full Pills */}
        <div className="nav-pill-container text-xs font-semibold self-start md:self-auto">
          <button
            type="button"
            id="chart-filter-all"
            onClick={() => setFilter('ALL')}
            className={`transition-all ${
              filter === 'ALL'
                ? 'nav-pill-active'
                : 'nav-pill-inactive'
            }`}
          >
            All Active ({data.length})
          </button>
          <button
            type="button"
            id="chart-filter-pre"
            onClick={() => setFilter('PRE_TEST')}
            className={`transition-all ${
              filter === 'PRE_TEST'
                ? 'nav-pill-active'
                : 'nav-pill-inactive'
            }`}
          >
            Pre-Tests
          </button>
          <button
            type="button"
            id="chart-filter-post"
            onClick={() => setFilter('POST_TEST')}
            className={`transition-all ${
              filter === 'POST_TEST'
                ? 'nav-pill-active'
                : 'nav-pill-inactive'
            }`}
          >
            Post-Tests
          </button>
          <button
            type="button"
            id="chart-filter-active"
            onClick={() => setFilter('ACTIVE_ONLY')}
            className={`transition-all ${
              filter === 'ACTIVE_ONLY'
                ? 'nav-pill-active'
                : 'nav-pill-inactive'
            }`}
          >
            With Submissions
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="p-5 sm:p-6">
        {filteredData.length === 0 ? (
          <div className="py-16 text-center text-[#616161]">
            <BarChart3 className="w-12 h-12 text-[#d4d4d4] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#222222]">
              No assessments match the selected filter.
            </p>
            <p className="text-xs text-[#9e9e9e] mt-1">
              Select &quot;All Active&quot; to review all configured course assessments.
            </p>
          </div>
        ) : (
          <div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredData}
                  margin={{ top: 16, right: 16, left: -10, bottom: 35 }}
                  barGap={6}
                  onClick={(event: any) => {
                    if (event && event.activePayload && event.activePayload[0]) {
                      const payload = event.activePayload[0].payload as AssessmentChartItem;
                      if (payload?.courseId && onNavigateCourse) {
                        onNavigateCourse(payload.courseId);
                      }
                    }
                  }}
                  className="cursor-pointer"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="shortLabel"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                    height={55}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={50}
                    stroke="#cbd5e1"
                    strokeDasharray="3 3"
                    label={{
                      value: '50% Threshold',
                      position: 'insideBottomRight',
                      fill: '#94a3b8',
                      fontSize: 10,
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                  />
                  <Bar
                    dataKey="completionRate"
                    name="Completion Rate (%)"
                    fill="#004e9e"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="averageScore"
                    name="Average Score (%)"
                    fill="#f8af43"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Key Insights Banner */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-3 py-1 rounded-full text-slate-600 font-medium">
                  <span>Overall Avg: <strong className="text-slate-900">{stats.overallAvgScore}% score</strong></span>
                  <span className="text-slate-300">•</span>
                  <span><strong className="text-slate-900">{stats.overallAvgCompletion}% completion</strong></span>
                </div>
                {stats.topCompletionItem && (
                  <div className="flex items-center gap-1.5 bg-[#e6eff8] border border-[#004e9e]/20 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#004e9e] shrink-0" />
                    <span className="text-[#222222]">
                      <strong className="text-[#004e9e]">Top Completion:</strong>{' '}
                      {stats.topCompletionItem.shortLabel} ({stats.topCompletionItem.completionRate}%)
                    </span>
                  </div>
                )}
                {stats.topScoreItem && (
                  <div className="flex items-center gap-1.5 bg-[#fef3e2] border border-[#fde68a] px-3 py-1 rounded-full">
                    <Sparkles className="w-3.5 h-3.5 text-[#f8af43] shrink-0" />
                    <span className="text-[#222222]">
                      <strong className="text-[#b45309]">Top Score:</strong>{' '}
                      {stats.topScoreItem.shortLabel} ({stats.topScoreItem.averageScore}%)
                    </span>
                  </div>
                )}
              </div>

              <span className="text-[11px] text-slate-400">
                Click any bar to jump to course details
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
