// Keep keyboard focus inside a visible modal and provide predictable dismissal.
export function handleDialogKeyDown(event,onClose){
 if(event.key==='Escape'){event.preventDefault();event.stopPropagation();onClose();return;}
 if(event.key!=='Tab')return;
 const panel=event.currentTarget;
 const controls=Array.from(panel.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el=>el.getClientRects().length>0);
 if(!controls.length){event.preventDefault();panel.focus();return;}
 const first=controls[0],last=controls.at(-1),active=panel.ownerDocument.activeElement;
 if(event.shiftKey&&(active===first||active===panel)){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&(active===last||active===panel)){event.preventDefault();first.focus();}
}
