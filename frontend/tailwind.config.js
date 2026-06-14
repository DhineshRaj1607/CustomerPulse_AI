import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px', letterSpacing: '-0.01em' }],
        sm: ['14px', { lineHeight: '20px', letterSpacing: '-0.01em' }],
        base: ['16px', { lineHeight: '24px', letterSpacing: '-0.01em' }],
        lg: ['18px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        xl: ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em' }],
        '3xl': ['30px', { lineHeight: '36px', letterSpacing: '-0.02em' }],
        '4xl': ['36px', { lineHeight: '44px', letterSpacing: '-0.02em' }],
      },
      colors: {
        'bg-base': '#F8FAFC',
        'bg-card': '#FFFFFF',
        'bg-section': '#F1F5F9',
        'bg-hover': 'rgba(37,99,235,0.06)',
        accent: '#2563EB',
        teal: '#14B8A6',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        'text-primary': '#0F172A',
        'text-secondary': '#475569',
        'text-muted': '#94A3B8',
      },
      boxShadow: {
        card: '0 8px 32px rgba(37, 99, 235, 0.06), 0 2px 8px rgba(15, 23, 42, 0.04)',
        premium: '0 12px 40px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.04)',
      },
      borderRadius: {
        card: '16px',
        btn: '10px',
      },
      animation: {
        pulsebadge: 'pulse-live 2s ease-in-out infinite',
        slidefade: 'slide-up-fade 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.5s infinite',
        'gradient-shift': 'gradientShift 6s ease infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'float-up': 'floatUp 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'count-up': 'countUp 0.6s cubic-bezier(0.22,1,0.36,1) both',
        'row-slide': 'rowSlide 0.4s ease both',
        'badge-pop': 'badgePop 0.4s cubic-bezier(0.22,1,0.36,1) both',
        'live-pulse': 'livePulse 1.5s ease-in-out infinite',
        'neon-border': 'neonBorder 3s ease-in-out infinite',
      },
      keyframes: {
        'slide-up-fade': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-live': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(0.92)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(99,102,241,0.4)' },
          '50%': { boxShadow: '0 0 28px rgba(99,102,241,0.9), 0 0 50px rgba(99,102,241,0.3)' },
        },
        floatUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        countUp: {
          from: { opacity: '0', transform: 'translateY(10px) scale(0.95)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        rowSlide: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        badgePop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '70%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        livePulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.85)' },
        },
        neonBorder: {
          '0%, 100%': { borderColor: 'rgba(99,102,241,0.4)' },
          '50%': { borderColor: 'rgba(99,102,241,1)', boxShadow: '0 0 16px rgba(99,102,241,0.5)' },
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
