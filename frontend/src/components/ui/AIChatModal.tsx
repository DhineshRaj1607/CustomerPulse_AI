import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { getCustomers, getCampaigns } from '../../services/api';
import Modal from './Modal';

const suggestions = [
  'Who are my top spenders this month?',
  'Draft a re-engagement message for lapsed customers',
  'Which campaign had the best ROI?',
];

export default function AIChatModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);

  const lastMessage = useMemo(() => messages[messages.length - 1], [messages]);

  useEffect(() => {
    if (!open) return;
    if (messages.length === 0) {
      setMessages([
        { role: 'assistant', text: 'Hi! Ask anything about your customers or campaigns.' },
      ]);
    }
  }, [open, messages.length]);

  const getAssistantReply = async (input: string): Promise<string> => {
    const lower = input.toLowerCase();

    if (lower.includes('top spenders') || lower.includes('spenders')) {
      try {
        const customers = await getCustomers();
        const sorted = customers
          .sort((a, b) => (b.totalSpend || 0) - (a.totalSpend || 0))
          .slice(0, 3);

        if (sorted.length === 0) {
          return 'No customers found in your database yet.';
        }

        const spendersList = sorted
          .map((c, i) => `${i + 1}. ${c.name} - ₹${(c.totalSpend || 0).toLocaleString()}`)
          .join('\n');

        return `Your top 3 spenders this month are:\n${spendersList}\n\nConsider reaching out with exclusive offers to maintain their loyalty.`;
      } catch (err) {
        return 'Unable to fetch customer data. Please try again.';
      }
    }

    if (lower.includes('roi') || lower.includes('return on investment')) {
      try {
        const campaigns = await getCampaigns();
        if (campaigns.length === 0) {
          return 'No campaigns found yet. Launch some campaigns to see ROI metrics.';
        }

        const completed = campaigns.filter(c => c.status === 'Completed');
        if (completed.length === 0) {
          return 'No completed campaigns yet. ROI will be available once campaigns finish.';
        }

        const bestCampaign = completed.reduce((best, current) => {
          const bestReach = best.sentCount || 0;
          const currentReach = current.sentCount || 0;
          return currentReach > bestReach ? current : best;
        });

        return `Your best performing campaign is "${bestCampaign.campaignName}" with ${bestCampaign.sentCount || 0} messages sent to segment "${bestCampaign.segment}". Multi-channel campaigns combining Email and WhatsApp show the strongest engagement.`;
      } catch (err) {
        return 'Unable to fetch campaign data. Please try again.';
      }
    }

    if (lower.includes('re-engagement')) {
      return 'A re-engagement campaign should feature a clear offer, personalized messaging with {promo_code}, and a strong call to action for lapsed customers. Target customers who haven\'t purchased in 45+ days for best results.';
    }

    return 'Here\'s a quick insight: focus on the customers and campaigns that are already showing the strongest engagement signals.';
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setDraft('');
    setLoading(true);

    try {
      const reply = await getAssistantReply(text);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: reply,
        },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Sorry, I encountered an error processing your request. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="AI Assistant">
      <div className="space-y-4 ambient-section">
        <div className="max-h-[320px] space-y-3 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card-soft)] p-4 ambient-panel">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-xl border p-4 ${
                message.role === 'assistant'
                  ? 'bg-accent/5 border-accent/20 text-[var(--text-primary)]'
                  : 'bg-white border-[var(--border)] text-[var(--text-primary)]'
              }`}
            >
              <p className={`text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-1 ${message.role === 'assistant' ? 'text-accent' : 'text-[var(--text-muted)]'}`}>
                {message.role === 'assistant' && <Sparkles className="h-3 w-3" />}
                {message.role === 'assistant' ? 'CustomerPulse AI' : 'You'}
              </p>
              <p className="mt-1.5 text-xs font-medium leading-relaxed whitespace-pre-wrap">{message.text}</p>
            </motion.div>
          ))}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-accent/20 bg-accent/5 p-4"
            >
              <p className="text-[9px] uppercase tracking-wider font-extrabold text-accent flex items-center gap-1">
                <Sparkles className="h-3 w-3 ai-pulse" />
                CustomerPulse AI
              </p>
              <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
                <span className="inline-flex gap-1">
                  Thinking
                  <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}>.</motion.span>
                  <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}>.</motion.span>
                  <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}>.</motion.span>
                </span>
              </p>
            </motion.div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map(item => (
            <button
              key={item}
              onClick={() => setDraft(item)}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs text-[var(--text-secondary)] transition duration-200 hover:border-accent hover:text-accent active:scale-95 shadow-sm"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Ask anything about your customers or campaigns..."
            className="flex-1 rounded-xl border border-[var(--border)] bg-white px-3.5 py-2 text-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage} className="btn-primary">Send</button>
        </div>
      </div>
    </Modal>
  );
}
