"use client";
// components/auth/SignOutButton.js
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/auth/login" })}
      className="text-sm text-slate-500 hover:text-slate-800 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
    >
      Çıkış
    </button>
  );
}
