import {processNotificationOutbox as processOutbox} from './notifications/outbox-worker';

// Preserve the scheduler's numeric limit interface.
export async function processNotificationOutbox(limit=100){
  return processOutbox({limit});
}
