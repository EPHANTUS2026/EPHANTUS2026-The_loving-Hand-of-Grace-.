import {notFound} from 'next/navigation';
import {requireSession} from '@/lib/auth';
import AppShell from '@/components/app/AppShell';
import {staffNav} from '@/lib/nav';
import {designerDetail} from '@/lib/graceflow-control';
import WorkflowBuilder from '@/components/graceflow/WorkflowBuilder';
import Link from 'next/link';

export default async function Page({params}){const s=await requireSession(['administrator','manager','super_admin']);const d=await designerDetail(params.id,s.token);if(!d.definition)notFound();const initial=d.versions.find(v=>v.status==='draft')||d.versions.find(v=>v.status==='published')||d.versions[0];return <AppShell title={d.definition.name} subtitle={`${d.definition.module} · ${d.definition.workflow_key}`} role="GraceFlow designer" nav={staffNav}><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><Link href="/staff/graceflow/designer" className="text-sm font-bold text-grace-700">← Workflow library</Link><Link href="/staff/graceflow/automation" className="rounded-xl border px-3 py-2 text-xs font-bold">Automation & policy centre</Link></div><WorkflowBuilder definition={d.definition} initialVersion={initial}/><div className="mt-6 grid gap-5 lg:grid-cols-3"><Panel title="Triggers" rows={d.triggers.map(x=>`${x.trigger_type}: ${x.event_name||x.source_module||'manual'}`)}/><Panel title="Schedules" rows={d.schedules.map(x=>`${x.name} · ${x.cadence}`)}/><Panel title="Governance" rows={[`${d.approvals.length} approval rules`,`${d.slas.length} SLA policies`,`${d.escalations.length} escalation rules`]}/></div></AppShell>}
function Panel({title,rows}){return <section className="rounded-3xl border border-slate-200 bg-white p-5"><h3 className="font-black">{title}</h3><div className="mt-3 grid gap-2">{rows.length?rows.map((r,i)=><div key={i} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{r}</div>):<div className="text-sm text-slate-400">None configured.</div>}</div></section>}
