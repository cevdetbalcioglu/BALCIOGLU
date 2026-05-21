// app/dashboard/files/page.js
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import FileUpload from "@/components/files/FileUpload";
import FileList from "@/components/files/FileList";

export const metadata = { title: "Dosyalarım — FileVault" };

export default async function FilesPage() {
  const session = await auth();

  const files = await db.file.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dosyalarım</h1>
        <p className="text-slate-500 mt-1">Dosyalarınızı yükleyin, indirin ve yönetin.</p>
      </div>

      <FileUpload />
      <FileList initialFiles={files} />
    </div>
  );
}
