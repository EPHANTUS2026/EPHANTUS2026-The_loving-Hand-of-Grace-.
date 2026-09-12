import {requireSession} from '@/lib/auth';
import {dbSelect} from '@/lib/supabase-rest';
import AppShell from '@/components/app/AppShell';
import {adminNav} from '@/lib/nav';
import KnowledgeGovernanceConsole from '@/components/admin/KnowledgeGovernanceConsole';
export default async function KnowledgeGovernance(){
 const s=await requireSession(['administrator','manager','super_admin','director','clinical_director']);
 const articles=await dbSelect('knowledge_articles','select=id,title,summary,approval_status,version,next_review_at,archived,grace_visibility,clinical_sensitivity,updated_at&order=updated_at.desc',s.token).catch(()=>[]);
 return <AppShell title="Grace Knowledge Governance" subtitle="Review, approve, publish, expire and archive the sources Grace is allowed to trust" role="Management" nav={adminNav}><div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white"><div className="text-xs font-black uppercase tracking-[.18em] text-grace-200">Grounding constitution</div><h2 className="mt-2 text-2xl font-black">No source → no institutional claim.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Only approved, non-expired articles with Grace visibility enabled can support institutional answers. Publishing is a deliberate human governance action.</p></div><KnowledgeGovernanceConsole articles={articles}/></AppShell>
}
