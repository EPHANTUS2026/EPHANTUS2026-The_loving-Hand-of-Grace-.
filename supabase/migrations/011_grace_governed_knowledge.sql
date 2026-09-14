-- Grace governed knowledge grounding: approved DB authority + retrieval contract

create or replace function public.search_grace_approved_knowledge(p_query text, p_limit integer default 3)
returns table(
  id uuid,
  title text,
  summary text,
  body text,
  version integer,
  last_reviewed_at timestamptz,
  source_references jsonb,
  score real
)
language sql
stable
security definer
set search_path=public
as $$
  with q as (
    select websearch_to_tsquery('english', nullif(trim(p_query),'')) query
  )
  select a.id,a.title,a.summary,a.body,a.version,a.last_reviewed_at,a.source_references,
         ts_rank_cd(to_tsvector('english',coalesce(a.title,'')||' '||coalesce(a.summary,'')||' '||coalesce(a.body,'')),q.query)::real score
  from public.grace_approved_knowledge a cross join q
  where q.query is not null
    and to_tsvector('english',coalesce(a.title,'')||' '||coalesce(a.summary,'')||' '||coalesce(a.body,'')) @@ q.query
  order by score desc,a.last_reviewed_at desc nulls last
  limit greatest(1,least(coalesce(p_limit,3),5));
$$;

revoke all on function public.search_grace_approved_knowledge(text,integer) from public;
grant execute on function public.search_grace_approved_knowledge(text,integer) to anon,authenticated,service_role;

insert into public.knowledge_articles(title,summary,body,audience,approval_status,version,last_reviewed_at,next_review_at,archived,source_references,approved_at,published_at,grace_visibility,clinical_sensitivity)
select
  'Loving Hand of Grace — Vision and Mission',
  'Official centre vision and mission approved for public website and Grace grounding.',
  'Vision: Restoring lives. Renewing hope. Transforming communities. To be a leading center of excellence in rehabilitation and recovery, where individuals affected by addiction and life challenges find healing, regain their dignity, discover purpose, and are empowered to build healthy, productive, and meaningful lives. Mission: To restore lives through compassion, dignity, faith, and professional care. Loving Hand of Grace Rehabilitation Center is dedicated to providing compassionate, holistic, and professional rehabilitation services to individuals and families affected by addiction and other life challenges. Through counseling, therapy, spiritual guidance, life-skills development, education, mentorship, and community support, we create a safe and nurturing environment where individuals can heal, grow, rebuild relationships, and successfully transition into independent and productive lives.',
  array['public','client','family','staff'],
  'APPROVED',1,now(),now()+interval '180 days',false,
  '[{"type":"project_owner_supplied_document","title":"LOVING HAND OF GRACE REHABILITATION CENTER.docx","approved_for_website":"2026-09-14"}]'::jsonb,
  now(),now(),'approved','general'
where not exists(select 1 from public.knowledge_articles where title='Loving Hand of Grace — Vision and Mission');

insert into public.knowledge_articles(title,summary,body,audience,approval_status,version,last_reviewed_at,next_review_at,archived,source_references,approved_at,published_at,grace_visibility,clinical_sensitivity)
select
  'Loving Hand of Grace — Core Goals',
  'Official core goals of the rehabilitation centre.',
  'Restore Lives — Provide comprehensive rehabilitation and recovery programs that address the physical, emotional, psychological, social, and spiritual needs of every individual. Renew Hope — Create a caring and supportive environment where every person is valued, respected, and encouraged to believe in a better future. Promote Lasting Recovery — Equip individuals with the knowledge, skills, confidence, and support necessary to overcome addiction and prevent relapse. Rebuild Families — Strengthen families through counseling, education, reconciliation, and ongoing support throughout the recovery journey. Empower for Independence — Provide life-skills, vocational training, mentorship, and personal development opportunities that enable clients to become self-reliant and productive. Promote Prevention — Raise awareness about substance abuse and related challenges through education, outreach, advocacy, and early intervention within communities. Support Reintegration — Help recovering individuals successfully return to their families, workplaces, churches, and communities as responsible and productive members of society. Nurture Spiritual and Personal Growth — Encourage values of faith, grace, integrity, responsibility, forgiveness, resilience, and purpose as foundations for lasting transformation. Build Strong Partnerships — Collaborate with families, communities, healthcare professionals, churches, government agencies, and other organizations to strengthen recovery and expand our impact.',
  array['public','client','family','staff'],
  'APPROVED',1,now(),now()+interval '180 days',false,
  '[{"type":"project_owner_supplied_document","title":"LOVING HAND OF GRACE REHABILITATION CENTER.docx","approved_for_website":"2026-09-14"}]'::jsonb,
  now(),now(),'approved','general'
where not exists(select 1 from public.knowledge_articles where title='Loving Hand of Grace — Core Goals');

insert into public.knowledge_articles(title,summary,body,audience,approval_status,version,last_reviewed_at,next_review_at,archived,source_references,approved_at,published_at,grace_visibility,clinical_sensitivity)
select
  'Loving Hand of Grace — Commitment',
  'Official public commitment statement.',
  'At Loving Hand of Grace, we believe that addiction does not define a person—and that every life deserves another chance. We extend a loving hand, a listening heart, and a pathway to recovery, helping individuals move from struggle to strength, from hopelessness to hope, and from dependency to purposeful living. Restoring Lives • Renewing Hope • Transforming Communities.',
  array['public','client','family','staff'],
  'APPROVED',1,now(),now()+interval '180 days',false,
  '[{"type":"project_owner_supplied_document","title":"LOVING HAND OF GRACE REHABILITATION CENTER.docx","approved_for_website":"2026-09-14"}]'::jsonb,
  now(),now(),'approved','general'
where not exists(select 1 from public.knowledge_articles where title='Loving Hand of Grace — Commitment');

insert into public.knowledge_publish_events(article_id,action,note,snapshot)
select a.id,'PUBLISHED','Project-owner supplied institutional content approved for website and Grace grounding on 2026-09-14',jsonb_build_object('title',a.title,'version',a.version,'grace_visibility',a.grace_visibility)
from public.knowledge_articles a
where a.title in ('Loving Hand of Grace — Vision and Mission','Loving Hand of Grace — Core Goals','Loving Hand of Grace — Commitment')
  and not exists(select 1 from public.knowledge_publish_events e where e.article_id=a.id and e.action='PUBLISHED');
