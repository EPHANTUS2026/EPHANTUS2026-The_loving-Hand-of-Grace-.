import { dbSelect } from './supabase-rest';

export const enterpriseModules = [
  {key:'purchase',label:'Purchase',description:'Requests, approvals, vendors and purchase orders.',types:['purchase_request','purchase_order','vendor'],accent:'Procure to pay'},
  {key:'inventory',label:'Inventory',description:'Stock items, receipts, issues, transfers and reorder actions.',types:['inventory_item','stock_receipt','stock_issue','stock_transfer'],accent:'Stock control'},
  {key:'hr',label:'HR',description:'Employees, leave, recruitment, onboarding and people operations.',types:['employee','leave_request','recruitment','onboarding'],accent:'People operations'},
  {key:'helpdesk',label:'Helpdesk',description:'Internal support tickets, triage, SLAs and resolution.',types:['ticket','service_request','incident'],accent:'Service desk'},
  {key:'timesheets',label:'Timesheets',description:'Time entries, approvals and utilisation.',types:['timesheet','time_entry'],accent:'Time & attendance'},
  {key:'project',label:'Projects',description:'Projects, milestones, tasks, dependencies and delivery.',types:['project','project_task','milestone'],accent:'Delivery'},
  {key:'crm',label:'CRM',description:'Leads, opportunities, organisations, activities and referrals.',types:['lead','opportunity','organisation','activity'],accent:'Relationships'},
  {key:'sign',label:'Sign',description:'Signature requests, approvals and signed document tracking.',types:['signature_request','signature_template'],accent:'eSignature'},
  {key:'accounting',label:'Accounting',description:'Bills, expenses, journals and operational finance workflow.',types:['bill','expense','journal','payment_request'],accent:'Finance operations'},
  {key:'discuss',label:'Discuss',description:'Operational channels, threads and workflow-linked discussions.',types:['channel','thread','discussion'],accent:'Collaboration'},
  {key:'documents',label:'Documents',description:'Enterprise records, controlled documents and review cycles.',types:['document','policy','procedure'],accent:'Knowledge & records'},
  {key:'field-service',label:'Field Service',description:'Work orders, visits, assets and service completion.',types:['work_order','service_visit','asset_service'],accent:'Field operations'},
  {key:'email-marketing',label:'Email Marketing',description:'Campaigns, audiences, approvals and scheduled sends.',types:['campaign','audience','email_asset'],accent:'Communications'}
];

export const moduleMap = Object.fromEntries(enterpriseModules.map(m=>[m.key,m]));

export async function graceFlowDashboard(token){
  const [flows,tasks,events,records,approvals]=await Promise.all([
    dbSelect('workflow_instances','select=id,workflow_key,entity_type,entity_id,current_state,status,metadata,created_at,updated_at&order=updated_at.desc&limit=250',token),
    dbSelect('workflow_tasks','select=id,workflow_instance_id,task_type,title,assigned_role,assigned_staff_id,status,due_at,created_at,completed_at,payload&order=created_at.desc&limit=300',token),
    dbSelect('workflow_events','select=id,workflow_instance_id,event_type,source_channel,actor_type,summary,metadata,created_at&order=created_at.desc&limit=200',token),
    dbSelect('enterprise_records','select=id,module,record_type,reference,title,status,priority,owner_staff_id,amount,currency,due_at,created_at,updated_at&order=updated_at.desc&limit=400',token),
    dbSelect('workflow_approvals','select=id,workflow_instance_id,approval_type,status,requested_at,resolved_at&order=requested_at.desc&limit=200',token)
  ]);
  const openTasks=(tasks||[]).filter(t=>!['completed','cancelled'].includes(t.status));
  const activeFlows=(flows||[]).filter(f=>f.status==='active');
  const pendingApprovals=(approvals||[]).filter(a=>a.status==='pending');
  const counts=Object.fromEntries(enterpriseModules.map(m=>[m.key,(records||[]).filter(r=>r.module===m.key).length]));
  const external=(events||[]).filter(e=>['website','client_portal','family_portal','grace','email','api'].includes(e.source_channel));
  return {flows:flows||[],tasks:tasks||[],events:events||[],records:records||[],approvals:approvals||[],openTasks,activeFlows,pendingApprovals,counts,external};
}

export async function moduleWorkspace(module,token){
  const info=moduleMap[module]; if(!info)return null;
  const records=await dbSelect('enterprise_records',`module=eq.${encodeURIComponent(module)}&select=*&order=updated_at.desc&limit=200`,token);
  const ids=(records||[]).map(r=>r.id);
  const flows=ids.length?await dbSelect('workflow_instances',`entity_type=eq.enterprise_record&entity_id=in.(${ids.join(',')})&select=id,entity_id,current_state,status,updated_at,metadata`,token):[];
  const flowMap=Object.fromEntries((flows||[]).map(f=>[f.entity_id,f]));
  return {info,records:(records||[]).map(r=>({...r,flow:flowMap[r.id]||null}))};
}
