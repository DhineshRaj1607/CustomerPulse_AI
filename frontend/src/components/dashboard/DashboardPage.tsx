import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Filter, Send, TrendingUp, Users } from 'lucide-react';
import { getAnalytics, getCampaigns, Campaign } from '../../services/api';

const statusMap: Record<string, string> = {
  Completed: 'bg-success/10 text-success border-success/20',
  Sending: 'bg-warning/10 text-warning border-warning/20 animate-pulsebadge',
  Scheduled: 'bg-warning/10 text-warning border-warning/20',
  Running: 'bg-accent/10 text-accent border-accent/20',
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export default function DashboardPage() {
  const [stats, setStats] = useState([
    { label: 'Total Customers', value: '0', icon: 'Users', accent: 'text-[var(--text-primary)]' },
    { label: 'Active Segments', value: '0', icon: 'Filter', accent: 'text-[var(--text-primary)]' },
    { label: 'Campaigns Sent', value: '0', icon: 'Send', accent: 'text-[var(--text-primary)]' },
    { label: 'Avg Open Rate', value: '0%', icon: 'TrendingUp', accent: 'text-accent' },
  ]);
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    Promise.all([getAnalytics(), getCampaigns()])
      .then(([analytics, campaigns]) => {
        if (ignore) return;
        const a = analytics ?? { totalCustomers: 0, activeSegments: 0, campaignsSent: 0, avgOpenRate: 0 };
        const c = campaigns ?? [];
        setStats([
          { label: 'Total Customers', value: a.totalCustomers.toLocaleString(), icon: 'Users', accent: 'text-[var(--text-primary)]' },
          { label: 'Active Segments', value: a.activeSegments.toLocaleString(), icon: 'Filter', accent: 'text-[var(--text-primary)]' },
          { label: 'Campaigns Sent', value: a.campaignsSent.toLocaleString(), icon: 'Send', accent: 'text-[var(--text-primary)]' },
          { label: 'Avg Open Rate', value: `${a.avgOpenRate.toFixed(1)}%`, icon: 'TrendingUp', accent: 'text-accent' },
        ]);
        setRecentCampaigns(c.slice(0, 5));
      })
      .catch(err => {
        if (!ignore) setError(err.message || 'Failed to load dashboard data');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const campaignFeed = recentCampaigns.map((campaign, index) => ({
    id: campaign._id ?? `${campaign.campaignName}-${index}`,
    title: campaign.campaignName,
    segment: campaign.segment,
    status: campaign.status,
    when: campaign.scheduledDate
      ? new Date(campaign.scheduledDate).toLocaleDateString()
      : campaign.createdAt
      ? new Date(campaign.createdAt).toLocaleDateString()
      : 'Now',
  }));

  // ref and observer to trigger animations only when cards enter viewport
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [cardsInView, setCardsInView] = useState(false);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setCardsInView(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const KpiCard = ({ stat, idx }: { stat: any; idx: number }) => {
    const cardStyles = stat.label === 'Total Customers'
      ? { borderClass: 'kpi-card-border-blue', iconClass: 'kpi-icon-blue', Icon: Users }
      : stat.label === 'Active Segments'
        ? { borderClass: 'kpi-card-border-emerald', iconClass: 'kpi-icon-emerald', Icon: Filter }
        : stat.label === 'Campaigns Sent'
          ? { borderClass: 'kpi-card-border-indigo', iconClass: 'kpi-icon-indigo', Icon: Send }
          : { borderClass: 'kpi-card-border-amber', iconClass: 'kpi-icon-amber', Icon: TrendingUp };
    const Icon = cardStyles.Icon;
    const cardRef = useRef<HTMLDivElement | null>(null);
    const iconRef = useRef<SVGElement | null>(null);
    const countRef = useRef<HTMLSpanElement | null>(null);
    const animated = useRef(false);

    const startCountUp = useCallback(() => {
      if (animated.current) return;
      animated.current = true;
      const raw = String(stat.value || '0');
      const isPct = raw.trim().endsWith('%');
      const numeric = parseFloat(raw.replace(/[^0-9.\-]/g, '')) || 0;
      const duration = 900; // ms
      const start = performance.now();

      function step(now: number) {
        const t = Math.min(1, (now - start) / duration);
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // smooth ease
        const current = numeric * eased;
        if (countRef.current) {
          if (isPct) {
            countRef.current.textContent = `${(current).toFixed(1)}%`;
          } else {
            countRef.current.textContent = Math.round(current).toLocaleString();
          }
        }
        if (t < 1) requestAnimationFrame(step);
        else {
          // final exact value (preserve source formatting)
          if (countRef.current) countRef.current.textContent = stat.value;
        }
      }

      requestAnimationFrame(step);
    }, [stat.value]);

    useEffect(() => {
      const el = cardRef.current;
      if (!el) return;

      let raf: number | null = null;
      let hovering = false;

      const onMove = (e: MouseEvent) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const rx = (dy / rect.height) * -6; // rotateX
        const ry = (dx / rect.width) * 8; // rotateY
        const tx = (dx / rect.width) * 6; // translateX subtle
        const ty = (dy / rect.height) * 4; // translateY subtle

        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          if (el) el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(${tx}px, ${ty}px, 6px) scale(${hovering ? 1.02 : 1})`;
          if (iconRef.current) iconRef.current.style.transform = `translateZ(6px) scale(${hovering ? 1.06 : 1}) rotate(${hovering ? 6 : 0}deg)`;
        });
      };

      const onEnter = () => {
        hovering = true;
        if (el) el.style.transition = 'box-shadow 250ms ease, transform 250ms cubic-bezier(0.2,0.8,0.2,1), border-color 250ms ease';
        el.classList.add('kpi-hover');
        if (iconRef.current) iconRef.current.style.transition = 'transform 250ms ease';
        // start countup when hovered or when visible
        startCountUp();
      };

      const onLeave = () => {
        hovering = false;
        if (raf) cancelAnimationFrame(raf);
        if (el) el.style.transform = 'none';
        el.classList.remove('kpi-hover');
        if (iconRef.current) iconRef.current.style.transform = '';
      };

      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);

      return () => {
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
        if (raf) cancelAnimationFrame(raf);
      };
    }, [startCountUp]);

    // if cardsInView start countup once
    useEffect(() => {
      if (cardsInView) startCountUp();
    }, [cardsInView, startCountUp]);

    const hasDelta = stat.delta !== undefined && stat.delta !== null;
    const deltaValue = typeof stat.delta === 'number' ? Math.round(stat.delta) : stat.delta;
    const deltaText = hasDelta
      ? typeof stat.delta === 'number'
        ? `${stat.delta >= 0 ? '↑' : '↓'} ${Math.abs(stat.delta)} this week`
        : String(stat.delta)
      : '↑ Active';
    const deltaColorClass = hasDelta
      ? (typeof stat.delta === 'number'
          ? stat.delta > 0
            ? 'text-[#16a34a]'
            : stat.delta < 0
              ? 'text-[#dc2626]'
              : 'text-[var(--text-muted)]'
          : 'text-[var(--text-muted)]')
      : 'text-[var(--text-success)]';

    return (
      <motion.div
        ref={cardRef}
        key={stat.label}
        custom={idx}
        initial="hidden"
        animate={cardsInView ? 'visible' : 'hidden'}
        variants={fadeUp}
        className={`premium-card overflow-hidden p-6 kpi-card ${cardStyles.borderClass}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--text-muted)] font-semibold">{stat.label}</p>
            <p className={`mt-3 text-3xl font-bold tracking-tight ${stat.accent}`}>
              <span ref={countRef as any}>{cardsInView ? '0' : stat.value}</span>
            </p>
            <p className={`mt-1 text-xs font-semibold ${deltaColorClass}`}>{deltaText}</p>
          </div>
          <div className={`rounded-xl p-3 kpi-icon ${cardStyles.iconClass}`} ref={iconRef as any}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 ambient-page"
    >
      <div ref={gridRef} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 ambient-section">
        {stats.map((stat, idx) => (
          <KpiCard stat={stat} idx={idx} key={stat.label} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px] ambient-section">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="premium-card p-6"
        >
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Recent Campaigns</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)] font-medium">Latest campaign performance from your brand.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="table-sticky min-w-full text-left text-sm text-[var(--text-secondary)]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] w-[40%]">Name</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">Segment</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">Sent</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">Open Rate</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">Status</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6">
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="skeleton h-10 w-full" />
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-danger font-medium">{error}</td>
                  </tr>
                ) : recentCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-[var(--text-muted)]">No campaigns available.</td>
                  </tr>
                ) : (
                  recentCampaigns.map((row, index) => (
                    <motion.tr
                      key={row._id ?? index}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.06, duration: 0.3 }}
                      className="hover:bg-[var(--bg-card-soft)] transition-colors group"
                    >
                      <td className="px-4 py-3.5 font-semibold text-[var(--text-primary)] group-hover:text-accent transition-colors">{row.campaignName}</td>
                      <td className="px-4 py-3.5">{row.segment}</td>
                      <td className="px-4 py-3.5 font-medium">{(row.estimatedReach ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3.5 font-medium">{row.status === 'Completed' ? '38%' : row.status === 'Running' ? '22%' : '0%'}</td>
                      <td className="px-4 py-3.5">
                        {row.status === 'Completed' ? (
                          <span className="status-badge completed">
                             {row.status}
                          </span>
                        ) : (
                          <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold tracking-wide border ${statusMap[row.status] || 'bg-[var(--bg-card-soft)] text-[var(--text-muted)] border-[var(--border)]'}`}>
                            {row.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[var(--text-muted)]">{new Date(row.scheduledDate ?? row.createdAt ?? '').toLocaleDateString()}</td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="premium-card p-5"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-bold">Live Channel Feed</p>
              <h2 className="mt-1.5 text-base font-bold text-[var(--text-primary)] tracking-tight">Campaign Pulse</h2>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-success/10 border border-success/25 px-2.5 py-1 text-xs text-success font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              Live
            </div>
          </div>
          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {campaignFeed.slice(0, 12).map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-card-soft)] p-3 hover:border-accent/20 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-[10px] font-bold text-accent border border-accent/15">
                    {event.status.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
                      <span className={`rounded px-1.5 py-0.5 border ${statusMap[event.status] || 'bg-[var(--bg-card-soft)] text-[var(--text-muted)] border-[var(--border)]'}`}>{event.status}</span>
                      <span className="truncate font-semibold text-[var(--text-secondary)]">{event.segment}</span>
                    </div>
                    <p className="truncate text-xs font-semibold text-[var(--text-primary)] mt-1.5">{event.title}</p>
                  </div>
                  <p className="whitespace-nowrap text-[10px] text-[var(--text-muted)] self-start font-medium">{event.when}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
