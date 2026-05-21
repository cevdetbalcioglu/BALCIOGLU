// app/auth/register/page.js
import RegisterForm from "@/components/auth/RegisterForm";
import Link from "next/link";

export const metadata = { title: "Kayıt Ol — FileVault" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">FileVault</h1>
          <p className="text-slate-400 text-sm mt-1">Yeni hesap oluşturun</p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          <RegisterForm />
          <p className="text-center text-slate-400 text-sm mt-6">
            Zaten hesabınız var mı?{" "}
            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
