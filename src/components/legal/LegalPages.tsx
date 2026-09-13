import { useEffect, useState } from 'react';
import { legalPages, type LegalPageId } from '../../content/legalPages';
import { legalInfo } from '../../content/legalInfo';
import { closeLegalPage, openLegalPage, parseLegalHash } from '../../utils/legalRoute';
import { Button } from '../ui/Button';

export function LegalDocumentView({ pageId }: { pageId: LegalPageId }) {
  const doc = legalPages[pageId];

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8">
          <Button variant="ghost" onClick={closeLegalPage}>
            ← Retour
          </Button>
        </div>

        <article className="rounded-3xl border border-paper-deep bg-paper-warm/50 p-6 sm:p-10 shadow-sm">
          <header className="mb-8 pb-6 border-b border-paper-deep">
            <p className="text-xs font-semibold uppercase tracking-widest text-copper mb-2">
              {legalInfo.appName}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink">
              {doc.title}
            </h1>
            <p className="text-sm text-ink-muted mt-3 leading-relaxed">{doc.subtitle}</p>
          </header>

          <div className="space-y-8">
            {doc.sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-display text-xl font-semibold text-ink mb-3">
                  {section.title}
                </h2>
                <div className="space-y-3 text-sm leading-relaxed text-ink/90">
                  {section.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                  {section.list && (
                    <ul className="list-disc pl-5 space-y-1.5">
                      {section.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>

          <footer className="mt-10 pt-6 border-t border-paper-deep text-xs text-ink-muted">
            Dernière mise à jour : {legalInfo.lastUpdated} · {legalInfo.siteUrl}
          </footer>
        </article>

        <LegalFooterLinks className="mt-8 justify-center" current={pageId} />
      </div>
    </div>
  );
}

export function LegalFooterLinks({
  className = '',
  current,
}: {
  className?: string;
  current?: LegalPageId;
}) {
  const links: { id: LegalPageId; label: string }[] = [
    { id: 'mentions', label: 'Mentions légales' },
    { id: 'cgu', label: 'CGU' },
    { id: 'confidentialite', label: 'Confidentialité' },
  ];

  return (
    <nav
      className={`flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-muted ${className}`}
      aria-label="Informations légales"
    >
      {links.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => openLegalPage(id)}
          className={[
            'hover:text-copper transition-colors',
            current === id ? 'text-copper font-semibold' : 'underline-offset-2 hover:underline',
          ].join(' ')}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

export function useLegalPage(): LegalPageId | null {
  const [page, setPage] = useState<LegalPageId | null>(() =>
    typeof window !== 'undefined' ? parseLegalHash() : null,
  );

  useEffect(() => {
    const update = () => setPage(parseLegalHash());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);

  return page;
}
