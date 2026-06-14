import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Send, Sparkles } from 'lucide-react';
import { getCampaigns, getSegments, createCampaign, sendEmailCampaign, Campaign, Segment } from '../../services/api';
import { useToast } from '../ui/Toast';

const channelOptions = ['WhatsApp', 'SMS', 'Email'] as const;
const scheduleOptions = ['Send Now', 'Schedule Later'] as const;
const toneOptions = ['Friendly', 'Urgent', 'Exclusive', 'Informative'] as const;

export default function CampaignsPage() {
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [campaignName, setCampaignName] = useState('Weekend Drop Reminder');
  const [channels, setChannels] = useState<string[]>(['WhatsApp', 'Email']);
  const [scheduleOption, setScheduleOption] = useState<(typeof scheduleOptions)[number]>('Send Now');
  const [scheduledAt, setScheduledAt] = useState('2026-06-11T10:00');
  const [message, setMessage] = useState('Hi {first_name}, check our latest collection and enjoy exclusive access today.');
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [campaignGoal, setCampaignGoal] = useState('Bring back inactive customers');
  const [aiTone, setAiTone] = useState<(typeof toneOptions)[number]>('Friendly');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState('');
  const [campaignCards, setCampaignCards] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState('');
  const [segmentsLoading, setSegmentsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSegmentData = segments.find(segment => segment.name === selectedSegment);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const toggleChannel = (channel: string) => {
    setChannels(prev => (prev.includes(channel) ? prev.filter(item => item !== channel) : [...prev, channel]));
  };

  const openDrawer = () => {
    setDrawerOpen(true);
    setStep(1);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setAiPanelOpen(false);
  };

  const nextStep = () => setStep(prev => Math.min(3, prev + 1));
  const prevStep = () => setStep(prev => Math.max(1, prev - 1));

  const generateAiDraft = () => {
    setAiLoading(true);
    setAiDraft('');
    window.setTimeout(() => {
      setAiLoading(false);
      setAiDraft('Hi {first_name},\n\nWe miss you!\n\nEnjoy 20% OFF on your next purchase.\nUse code WELCOME20.\n\nLimited time offer.');
    }, 1500);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [campaigns, segmentsData] = await Promise.all([getCampaigns(), getSegments()]);
      setCampaignCards(campaigns);
      setSegments(segmentsData);
      setSelectedSegment(prev => prev || segmentsData[0]?.name || '');
      setSegmentsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setSegmentsLoading(true);
      try {
        const [campaigns, segmentsData] = await Promise.all([getCampaigns(), getSegments()]);
        if (ignore) return;
        setCampaignCards(campaigns);
        setSegments(segmentsData);
        setSelectedSegment(prev => prev || segmentsData[0]?.name || '');
        setSegmentsLoading(false);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : 'Failed to load campaign data');
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchData();

    // Listen for global segment updates
    const onSegmentsUpdated = async () => {
      try {
        setSegmentsLoading(true);
        const segmentsData = await getSegments();
        if (!ignore) {
          setSegments(segmentsData);
          toast('success', 'Segments updated');
        }
      } catch (e) {
        // ignore
      } finally {
        setSegmentsLoading(false);
      }
    };

    window.addEventListener('segments:updated', onSegmentsUpdated as EventListener);

    return () => {
      ignore = true;
      window.removeEventListener('segments:updated', onSegmentsUpdated as EventListener);
    };
  }, []);

  const useAiMessage = () => {
    if (aiDraft) {
      setMessage(aiDraft);
      setAiPanelOpen(false);
    }
  };

  const handleSendClick = () => {
    if (!campaignName.trim() || !selectedSegment || channels.length === 0) {
      toast('error', 'Please complete the campaign details first.');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmAndSendCampaign = async () => {
    const payload = {
      campaignName,
      segment: selectedSegment,
      channels,
      message,
      estimatedReach: selectedSegmentData?.estimatedReach ?? 0,
      status: scheduleOption === 'Schedule Later' ? 'Scheduled' : 'Sending',
      scheduledDate: scheduleOption === 'Schedule Later' ? scheduledAt : new Date().toISOString(),
    };

    setSending(true);
    setShowConfirmModal(false);
    try {
      if (channels.includes('Email')) {
        const result = await sendEmailCampaign({
          campaignName,
          message,
          segment: selectedSegment,
        });

        toast('success', `Campaign sent successfully to ${result.sent} customers`);
      } else {
        await createCampaign(payload);
        toast('success', '✅ Campaign queued successfully. Channel service is processing messages.');
      }
      await loadData();
      closeDrawer();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to send campaign.');
    } finally {
      setSending(false);
    }
  };

  const sendCampaign = async () => {
    if (!campaignName.trim() || !selectedSegment || channels.length === 0) {
      toast('error', 'Please complete the campaign details first.');
      return;
    }

    const payload = {
      campaignName,
      segment: selectedSegment,
      channels,
      message,
      estimatedReach: selectedSegmentData?.estimatedReach ?? 0,
      status: scheduleOption === 'Schedule Later' ? 'Scheduled' : 'Sending',
      scheduledDate: scheduleOption === 'Schedule Later' ? scheduledAt : new Date().toISOString(),
    };

    setSending(true);
    try {
      if (channels.includes('Email')) {
        const result = await sendEmailCampaign({
          campaignName,
          message,
          segment: selectedSegment,
        });

        toast('success', `Campaign sent successfully to ${result.sent} customers`);
      } else {
        await createCampaign(payload);
        toast('success', '✅ Campaign queued successfully. Channel service is processing messages.');
      }
      await loadData();
      closeDrawer();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to send campaign.');
    } finally {
      setSending(false);
    }
  };

  const inputClass = 'w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 ambient-page">
      <div className="premium-card p-6 ambient-section">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Campaigns</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Design, draft, and launch campaigns in one workflow.</p>
          </div>
          <button onClick={openDrawer} className="btn-primary inline-flex items-center gap-2">
            <Send className="h-4 w-4" /> New Campaign
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2 ambient-section">
        {loading ? (
          <div className="col-span-full premium-card p-6">
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="skeleton h-32 w-full" />)}
            </div>
          </div>
        ) : error ? (
          <div className="col-span-full premium-card p-6">
            <p className="text-xs text-danger font-semibold">{error}</p>
          </div>
        ) : campaignCards.length === 0 ? (
          <div className="col-span-full premium-card p-6">
            <p className="text-sm text-[var(--text-secondary)]">No campaigns found. Create one to get started.</p>
          </div>
        ) : (
          campaignCards.slice(0, 4).map((card, cardIndex) => {
            const channels = Array.isArray(card.channels) ? card.channels : [];
            const deliveryPercent = card.status === 'Completed' ? 100 : card.status === 'Sending' ? 55 : 0;
            const dateLabel = card.scheduledDate
              ? new Date(card.scheduledDate).toLocaleDateString()
              : card.createdAt
              ? new Date(card.createdAt).toLocaleDateString()
              : 'Today';

            return (
              <motion.div
                key={card._id ?? `${card.campaignName}-${dateLabel}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: cardIndex * 0.08 }}
                whileHover={{ y: -4 }}
                className="premium-card p-6 ambient-panel"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{card.status}</p>
                    <h3 className="mt-1 text-lg font-bold text-[var(--text-primary)] tracking-tight">{card.campaignName}</h3>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{card.segment}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-card-soft)] px-2.5 py-1 text-[10px] font-bold text-[var(--text-muted)] border border-[var(--border)] uppercase tracking-wider">{dateLabel}</div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {channels.map(channel => {
                    const pillClass = channel === 'WhatsApp'
                      ? 'bg-teal/10 text-teal border-teal/25'
                      : channel === 'SMS'
                      ? 'bg-accent/10 text-accent border-accent/25'
                      : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/25';
                    return (
                      <span key={channel} className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${pillClass}`}>{channel}</span>
                    );
                  })}
                </div>
                <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card-soft)] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Queue Status</p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">{card.status}</p>
                </div>
                <div className="mt-4">
                  <div className="h-2 rounded-full bg-[var(--bg-card-soft)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${deliveryPercent}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="h-2 rounded-full bg-gradient-to-r from-accent to-teal"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <span>Delivery</span>
                    <span>{deliveryPercent}%</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex bg-black/30 backdrop-blur-md"
          >
            <motion.div
              initial={{ x: 460 }}
              animate={{ x: 0 }}
              exit={{ x: 460 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="ml-auto h-full w-full max-w-[460px] overflow-y-auto bg-white border-l border-[var(--border)] p-6 shadow-premium flex flex-col"
            >
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">New Campaign</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--text-primary)]">Create your campaign</h2>
              </div>
              <button onClick={closeDrawer} className="btn-secondary !p-2 !min-w-0">✕</button>
            </div>

            <div className="space-y-5 flex-1">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card-soft)] p-4 space-y-5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)] pb-2.5">
                  <span className="text-accent">Step {step} of 3</span>
                  <span>{step === 1 ? 'Basics' : step === 2 ? 'Message Composer' : 'Review & Send'}</span>
                </div>

                {step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Campaign Name</label>
                      <input value={campaignName} onChange={e => setCampaignName(e.target.value)} className={inputClass} placeholder="Weekend Special Drop" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Segment
                        {segmentsLoading ? (
                          <span className="ml-2 inline-block h-2.5 w-2.5 animate-spin rounded-full border-[2px] border-t-transparent border-accent/60" />
                        ) : null}
                      </label>
                      <select
                        value={selectedSegment}
                        onChange={e => setSelectedSegment(e.target.value)}
                        className={inputClass + ' cursor-pointer'}
                      >
                        <option value="" disabled>{segmentsLoading ? 'Loading segments...' : 'Select Target Audience'}</option>
                        {segmentsLoading ? null : segments.length === 0 ? (
                          <option value="" disabled>No segments available</option>
                        ) : (
                          segments.map(segment => (
                            <option key={segment._id ?? segment.name} value={segment.name}>{segment.name}</option>
                          ))
                        )}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <p className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Channels</p>
                      <div className="flex flex-wrap gap-2">
                        {channelOptions.map(channel => (
                          <button
                            key={channel}
                            type="button"
                            onClick={() => toggleChannel(channel)}
                            className={`rounded-xl px-4 py-2 text-xs font-bold transition border ${channels.includes(channel) ? 'bg-accent text-white border-accent shadow-sm' : 'bg-white text-[var(--text-secondary)] border-[var(--border)] hover:border-accent/30'}`}
                          >
                            {channel}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Schedule Settings</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {scheduleOptions.map(option => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setScheduleOption(option)}
                            className={`rounded-xl border px-3.5 py-2.5 text-left text-xs font-bold transition ${scheduleOption === option ? 'border-accent/40 bg-accent/10 text-accent' : 'border-[var(--border)] bg-white text-[var(--text-primary)] hover:border-accent/30'}`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                    {scheduleOption === 'Schedule Later' ? (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Pick date & time</label>
                        <input
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={e => setScheduledAt(e.target.value)}
                          className={inputClass + ' cursor-pointer'}
                        />
                      </div>
                    ) : null}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Message Template</label>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        rows={5}
                        className={inputClass + ' leading-relaxed'}
                      />
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-1.5">
                        <span>{message.length} characters</span>
                        <span>Personalization chips</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['{first_name}', '{promo_code}', '{last_purchase_date}'].map(chip => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setMessage(prev => `${prev}${chip}`)}
                          className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs text-[var(--text-primary)] transition hover:border-accent hover:text-accent active:scale-95"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card-soft)] p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-2.5">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-accent">AI Message Composer</p>
                          <p className="text-[10px] text-[var(--text-secondary)]">Generate targeted templates instantly.</p>
                        </div>
                        <button type="button" onClick={() => setAiPanelOpen(prev => !prev)} className="btn-primary !text-xs !py-1.5 !px-3 inline-flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 shrink-0" /> Draft With AI
                        </button>
                      </div>
                      {aiPanelOpen ? (
                        <div className="space-y-4 pt-1 animate-slidefade">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Campaign Goal</label>
                            <input
                              value={campaignGoal}
                              onChange={e => setCampaignGoal(e.target.value)}
                              placeholder="Bring back inactive customers"
                              className={inputClass}
                            />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2 items-end">
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Tone</label>
                              <select
                                value={aiTone}
                                onChange={e => setAiTone(e.target.value as typeof aiTone)}
                                className={inputClass + ' cursor-pointer'}
                              >
                                {toneOptions.map(tone => (
                                  <option key={tone} value={tone}>{tone}</option>
                                ))}
                              </select>
                            </div>
                              <button type="button" onClick={generateAiDraft} className="btn-primary">Generate</button>
                          </div>
                          {aiLoading ? (
                            <div className="rounded-xl border border-[var(--border)] bg-white p-4 text-center text-xs text-[var(--text-secondary)] space-y-2.5">
                              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/15">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-accent" />
                              </div>
                              <p>Generating draft...</p>
                            </div>
                          ) : null}
                          {aiDraft ? (
                            <div className="rounded-xl border border-[var(--border)] bg-white p-4 space-y-3">
                              <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-[var(--text-primary)] font-mono font-medium">{aiDraft}</pre>
                              <div className="flex gap-2 border-t border-[var(--border)] pt-3">
                                <button type="button" onClick={generateAiDraft} className="btn-secondary !text-[10px] !py-1.5">Regenerate</button>
                                <button type="button" onClick={useAiMessage} className="btn-primary !text-[10px] !py-1.5">Use Draft</button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-[var(--border)] bg-white p-4 space-y-3">
                      <div className="grid gap-2.5 text-xs">
                        <div className="flex flex-col gap-1 border-b border-[var(--border)] pb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Campaign Name</span>
                          <span className="text-[var(--text-primary)] font-semibold">{campaignName || 'Untitled Campaign'}</span>
                        </div>
                        <div className="flex flex-col gap-1 border-b border-[var(--border)] pb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Segment Target</span>
                          <span className="text-[var(--text-primary)] font-semibold">{selectedSegment}</span>
                        </div>
                        <div className="flex flex-col gap-1 border-b border-[var(--border)] pb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Delivery Channels</span>
                          <span className="text-[var(--text-primary)] font-semibold">{channels.join(', ') || 'None selected'}</span>
                        </div>
                        <div className="flex flex-col gap-1 border-b border-[var(--border)] pb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Schedule</span>
                          <span className="text-[var(--text-primary)] font-semibold">{scheduleOption === 'Send Now' ? 'Send now' : `Scheduled for ${new Date(scheduledAt).toLocaleString()}`}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Message Preview</span>
                          <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-[var(--text-primary)] font-mono mt-1">{message || 'No message entered yet.'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card-soft)] p-4 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Estimated Reach</p>
                        <p className="mt-1 text-lg font-bold text-[var(--text-primary)] tracking-tight">{selectedSegmentData?.estimatedReach?.toLocaleString() ?? '0'} Customers</p>
                      </div>
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--border)]">
                <button onClick={prevStep} disabled={step === 1} className="btn-secondary disabled:opacity-35 disabled:cursor-not-allowed">Back</button>
                {step < 3 ? (
                  <button onClick={nextStep} className="btn-primary">Continue</button>
                ) : (
                  <button onClick={handleSendClick} disabled={!selectedSegment || sending} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                    {sending ? 'Sending...' : 'Send Campaign'}
                  </button>
                )}
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-premium max-w-sm mx-4 w-full"
            >
            <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Confirm Campaign Send</h3>
            <p className="mt-1.5 text-sm text-[var(--text-secondary)] leading-relaxed">You're about to send this campaign to your selected segment. This action cannot be undone.</p>

            <div className="mt-4 space-y-2 rounded-xl bg-[var(--bg-card-soft)] border border-[var(--border)] p-4 text-xs font-medium">
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span className="text-[var(--text-muted)] font-bold">Campaign Name:</span>
                <span className="text-[var(--text-primary)] font-semibold">{campaignName}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span className="text-[var(--text-muted)] font-bold">Target Segment:</span>
                <span className="text-[var(--text-primary)] font-semibold">{selectedSegment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)] font-bold">Channels:</span>
                <span className="text-[var(--text-primary)] font-semibold">{channels.join(', ')}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button onClick={() => setShowConfirmModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={confirmAndSendCampaign} disabled={sending} className="btn-primary flex-1 disabled:opacity-50">
                {sending ? 'Sending...' : 'Confirm Send'}
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
