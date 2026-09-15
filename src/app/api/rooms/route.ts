import { NextRequest, NextResponse } from 'next/server';
import { act, createRoom, getRoom, joinRoom } from '../../../server/rooms';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
function failure(error: unknown) { return NextResponse.json({ error: error instanceof Error ? error.message : '操作に失敗しました' }, { status: 400 }); }
export async function GET(request: NextRequest) {
  try { return NextResponse.json(getRoom(request.nextUrl.searchParams.get('code') || '', request.headers.get('authorization')?.replace(/^Bearer /, '') || ''), { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (data.action === 'create') return NextResponse.json(createRoom(Number(data.humanCount), data.name, data.mode));
    if (data.action === 'join') return NextResponse.json(joinRoom(String(data.code).toUpperCase(), data.name));
    return NextResponse.json(act(String(data.code).toUpperCase(), request.headers.get('authorization')?.replace(/^Bearer /, '') || '', data.action, data));
  } catch (error) { return failure(error); }
}
