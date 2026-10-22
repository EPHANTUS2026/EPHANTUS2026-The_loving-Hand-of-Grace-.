alter table public.meditations add column if not exists owner_publication_exception_hash text;
comment on column public.meditations.owner_publication_exception_hash is 'One-time owner publication exception for the five supplied evergreen reflections. Content changes invalidate the hash; clinical and spiritual review statuses remain truthful. Authorization and rationale are stored in protected meditation_review_events.';
alter policy "published meditations readable" on public.meditations using (
 status='published' and (
 (clinical_review_status='approved' and spiritual_review_status='approved')
 or (slug in ('beginning-again','loving-without-losing-yourself','a-wave-not-a-wall','you-are-more-than-your-worst-day','small-roots-strong-tree')
 and clinical_review_status='pending' and spiritual_review_status='pending'
 and owner_publication_exception_hash=md5(jsonb_build_array(slug,title,excerpt,body,reflection_question,practice,theme,main_quotation,supporting_text,audience,optional_scripture,safety_note,reflection_label,display_order,featured)::text))
 )
);
