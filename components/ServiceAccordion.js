'use client';
import { useId, useState } from 'react';

export default function ServiceAccordion({ items }) {
  const id = useId();
  const [expanded, setExpanded] = useState({});
  return <div className="mt-8 grid gap-3">{items.map(([title, body], index) => {
    const open = Boolean(expanded[index]);
    return <div key={title} className="rounded-2xl border border-slate-200 bg-white">
      <h3><button type="button" id={id + '-button-' + index} aria-expanded={open} aria-controls={id + '-panel-' + index}
        onClick={() => setExpanded(previous => ({ ...previous, [index]: !previous[index] }))}
        className="flex w-full items-center justify-between gap-4 rounded-2xl p-5 text-left font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grace-700">
        {title}<span aria-hidden="true">{open ? '−' : '+'}</span>
      </button></h3>
      <div id={id + '-panel-' + index} aria-labelledby={id + '-button-' + index} hidden={!open} className="px-5 pb-5 text-sm leading-7 text-slate-600">{body || 'Contact the Centre for details.'}</div>
    </div>;
  })}</div>;
}
