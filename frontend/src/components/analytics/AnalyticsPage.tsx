import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, MessageCircle, BarChart3, ChevronDown } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getAnalytics, getCampaigns, Campaign, AnalyticsResponse } from '../../services/api';
import AIChatModal from '../ui/AIChatModal';

const insightBullets = [
  'Open rates are trending higher for multichannel campaigns.',
  'Top segments are responding best to WhatsApp messages.',
  'Email campaigns show consistent click rates on promotions.',
  'Schedule more campaigns during evening hours for higher engagement.',
];

const tooltipStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '12px',
  fontSize: 12,
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
};

const deliveryTrendLegendItems = [
  { key: 'Delivered', label: 'Delivered', color: 'var(--chart-cyan)' },
  { key: 'Opened', label: 'Opened', color: 'var(--chart-emerald)' },
  { key: 'Clicked', label: 'Clicked', color: 'var(--chart-amber)' },
];

// Collapsible Card Component (uses max-height animation to avoid affecting sibling cards)
const CollapsibleCard = ({
  title,
  subtitle,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      className="premium-card overflow-hidden border border-[rgba(0,0,0,0.08)]"
      animate={{ maxHeight: isExpanded ? 800 : 80 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{ willChange: 'max-height' }}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-card-soft)] transition-colors text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex-1">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
          {subtitle && !isExpanded && (
            <p className="text-xs text-[var(--text-muted)] mt-1">{subtitle}</p>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0 ml-2"
        >
          <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={isExpanded ? 'open' : 'closed'}
        variants={{
          open: { opacity: 1, maxHeight: 320 },
          closed: { opacity: 0, maxHeight: 0 },
        }}
        transition={{ duration: 0.3 }}
        style={{ overflow: 'hidden' }}
        className="border-t border-[var(--border)]"
      >
        <div className="p-4">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};

function DeliveryTrendTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid rgba(226, 232, 240, 1)',
      borderRadius: 8,
      padding: '10px 12px',
      boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
      fontSize: 12,
      color: '#0F172A',
      minWidth: 140,
    }}>
      <div className="mb-2 text-[12px] font-semibold text-[var(--text-primary)]">{label}</div>
      <div className="space-y-1">
        {payload.map(entry =>
          entry ? (
            <div key={entry.dataKey || entry.name} className="flex items-center gap-2 text-[var(--text-muted)]">
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: entry.color,
                  display: 'inline-block',
                }}
              />
              <span>{`${entry.name}: ${entry.value}`}</span>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState('Last 7 days');
  const [sortColumn, setSortColumn] = useState<'campaign' | 'sent' | 'delivered' | 'openRate' | 'clickRate' | 'revenue'>('sent');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsResponse>({
    totalCustomers: 0,
    activeSegments: 0,
    campaignsSent: 0,
    avgOpenRate: 0,
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Expanded state for rows - only one card per row can expand
  const [row2Expanded, setRow2Expanded] = useState<'delivery' | 'channel' | null>(null);
  const [row3Expanded, setRow3Expanded] = useState<'campaign' | 'insights' | 'ai' | null>(null);

  useEffect(() => {
    let ignore = false;

    const loadAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        const [analyticsData, campaignData] = await Promise.all([getAnalytics(), getCampaigns()]);
        if (ignore) return;
        setAnalytics(analyticsData);
        setCampaigns(campaignData);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadAnalytics();

    return () => {
      ignore = true;
    };
  }, []);

  const metricCards = useMemo(() => {
    return [
      { label: 'Open Rate', value: `${analytics.avgOpenRate.toFixed(1)}%`, change: '+3.2%', color: 'text-success' },
      { label: 'Click Rate', value: '9.1%', change: '+1.4%', color: 'text-success' },
      { label: 'Conversion', value: '7.8%', change: '+0.8%', color: 'text-success' },
      { label: 'Revenue', value: `?${(analytics.campaignsSent * 1.2).toFixed(1)}k`, change: '+8.5%', color: 'text-success' },
    ];
  }, [analytics]);

  const analyticsLineData = useMemo(() => {
    const base = analytics.avgOpenRate || 35;
    return Array.from({ length: 7 }, (_, index) => ({
      date: `Day ${index + 1}`,
      Delivered: Math.round(analytics.campaignsSent * 10 + index * 5),
      Opened: Math.round(base * 10 + index * 2),
      Clicked: Math.round(base * 2 + index),
    }));
  }, [analytics]);

  const analyticsBarData = useMemo(() => {
    return [
      { channel: 'WhatsApp', Sent: 360, Opened: 280 },
      { channel: 'Email', Sent: 220, Opened: 120 },
      { channel: 'SMS', Sent: 140, Opened: 65 },
      { channel: 'RCS', Sent: 90, Opened: 42 },
    ];
  }, []);

  const campaignPerformanceRows = useMemo(() => {
    return campaigns.map(campaign => {
      const reach = campaign.estimatedReach ?? campaign.sentCount ?? 0;
      const deliveredValue = campaign.status === 'Completed' ? Math.round(reach * 0.92) : campaign.status === 'Sending' ? Math.round(reach * 0.6) : 0;
      return {
        campaign: campaign.campaignName,
        segment: campaign.segment,
        channel: campaign.channels.join(', '),
        sent: reach.toString(),
        delivered: deliveredValue.toString(),
        openRate: `${campaign.status === 'Completed' ? 42 : 18}%`,
        clickRate: `${campaign.status === 'Completed' ? 9 : 3}%`,
        revenue: campaign.status === 'Completed' ? reach * 2 : reach,
        status: campaign.status,
      };
    });
  }, [campaigns]);

  const sortedRows = useMemo(() => {
    return [...campaignPerformanceRows].sort((a, b) => {
      const current = sortColumn === 'revenue' ? a.revenue : sortColumn === 'sent' ? parseInt(a.sent, 10) : sortColumn === 'delivered' ? parseInt(a.delivered, 10) : sortColumn === 'openRate' ? parseInt(a.openRate, 10) : sortColumn === 'clickRate' ? parseInt(a.clickRate, 10) : a.campaign;
      const next = sortColumn === 'revenue' ? b.revenue : sortColumn === 'sent' ? parseInt(b.sent, 10) : sortColumn === 'delivered' ? parseInt(b.delivered, 10) : sortColumn === 'openRate' ? parseInt(b.openRate, 10) : sortColumn === 'clickRate' ? parseInt(b.clickRate, 10) : b.campaign;
      if (typeof current === 'number' && typeof next === 'number') return sortDirection === 'asc' ? current - next : next - current;
      return sortDirection === 'asc' ? String(current).localeCompare(String(next)) : String(next).localeCompare(String(current));
    });
  }, [sortColumn, sortDirection, campaignPerformanceRows]);

  const changeSort = (column: typeof sortColumn) => {
    if (column === sortColumn) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-4 ambient-page h-screen overflow-hidden flex flex-col p-6"
    >
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Analytics</h1>
          </div>
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <button onClick={() => setAssistantOpen(true)} className="btn-secondary inline-flex items-center gap-2">
              <MessageCircle className="h-4 w-4 shrink-0" /> Ask AI
            </button>
            <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-xs font-bold text-[var(--text-secondary)] shadow-sm">
              <CalendarDays className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <select value={range} onChange={e => setRange(e.target.value)} className="bg-transparent text-xs text-[var(--text-primary)] outline-none cursor-pointer">
                <option>Last 7 days</option>
                <option>Last 14 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 pr-2">
          {/* Row 1: 4 Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -2 }}
                className="premium-card p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{card.label}</p>
                <motion.p
                  key={card.value}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mt-2 text-xl font-extrabold text-[var(--text-primary)] tracking-tight"
                >
                  {card.value}
                </motion.p>
                <div className="mt-1.5 flex items-center gap-1 text-xs">
                  <span className={`font-bold ${card.color}`}>{card.change}</span>
                  <span className="text-[var(--text-muted)] font-medium">vs last period</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Row 2: Delivery Trend & Channel Impact */}
          <div className="grid gap-4 xl:grid-cols-2">
            <CollapsibleCard
              title="Delivery Trend"
              subtitle={`${analyticsLineData.length} data points`}
              isExpanded={row2Expanded === 'delivery'}
              onToggle={() => setRow2Expanded(row2Expanded === 'delivery' ? null : 'delivery')}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  {deliveryTrendLegendItems.map(item => (
                    <div key={item.key} className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsLineData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={value => Number.isInteger(Number(value)) ? String(value) : Number(value).toFixed(0)} />
                      <Tooltip content={<DeliveryTrendTooltip />} cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Line type="monotone" dataKey="Delivered" stroke="var(--chart-cyan)" strokeWidth={3} dot={{ r: 4, strokeWidth: 1, fill: '#FFFFFF' }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Opened" stroke="var(--chart-emerald)" strokeWidth={3} dot={{ r: 4, strokeWidth: 1, fill: '#FFFFFF' }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Clicked" stroke="var(--chart-amber)" strokeWidth={3} dot={{ r: 4, strokeWidth: 1, fill: '#FFFFFF' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CollapsibleCard>

            <CollapsibleCard
              title="Channel Impact"
              subtitle={`${analyticsBarData.length} channels`}
              isExpanded={row2Expanded === 'channel'}
              onToggle={() => setRow2Expanded(row2Expanded === 'channel' ? null : 'channel')}
            >
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsBarData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="channel" tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={value => Number.isInteger(Number(value)) ? String(value) : Number(value).toFixed(0)} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ color: "var(--text-muted)", fontSize: 12, paddingTop: 10 }} />
                    <Bar dataKey="Sent" fill="var(--chart-cyan)" radius={[4, 4, 0, 0]} barSize={16} />
                    <Bar dataKey="Opened" fill="var(--chart-emerald)" radius={[4, 4, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CollapsibleCard>
          </div>

          {/* Row 3: Campaign Performance, System Insights, AI Recommendation */}
          <div className="grid gap-4 xl:grid-cols-3">
            <CollapsibleCard
              title="Campaign Performance"
              subtitle={`${sortedRows.length} campaigns`}
              isExpanded={row3Expanded === 'campaign'}
              onToggle={() => setRow3Expanded(row3Expanded === 'campaign' ? null : 'campaign')}
            >
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="min-w-full text-left text-xs text-[var(--text-secondary)]">
                  <thead className="bg-[var(--bg-card-soft)] sticky top-0">
                    <tr className="border-b border-[var(--border)]">
                      <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] cursor-pointer hover:text-accent select-none" onClick={() => changeSort('campaign')}>Campaign {sortColumn === 'campaign' ? (sortDirection === 'asc' ? '?' : '?') : ''}</th>
                      <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">Segment</th>
                      <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] cursor-pointer hover:text-accent select-none text-right" onClick={() => changeSort('sent')}>Sent {sortColumn === 'sent' ? (sortDirection === 'asc' ? '?' : '?') : ''}</th>
                      <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] cursor-pointer hover:text-accent select-none text-right" onClick={() => changeSort('openRate')}>Open % {sortColumn === 'openRate' ? (sortDirection === 'asc' ? '?' : '?') : ''}</th>
                      <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] cursor-pointer hover:text-accent select-none text-right" onClick={() => changeSort('revenue')}>Revenue {sortColumn === 'revenue' ? (sortDirection === 'asc' ? '?' : '?') : ''}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {sortedRows.map((row, index) => (
                      <tr key={index} className="hover:bg-[var(--bg-card-soft)] transition-colors">
                        <td className="px-3 py-2 font-semibold text-[var(--text-primary)]">{row.campaign}</td>
                        <td className="px-3 py-2">{row.segment}</td>
                        <td className="px-3 py-2 text-right font-medium">{row.sent}</td>
                        <td className="px-3 py-2 text-right font-semibold text-success">{row.openRate}</td>
                        <td className="px-3 py-2 text-right font-bold">?{row.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleCard>

            <CollapsibleCard
              title="System Insights"
              subtitle={`${insightBullets.length} insights`}
              isExpanded={row3Expanded === 'insights'}
              onToggle={() => setRow3Expanded(row3Expanded === 'insights' ? null : 'insights')}
            >
              <div className="space-y-2.5">
                {insightBullets.map((bullet, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-card-soft)] p-2.5 text-xs font-semibold text-[var(--text-primary)] flex items-start gap-2"
                  >
                    <span className="text-accent mt-0.5 flex-shrink-0">?</span>
                    <p className="leading-relaxed">{bullet}</p>
                  </motion.div>
                ))}
              </div>
            </CollapsibleCard>

            <CollapsibleCard
              title="AI Recommendation"
              subtitle="Focus on WhatsApp..."
              isExpanded={row3Expanded === 'ai'}
              onToggle={() => setRow3Expanded(row3Expanded === 'ai' ? null : 'ai')}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[var(--text-muted)] font-bold mb-2">
                  <BarChart3 className="h-4 w-4 text-accent shrink-0" />
                  <p className="text-[10px] uppercase tracking-[0.2em]">AI Intelligence</p>
                </div>
                <p className="text-sm font-extrabold text-[var(--text-primary)] tracking-tight leading-snug">Focus upcoming campaigns on WhatsApp for the best click rates.</p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">AI suggests shifting 18% of budget to WhatsApp for a stronger conversion lift. Multichannel sequencing shows the highest retention yield in active user batches.</p>
              </div>
            </CollapsibleCard>
          </div>
        </div>
      </div>

      <AIChatModal open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </motion.div>
  );
}






