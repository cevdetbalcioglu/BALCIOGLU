// app/api/files/upload/route.js
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, getUploadPath } from "@/lib/utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Dosya seçilmedi" }, { status: 400 });
    }

    const uploadedFiles = [];
    const errors = [];

    for (const file of files) {
      // Dosya tipi kontrolü
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        errors.push(`${file.name}: İzin verilmeyen dosya tipi`);
        continue;
      }

      // Dosya boyutu kontrolü
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Dosya boyutu 10MB'ı aşıyor`);
        continue;
      }

      // Kullanıcıya özel klasörü oluştur
      const userUploadDir = getUploadPath(session.user.id);
      await mkdir(userUploadDir, { recursive: true });

      // UUID ile güvenli dosya adı
      const ext = path.extname(file.name);
      const storedName = `${uuidv4()}${ext}`;
      const filePath = path.join(userUploadDir, storedName);

      // Dosyayı kaydet
      const bytes = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));

      // DB'ye kaydet
      const dbFile = await db.file.create({
        data: {
          name: file.name,
          storedName,
          size: file.size,
          mimeType: file.type,
          path: filePath,
          userId: session.user.id,
        },
      });

      uploadedFiles.push(dbFile);
    }

    return NextResponse.json({
      message: `${uploadedFiles.length} dosya yüklendi`,
      files: uploadedFiles,
      errors,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Yükleme sırasında hata oluştu" }, { status: 500 });
  }
}
