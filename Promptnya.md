# GEMINI.md — Digitalisasi Kitab Hizib (Mukhtashar Al-Hizbul A'zham)

> Dokumen ini adalah briefing lengkap untuk model AI mana pun (Gemini, Claude, GPT, dst.)
> yang melanjutkan pekerjaan ini. Baca seluruh dokumen sebelum mengerjakan apa pun.

---

## 1. KONTEKS PROYEK

Pengguna (Brahman) sedang mendigitalisasi **Mukhtashar Al-Hizbul A'zham**, sebuah kitab
devosional klasik Islam berisi kumpulan hizib (rangkaian doa) untuk dibaca pada hari-hari
tertentu dalam sepekan (Hizib Pertama untuk Ahad, Hizib Kedua untuk Senin, dst.).

Setiap hizib berisi ~20-25 doa pendek, masing-masing dengan struktur:
- Teks Arab asli
- Referensi sumber (ayat Qur'an atau hadis — riwayat Bukhari, Muslim, Tirmidzi, dll.)
- Terjemahan Bahasa Indonesia
- Catatan/Faedah (penjelasan singkat tentang keutamaan/konteks doa — opsional, tidak semua
  doa punya bagian ini)

**Tujuan akhir:** setiap hizib dirender jadi PDF cetak (format kitab A5) dengan estetika
manuskrip Islam klasik yang hangat (cream/emas/coklat), lalu (kemungkinan tahap berikutnya)
digabung jadi satu kitab utuh, dan/atau dijadikan sumber untuk PWA pembaca digital.

Pengguna bekerja dari **Android via Termux**, jadi asumsikan environment terbatas dan
prioritaskan solusi yang portable (font di-embed, tidak bergantung CDN online).

---

## 2. STATUS SAAT INI (yang sudah dikerjakan)

✅ Template desain HTML+CSS untuk layout kitab — **sudah difinalisasi dan disetujui pengguna**
✅ Pipeline render PDF via WeasyPrint — bekerja dengan baik, shaping Arab benar (Pango)
✅ Font Amiri & Cormorant Garamond sudah diunduh dan di-embed lokal
✅ **Hizib Kelima (Hari Selasa)** — 21 doa — selesai, PDF 9 halaman
✅ **Hizib Keenam (Hari Rabu)** — 22 doa — selesai, PDF 9 halaman

⏳ Hizib lain (Ahad, Senin, Kamis, Jumat, Sabtu, dan hizib-hizib lain dalam kitab) —
   **belum dikerjakan**, menunggu materi dari pengguna secara bertahap (per pesan/chat).

⏳ Penggabungan seluruh hizib menjadi satu kitab utuh dengan daftar isi — belum diminta,
   tapi kemungkinan besar akan diminta setelah semua hizib individual selesai.

⏳ Versi PWA/ebook digital dari konten ini — disebutkan sebagai kemungkinan tahap
   selanjutnya di riwayat percakapan sebelumnya, belum dimulai untuk proyek spesifik ini.

---

## 3. SPESIFIKASI DESAIN YANG SUDAH DISETUJUI (JANGAN DIUBAH tanpa diminta)

Pengguna eksplisit bilang: **"pertahankan gaya nya seperti ini"** — jadi gaya di bawah ini
adalah standar tetap untuk semua hizib berikutnya, kecuali pengguna minta perubahan.

### Tipografi
- **Arab:** Amiri (Regular + Bold), ukuran 12.5pt, line-height 1.75, direction RTL, center-align
- **Latin:** Cormorant Garamond (variable font, weight 300–700 + italic), body 10.5pt line-height 1.45
- Referensi hadis/ayat: Amiri 8.5pt, warna rubrikasi merah, RTL, center

### Palet warna
| Token | Hex | Kegunaan |
|---|---|---|
| `--cream` | `#FAF6EC` | Latar halaman |
| `--cream-deep` | `#F5EFE0` | Variasi latar |
| `--ink` | `#2B2016` | Teks utama |
| `--ink-soft` | `#4A3B2A` | Teks sekunder (faedah) |
| `--gold` | `#B8935A` | Aksen, garis, nomor doa |
| `--gold-deep` | `#967140` | Aksen gelap, label italic |
| `--rubric` | `#8B3A2E` | Referensi hadis (rubrikasi merah) |
| `--panel` | `#E8DCC4` | Latar kotak faedah/catatan |
| `--rule` | `#D8C69E` | Garis pembatas tipis |

### Layout halaman
- Ukuran: **A5 (148mm × 210mm)**
- Margin: **14mm atas / 15mm kanan / 13mm bawah / 15mm kiri**
- Running header: judul hizib dalam Arab, kecil, warna gold-deep
- Nomor halaman di tengah bawah
- **PENTING:** `page-break-inside: auto` (BUKAN `avoid`) pada `.doa-blok` — jika diset ke
  `avoid`, halaman akan penuh whitespace kosong karena blok yang tak muat dilempar ke
  halaman berikutnya. Pengguna sudah komplain soal ini sekali, jangan diulangi.

### Struktur per-doa
1. Nomor doa dalam lingkaran emas kecil (5.5mm), diikuti garis tipis
2. Teks Arab (center, RTL)
3. Referensi sumber di bawah teks Arab (jika ada)
4. Label italic **"Terjemahan:"** + isi terjemahan (justify)
5. Kotak faedah/catatan (opsional): latar `--panel`, border kiri emas 2pt, isi italic
6. Pemisah `۞` di antar-doa (bukan garis biasa)

### Header bab (halaman pembuka hizib)
- Ornamen `❊ ❊ ❊` di atas
- Judul Arab (bold, 15pt)
- Judul Indonesia (italic, gold-deep, 13pt)
- Garis gradient emas tipis di bawah

### Penutup
- Kalimat penutup Arab: `وَآخِرُ دَعْوَانَا أَنِ الْحَمْدُ لِلَّهِ رَبِّ الْعٰلَمِيْنَ`
- Border atas tipis sebelum kalimat penutup

**Catatan istilah:** sumber materi kadang pakai label "Faedah" kadang "Catatan" untuk kotak
penjelasan — ikuti istilah yang dipakai di materi asli, jangan dipaksa seragam.

---

## 4. PIPELINE TEKNIS

### Alur kerja
1. Terima materi mentah dari pengguna (format: markdown dengan nomor urut, teks Arab bold,
   referensi dalam kurung, "Terjemahan:", "Faedah:"/"Catatan:")
2. Konversi ke HTML mengikuti struktur di atas (lihat file `.html` yang sudah ada sebagai
   referensi struktur persis)
3. Render ke PDF dengan **WeasyPrint** (bukan ReportLab — ReportLab tidak menangani shaping
   Arab dengan baik; WeasyPrint pakai Pango yang shaping Arabnya benar secara native)
4. Cek jumlah halaman & preview 2-3 halaman via `pdftoppm` sebelum diserahkan ke pengguna

### Perintah render
```python
from weasyprint import HTML
HTML('nama-file.html', base_url='nama-file.html').write_pdf('output.pdf')
```

### Font — PENTING
Font **tidak tersedia** secara default di environment/container. Jika font hilang
(container baru/reset), unduh ulang dari repo `google/fonts` di GitHub (domain
`raw.githubusercontent.com` biasanya sudah di-whitelist untuk akses jaringan):

```bash
mkdir -p fonts && cd fonts
curl -sL -o Amiri-Regular.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf"
curl -sL -o Amiri-Bold.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Bold.ttf"
curl -sL -o CormorantGaramond-Var.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf"
curl -sL -o CormorantGaramond-Italic-Var.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/CormorantGaramond-Italic%5Bwght%5D.ttf"
```

**Catatan:** nama file di repo Google Fonts untuk variable font mengandung karakter `[` `]`
yang harus di-URL-encode (`%5B` `%5D`) saat diunduh via curl. Jika file gagal (404 / isi
"Not Found"), cek dulu `METADATA.pb` di folder font tersebut untuk nama file yang benar —
jangan asumsikan pola penamaan.

Font di-load via `@font-face` dengan path lokal relatif (`fonts/Amiri-Regular.ttf`, dst.),
**bukan** dari Google Fonts CDN — supaya PDF-nya portable dan tidak bergantung koneksi
internet saat dirender ulang di Termux/offline.

### Struktur folder output per hizib
```
hizib-<nama>-<hari>/
├── hizib-<nama>-<hari>.pdf     ← hasil akhir
├── hizib-<nama>-<hari>.html    ← sumber, bisa diedit & di-render ulang
└── fonts/
    ├── Amiri-Regular.ttf
    ├── Amiri-Bold.ttf
    ├── CormorantGaramond-Var.ttf
    └── CormorantGaramond-Italic-Var.ttf
```

---

## 5. CARA MENAMBAH HIZIB BARU

1. Ambil file `.html` dari hizib yang sudah ada sebagai template
2. Ganti hanya bagian:
   - `@top-center content` (running header Arab)
   - `.judul-bab-arab` dan `.judul-bab-indo` (judul hizib + hari)
   - Seluruh blok `.doa-blok` di dalam `<body>` sesuai materi baru
3. **Jangan ubah** bagian `<style>` kecuali pengguna minta perubahan desain eksplisit
4. Render, cek jumlah halaman (idealnya proporsional — hizib 20-22 doa biasanya jadi
   ~9 halaman dengan spec di atas; kalau tiba-tiba jadi 15+ halaman, kemungkinan ada
   masalah whitespace, cek `page-break-inside`)
5. Preview minimal halaman 1 dan 1 halaman tengah sebelum present ke pengguna
6. Simpan ke folder `hizib-<nama>-<hari>/` dengan struktur di atas

---

## 6. PREFERENSI & GAYA KOMUNIKASI PENGGUNA

- Bahasa: **Bahasa Indonesia** untuk percakapan
- Pengguna adalah graphic designer/art director berpengalaman — paham istilah desain,
  tidak perlu penjelasan dasar tentang tipografi/warna
- Pengguna cukup terbuka soal iterasi teknis (font tidak tersedia, perlu diunduh, dll.)
  — tunjukkan proses debugging singkat jika relevan, tidak perlu disembunyikan
- Pengguna menghargai efisiensi: kalau template sudah oke, jangan tanya ulang preferensi
  desain untuk hizib berikutnya — langsung terapkan
- Pengguna sering bekerja lintas proyek Islamic PWA/kitab dengan pola arsitektur serupa:
  konten terpusat di satu file (`data.js` untuk web), font di-embed lokal, palet
  cream/gold/coklat konsisten

---

## 7. HAL YANG PERLU DIWASPADAI

- **Jangan** gunakan ReportLab untuk konten berbahasa Arab — shaping akan rusak
- **Jangan** set `page-break-inside: avoid` pada blok konten panjang — menyebabkan whitespace
- **Jangan** asumsikan font Arab tersedia di sistem — selalu cek `fc-list` dulu, unduh jika perlu
- **Jangan** ubah numbering/urutan doa dari materi asli — ini teks devosional, akurasi penting
- Materi terkadang punya elemen non-doa (misal item 20 di Hizib Kelima tanpa terjemahan
  eksplisit, atau catatan editorial di dalam kurung yang menjelaskan sumber footnote) —
  baca materi dengan teliti, jangan asal template semua item sama persis
- Kalau pengguna kirim materi yang terlihat duplikat dari yang sudah dikerjakan, **tanya
  dulu** sebelum memproses ulang (sudah pernah terjadi sekali)

---

*Dokumen ini dibuat agar model/asisten AI apa pun bisa melanjutkan pekerjaan ini tanpa
kehilangan konteks. Update dokumen ini jika ada perubahan besar pada spesifikasi desain
atau alur kerja.*
