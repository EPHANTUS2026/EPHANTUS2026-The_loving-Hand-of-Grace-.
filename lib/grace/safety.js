const emergencyPatterns = [
  /suicid|kill myself|end my life|self[- ]?harm|hurt myself/i,
  /overdose|took (too many|several) pills|poison(ed|ing)?/i,
  /unconscious|not breathing|seizure|convuls/i,
  /severe withdrawal|delirium|hallucinat.*withdraw/i,
  /kill him|kill her|kill them|hurt someone|harm someone/i,
  /immediate danger|bleeding heavily|cannot breathe|can't breathe/i,
  /nataka kujiua|nataka kufa|niko hatarini|amepoteza fahamu|hapumui/i,
];

const clinicalBoundaryPatterns = [
  /diagnos|am i an alcoholic|do i have (addiction|depression|anxiety|bipolar)/i,
  /should i (stop|start|change).*(medication|medicine|antidepressant|tablet|dose)/i,
  /what dose|dosage|how many.*pills/i,
  /detox.*(at home|plan|schedule)/i,
];

export function classifySafety(message='') {
  if (emergencyPatterns.some((p)=>p.test(message))) return { level:'EMERGENCY', reason:'Potential immediate safety or medical risk' };
  if (clinicalBoundaryPatterns.some((p)=>p.test(message))) return { level:'RESTRICTED', reason:'Requires qualified clinical judgement' };
  return { level:'STANDARD', reason:'No emergency signal detected' };
}
