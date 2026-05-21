// app/api/files/[id]/route.js
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { readFile, unlink } from "fs/promises";

// GET — Dosyayı indir
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const file = await db.file.findUnique({
      where: { id: params.id },
    });

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });
    }

    if (file.userId !== session.user.id) {
      return NextResponse.json({ error: "Bu dosyaya erişim izniniz yok" }, { status: 403 });
    }

    const fileBuffer = await readFile(file.path);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
        "Content-Length": file.size.toString(),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "İndirme sırasında hata oluştu" }, { status: 500 });
  }
}

// DELETE — Dosyayı sil
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const file = await db.file.findUnique({
      where: { id: params.id },
    });

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });
    }

    if (file.userId !== session.user.id) {
      return NextResponse.json({ error: "Bu dosyayı silme izniniz yok" }, { status: 403 });
    }

    // DB'den sil
    await db.file.delete({ where: { id: params.id } });

    // Dosya sisteminden sil
    try {
      await unlink(file.path);
    } catch (fsError) {
      console.warn("Dosya sisteminden silme uyarısı:", fsError.message);
    }

    return NextResponse.json({ message: "Dosya silindi" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Silme sırasında hata oluştu" }, { status: 500 });
  }
}

// GET — Kullanıcının tüm dosyalarını listele
export async function getFiles(userId) {
  return db.file.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
