// app/api/portfolio/assets/[id]/notes/route.js
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Not boş olamaz' }, { status: 400 });

  const asset = await db.asset.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!asset) return NextResponse.json({ error: 'Varlık bulunamadı' }, { status: 404 });

  const note = await db.assetNote.create({
    data: { userId: session.user.id, assetId: params.id, content: content.trim() },
  });

  return NextResponse.json(note);
}

export async function DELETE(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { noteId } = await req.json();

  await db.assetNote.deleteMany({
    where: { id: noteId, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
