-- Run on staging through an authorized SQL session. All synthetic writes roll back.
begin;
set local role service_role;
do $$
declare k uuid := gen_random_uuid(); result jsonb; n integer;
begin
 result := public.submit_public_enquiry(k,repeat('a',64),repeat('c',64),'Synthetic test','+254700000002','','general');
 assert result->>'status' = 'accepted';
 result := public.submit_public_enquiry(k,repeat('a',64),repeat('c',64),'Synthetic test','+254700000002','','general');
 assert result->>'status' = 'accepted';
 select count(*) into n from public.public_enquiry_receipts where submission_key=k;
 assert n=1;
 result := public.submit_public_enquiry(k,repeat('b',64),repeat('c',64),'Synthetic test','+254700000002','','general');
 assert result->>'status' = 'conflict';
 perform public.submit_public_enquiry(gen_random_uuid(),repeat('a',64),repeat('c',64),'Synthetic test','+254700000002','','general');
 perform public.submit_public_enquiry(gen_random_uuid(),repeat('a',64),repeat('c',64),'Synthetic test','+254700000002','','general');
 result := public.submit_public_enquiry(gen_random_uuid(),repeat('a',64),repeat('c',64),'Synthetic test','+254700000002','','general');
 assert result->>'status' = 'limited';
 assert not has_function_privilege('anon','public.submit_public_enquiry(uuid,text,text,text,text,text,text)','execute');
 assert not has_function_privilege('authenticated','public.submit_public_enquiry(uuid,text,text,text,text,text,text)','execute');
 assert not has_table_privilege('anon','public.public_enquiry_receipts','select');
end $$;
rollback;
