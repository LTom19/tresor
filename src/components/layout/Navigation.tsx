import { motion } from 'framer-motion';
import type { TabId } from '../../types';

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'comptes', label: 'Comptes', icon: '◈' },
  { id: 'calendrier', label: 'Calendrier', icon: '▦' },
  { id: 'recap', label: 'Récapitulatif', icon: '◎' },
];

interface NavigationProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  alertCount: number;
}

export function Navigation({ active, onChange, alertCount }: NavigationProps) {
  return (
    <nav
      aria-label="Onglets"
      className="flex items-center gap-1 p-1.5 w-full sm:w-auto bg-paper-warm/80 backdrop-blur-md rounded-2xl border border-paper-deep shadow-sm"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={[
              'relative flex flex-1 sm:flex-none items-center justify-center gap-1.5 sm:gap-2',
              'px-2 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors',
              isActive ? 'text-ink' : 'text-ink-muted hover:text-ink',
            ].join(' ')}
          >
            {isActive && (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 bg-paper rounded-xl shadow-sm border border-paper-deep"
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              />
            )}
            <span className="relative z-10" aria-hidden>
              {tab.icon}
            </span>
            <span className="relative z-10">
              <span className="sm:hidden">{tab.id === 'recap' ? 'Récap' : tab.label}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </span>
            {tab.id === 'recap' && alertCount > 0 && (
              <span className="relative z-10 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-wine text-white text-[10px] font-bold">
                {alertCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
