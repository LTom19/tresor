import type { LegalPageId } from '../content/legalPages';

export function parseLegalHash(): LegalPageId | null {
  const match = window.location.hash.match(/^#\/legal\/(mentions|cgu|confidentialite)$/);
  return match ? (match[1] as LegalPageId) : null;
}

export function openLegalPage(page: LegalPageId) {
  window.location.hash = `#/legal/${page}`;
}

export function closeLegalPage() {
  if (window.location.hash.startsWith('#/legal/')) {
    history.pushState(null, '', window.location.pathname + window.location.search);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
}
