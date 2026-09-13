// Starter approved knowledge only. Replace/extend through the Grace Knowledge Console.
// Institutional claims must come from approved records; general education is labelled GENERAL.
export const approvedKnowledge = [
  { id:'grace-role', type:'VERIFIED', title:'Grace identity', section:'Role', updated:'2026-09-11', text:'Grace is the AI care-navigation and support assistant of The Loving Hand of Grace. Grace can explain services, guide admissions, provide general recovery education, help navigate the website and coordinate human contact. Grace is not a doctor, therapist or emergency service.' },
  { id:'admissions-general', type:'VERIFIED', title:'Admissions workflow', section:'Getting started', updated:'2026-09-11', text:'Admission support follows an enquiry, screening and professional assessment process. Grace may help collect permitted non-clinical contact information and connect a person with the admissions team, but Grace does not decide which treatment programme a person requires.' },
  { id:'family-support', type:'VERIFIED', title:'Family support', section:'Family navigation', updated:'2026-09-11', text:'Family members may ask for general guidance about the rehabilitation journey, family support and how to prepare for a conversation with the Centre. Client-specific information may only be shared according to consent and access permissions.' },
];

export function retrieveApprovedKnowledge(message='') {
  const tokens=message.toLowerCase().split(/\W+/).filter(Boolean);
  const scored=approvedKnowledge.map(item=>({
    ...item,
    score: tokens.reduce((n,t)=>n+(item.text.toLowerCase().includes(t)||item.title.toLowerCase().includes(t)?1:0),0)
  })).sort((a,b)=>b.score-a.score);
  return scored.filter(x=>x.score>0).slice(0,3);
}
