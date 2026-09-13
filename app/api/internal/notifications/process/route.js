import {NextResponse} from 'next/server';
import {processNotificationOutbox} from '@/lib/notifications/process-outbox';
export async function POST(req){const secret=req.headers.get('authorization');if(!process.env.NOTIFICATION_WORKER_SECRET||secret!==`Bearer ${process.env.NOTIFICATION_WORKER_SECRET}`)return NextResponse.json({error:'Unauthorized'},{status:401});try{return NextResponse.json(await processNotificationOutbox());}catch{return NextResponse.json({error:'Notification processing failed.'},{status:503});}}
