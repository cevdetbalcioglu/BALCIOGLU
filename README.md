# FileVault — Dosya Yükleme Sistemi

Next.js 14, NextAuth v5, Prisma ve PostgreSQL ile geliştirilmiş güvenli dosya yönetim platformu.

## 🚀 Kurulum

### 1. Bağımlılıkları yükleyin

```bash
npm install
```

### 2. Ortam değişkenlerini ayarlayın

`.env.local` dosyasını düzenleyin:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
AUTH_SECRET="en-az-32-karakter-gizli-anahtar"
NEXTAUTH_URL="http://localhost:3000"

# Opsiyonel — OAuth için
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_ID=""
GITHUB_SECRET=""
```

### 3. Veritabanı migration

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Geliştirme sunucusunu başlatın

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacak.

---

## 📁 Proje Yapısı

```
my-app/
├── app/
│   ├── auth/login/        → Giriş sayfası
│   ├── auth/register/     → Kayıt sayfası
│   ├── dashboard/
│   │   ├── layout.js      → Auth guard + navbar
│   │   ├── dashboard/     → Ana panel
│   │   └── files/         → Dosya yönetimi
│   ├── api/
│   │   ├── auth/          → NextAuth + register
│   │   └── files/         → Upload, download, delete
│   └── layout.js
├── components/
│   ├── auth/              → LoginForm, RegisterForm, SignOutButton
│   └── files/             → FileUpload, FileList
├── lib/
│   ├── auth.js            → NextAuth konfigürasyonu
│   ├── db.js              → Prisma singleton
│   └── utils.js           → Yardımcı fonksiyonlar
├── prisma/
│   └── schema.prisma      → DB şeması
└── middleware.js           → Route koruma
```

---

## 🔐 Özellikler

**Auth Modülü**
- Email + şifre ile kayıt/giriş (bcrypt)
- Google OAuth
- GitHub OAuth
- JWT tabanlı oturum yönetimi
- Middleware ile route koruma

**Dosya Modülü**
- Drag & drop + tıkla yükle
- Çoklu dosya yükleme
- Upload progress göstergesi
- Dosya indirme
- Dosya silme
- Tip ve boyut kontrolü (max 10MB)
- Kullanıcıya özel dosya izolasyonu

---

## 🔒 Güvenlik

- Şifreler bcrypt (salt: 12) ile hashlenir
- Her API isteğinde oturum doğrulanır
- Dosya isimleri UUID ile değiştirilir (path traversal önlemi)
- MIME tipi whitelist kontrolü
- Kullanıcı yalnızca kendi dosyalarına erişebilir

---

## 🛠️ Kullanışlı Komutlar

```bash
npm run dev           # Geliştirme sunucusu
npm run build         # Production build
npm run db:migrate    # Yeni migration oluştur
npm run db:studio     # Prisma Studio (DB UI)
npm run db:push       # Schema'yı direkt push et
```

---

## 📋 OAuth Kurulumu (Opsiyonel)

### Google
1. [Google Cloud Console](https://console.cloud.google.com) → Yeni proje
2. APIs & Services → Credentials → OAuth 2.0 Client ID
3. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

### GitHub
1. [GitHub Settings](https://github.com/settings/developers) → New OAuth App
2. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
