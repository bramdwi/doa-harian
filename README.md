# Doa Harian (Daily Du'a) 🤲✨

Aplikasi Web Progresif (PWA) modern bernuansa manuskrip klasik islami untuk membaca amalan harian **Mukhtashar Al-Hizbul A'zham** (7 Hizib Harian) dan **40 Shalawat Nabi**. Dilengkapi teks Arab berkualitas tinggi, bacaan Latin santai/populer Indonesia, terjemahan, navigasi menu drawer, bookmark, zoom font, serta dukungan offline 100%.

---

## 🌟 Fitur Utama

- 📖 **192 Doa Lengkap & Doa Penutup**: 7 bab harian (Jumat s.d. Kamis) + 40 Shalawat Ma'tsur.
- 🔤 **Bacaan Latin Populer / Santai**: Transliterasi fonetik yang mudah dan fasih dibaca untuk pengguna yang belum lancar membaca Al-Qur'an.
- 👁️ **Kontrol Fleksibel (Toggle ON/OFF)**: Tombol pengatur tampilan bacaan Latin dan terjemahan Indonesia sesuai kenyamanan pembaca.
- 📱 **Progressive Web App (PWA) & Offline Ready**: Dapat diinstal di layar utama (iOS / Android / Desktop) dan tetap berfungsi lancar tanpa koneksi internet.
- 🔍 **Pengatur Ukuran Huruf (Zoom)**: Tombol `A-` / `A+` untuk menyesuaikan ukuran teks Arab dan Latin secara proporsional.
- 🔖 **Penanda Doa (Bookmark)**: Simpan doa-doa favorit ke daftar penanda cepat.
- 📲 **Bagikan Doa Mudah**: Fitur share langsung menyertakan teks Arab, bacaan Latin, dan artinya ke WhatsApp atau media sosial.
- 🎨 **Desain Elegan Klasik**: Tipografi Naskh (Amiri) & Cormorant Garamond bernuansa kertas manuskrip beraksen emas.

---

## 🚀 Menjalankan Secara Lokal

Cukup gunakan web server statis sederhana:

```bash
# Menggunakan Python
python3 -m http.server 8080

# Atau menggunakan Node.js (npx serve)
npx serve
```

Buka `http://localhost:8080` di browser favorit Anda.

---

## ☁️ Deployment ke Vercel

Proyek ini telah dikonfigurasi dengan `vercel.json` untuk caching Service Worker dan aset font yang optimal.
Tinggal hubungkan repositori ini di dashboard [Vercel](https://vercel.com) untuk *instant deployment*.
