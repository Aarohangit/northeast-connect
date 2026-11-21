const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

export const Icon = {
  Back: (p) => <svg {...base} {...p}><path d="M15 18l-6-6 6-6" /></svg>,
  Chevron: (p) => <svg {...base} {...p}><path d="M9 18l6-6-6-6" /></svg>,
  Shield: (p) => <svg {...base} {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></svg>,
  Tent: (p) => <svg {...base} {...p}><path d="M3 20L12 4l9 16H3z" /><path d="M12 20v-6l-3 6M12 14l3 6" /></svg>,
  Phone: (p) => <svg {...base} {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" /></svg>,
  Pin: (p) => <svg {...base} {...p}><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>,
  Check: (p) => <svg {...base} {...p}><path d="M5 12l5 5 9-10" /></svg>,
  Clock: (p) => <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  Alert: (p) => <svg {...base} {...p}><path d="M12 3l10 18H2L12 3z" /><path d="M12 10v4M12 17.5v.5" /></svg>,
  Mic: (p) => <svg {...base} {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" /></svg>,
  Signal: (p) => <svg {...base} {...p}><path d="M4 20v-3M9 20v-7M14 20v-11M19 20V5" /></svg>,
  NoSignal: (p) => <svg {...base} {...p}><path d="M4 20v-3M9 20v-7M14 20v-4M3 3l18 18" /></svg>,
  Water: (p) => <svg {...base} {...p}><path d="M2 16c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M2 20c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" /><path d="M12 3s-4 4.5-4 7.5a4 4 0 008 0C16 7.5 12 3 12 3z" /></svg>,
  Medical: (p) => <svg {...base} {...p}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M12 8v8M8 12h8" /></svg>,
  Food: (p) => <svg {...base} {...p}><path d="M4 11h16a8 8 0 01-16 0zM8 4c0 2 2 2 2 4M12 4c0 2 2 2 2 4" /></svg>,
  Person: (p) => <svg {...base} {...p}><circle cx="12" cy="6" r="3" /><path d="M12 9v6M8 21l2-6h4l2 6M7 12h10" /></svg>,
  Child: (p) => <svg {...base} {...p}><circle cx="12" cy="7" r="3.5" /><path d="M7 21v-3a5 5 0 0110 0v3" /></svg>,
  Help: (p) => <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 2-2.5 3.5M12 17v.5" /></svg>,
  Message: (p) => <svg {...base} {...p}><path d="M4 5h16v11H8l-4 4V5z" /></svg>,
  Refresh: (p) => <svg {...base} {...p}><path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" /></svg>,
  Landslide: (p) => <svg {...base} {...p}><path d="M3 20l6-11 4 6 2-3 6 8H3z" /><circle cx="16" cy="16.5" r="1" /><circle cx="13" cy="18" r=".8" /></svg>,
  Quake: (p) => <svg {...base} {...p}><path d="M2 12h3l2-5 3 10 3-8 2 5 2-2h5" /></svg>,
  Minus: (p) => <svg {...base} {...p}><path d="M5 12h14" /></svg>,
  Plus: (p) => <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>,
}

export const CATEGORY_ICON = {
  TRAPPED_IN_WATER: Icon.Water,
  LANDSLIDE: Icon.Landslide,
  EARTHQUAKE: Icon.Quake,
  MEDICAL: Icon.Medical,
  FOOD_AND_WATER: Icon.Food,
  VULNERABLE_PERSON: Icon.Person,
  CHILDREN: Icon.Child,
  OTHER: Icon.Help,
}
