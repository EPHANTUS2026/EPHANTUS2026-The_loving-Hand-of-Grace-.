export const CARE_ROLES=['counsellor','clinician','clinical_director','doctor','nurse','psychologist','social_worker','case_manager','aftercare_coordinator','family_liaison'];
export const BUSINESS_ROLES=['admissions','finance','hr','procurement','inventory','project_manager','helpdesk','marketing','accountant','field_service','staff'];
export const MANAGEMENT_ROLES=['administrator','manager','super_admin','director','clinical_director'];
export const STAFF_ROLES=[...new Set([...CARE_ROLES,...BUSINESS_ROLES,...MANAGEMENT_ROLES])];
export const WORKFLOW_DESIGN_ROLES=['administrator','manager','super_admin','director'];
