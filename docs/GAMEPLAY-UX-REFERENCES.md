# Referensi gameplay dan UX Typecade Ocean

Tanggal: 10 Oktober 2026. Acuan implementasi: branch `app-v2`.

Dokumen ini menjelaskan prinsip yang cocok untuk game mengetik bertema memancing, perubahan yang diterapkan, dan ide yang masih perlu dicoba. Sumber ditelusuri melalui halaman pengembang, penerbit, repositori resmi, serta wiki Stardew Valley. Pengamatan sumber dan usulan Typecade dipisahkan; belum ada pengukuran retensi pemain.

## 1. Masalah yang harus diselesaikan lebih dahulu

1. Pemain perlu tahu di mana mengetik. Kotak input Adventure dan passage utama memberi dua pusat perhatian.
2. Pemain perlu membaca kondisi ikan dan skill sebelum kehilangan waktu.
3. Energi penuh tidak selalu berarti skill dapat dipakai. Cast Net juga membutuhkan ikan kecil dan reel minimal 45%.
4. Skill pasif tidak memerlukan tombol yang terlihat mati.
5. Aksi skill perlu memberi hasil yang terbaca dan kembali ke keadaan normal setelah efek visual singkat.
6. Tujuan satu encounter harus konsisten: ikan tertangkap setelah karakter terakhir passage diketik.

## 2. Referensi dan penerapannya

### ZType — mengetik menjadi aksi utama

**Sumber:** [catatan pembuat tentang keyboard layar](https://phoboslab.org/log/2015/07/what-makes-an-on-screen-keyboard-fun), [game resmi](https://zty.pe/).

Pengembang membahas keterbatasan keyboard sistem pada layar kecil, kebutuhan feedback sentuhan, dan pemilihan target ketikan yang tidak membingungkan.

**Penerapan Typecade:** satu passage menjadi pusat ketikan. Native input tetap tersedia untuk fokus, IME dan aksesibilitas, tetapi tidak membentuk kotak kedua. Keyboard pixel yang sudah dipakai Practice digunakan kembali di Adventure pada layar kecil. Backspace tidak ditampilkan di keyboard Adventure karena aturan Adventure mewajibkan mengetik ulang karakter yang salah.

**Batas:** teknik memperbesar area sentuhan secara prediktif tidak diterapkan. Itu perlu kalibrasi dan pengujian perangkat fisik. Tidak ada kode atau asset ZType yang disalin.

### Monkeytype — fokus pada teks dan posisi ketikan

**Sumber:** [repositori resmi](https://github.com/monkeytypegame/monkeytype).

Repositori mendeskripsikan fokus pada tampilan minimal, konfigurasi latihan, dan feedback ketika mengetik. Ini adalah referensi interaksi, bukan acuan visual Ocean.

**Penerapan Typecade:** Adventure memakai dua baris tetap yang mengikuti karakter aktif. Teks bergeser ke atas; pemain tidak perlu menggulir passage. Klik passage mengembalikan fokus. Practice tetap mempertahankan Modern tiga baris, Classic dua baris, dan pengaturan yang sudah dipulihkan dari versi awal.

**Batas:** ukuran teks dan jumlah elemen HUD Ocean harus tetap memperlihatkan tension, waktu dan line. Fokus minimal tidak berarti menghapus informasi yang diperlukan untuk mengambil keputusan.

### Stardew Valley — kondisi tangkapan dan hasil harus jelas

**Sumber:** [Fishing, Stardew Valley Wiki](https://stardewvalleywiki.com/Fishing).

Panduan memancing menunjukkan hubungan antara posisi ikan, area keberhasilan, progress tangkapan, serta pengenalan ikan dan hasil setelah berhasil memancing.

**Penerapan Typecade:** nama dan rarity ikan hadir dekat passage. REEL menunjukkan penyelesaian teks, LINE menunjukkan daya tahan, dan TENSION menunjukkan risiko. Ketikan pertama memulai timer dan tekanan; sebelum itu pemain dapat membaca. Skill mengubah risiko, tetapi tidak melewati karakter terakhir. Hasil tangkapan dan koleksi yang sudah ada tetap menjadi pengakuan atas keberhasilan.

**Batas:** tidak menambahkan minigame bar yang harus dikendalikan bersamaan dengan mengetik. Dua tugas motorik sekaligus akan mengganggu inti Typecade.

### Hades — pilihan kemampuan perlu mengubah keputusan

**Sumber:** [FAQ pengembang](https://www.supergiantgames.com/blog/hades-faq/), [halaman game](https://www.supergiantgames.com/games/hades/).

Pengembang menjelaskan variasi kemampuan, tantangan dan alasan memainkan run berulang. Penerapan di bawah adalah adaptasi desain untuk Typecade, bukan klaim bahwa sistem keduanya sama.

**Penerapan Typecade:** skill aktif menampilkan `Ready` beserta biaya, atau syarat yang belum terpenuhi. Skill pasif hadir sebagai kartu `Automatic`. Panel Skills menjelaskan cara aktivasi dan asal energi. Calm Current tidak dapat ditumpuk ketika efek delapan detiknya masih berjalan. Sonar memberi tension relief kecil selain preview rute, sehingga tetap berguna setelah ketikan dimulai. Perjalanan endless, refit dan enam skill yang sudah ada digunakan sebagai fondasi variasi.

**Batas:** tidak menambah puluhan skill dengan perbedaan angka kecil. Tiga slot perlu memberi keputusan yang bisa dijelaskan pemain.

### DREDGE — hasil memancing terhubung dengan tujuan perjalanan

**Sumber:** [halaman penerbit](https://www.team17.com/games/dredge/).

Penerbit menjelaskan menjual hasil tangkapan, meningkatkan kapal, meneliti peralatan dan mengakses ikan yang lebih langka.

**Usulan Typecade, belum diterapkan:** buat tujuan perjalanan yang spesifik, misalnya menangkap tiga spesies yang belum tercatat, memperbaiki kualitas tangkapan tertentu, atau menghadapi arus berisiko untuk hadiah lebih baik. Progres koleksi dan pilihan rute yang sekarang ada dapat menjadi dasarnya.

**Batas:** jangan menyalin ekonomi, inventory, siklus malam atau tema horor DREDGE. Upgrade kapal juga tidak boleh membuat latihan mengetik menjadi terlalu mudah hanya karena pemain lama memiliki statistik lebih tinggi.

## 3. Perubahan pada iterasi ini

| Perubahan | Perilaku yang diharapkan | Pemeriksaan |
| --- | --- | --- |
| Satu permukaan ketikan Adventure | Klik passage memfokuskan input; input tidak menjadi kotak kedua | Browser component test dan production E2E desktop/mobile |
| Dua baris yang mengikuti ketikan | Karakter aktif tetap terbaca, tanpa scrollbar | Shared passage regression dan production E2E |
| Timer pada ketikan pertama | Waktu membaca tidak mengurangi waktu atau menambah tekanan | Hook browser test dan production E2E |
| Keyboard pixel Adventure | Sentuhan langsung menghasilkan ketikan; input tetap fokus | Component test dan production E2E mobile |
| Status skill berdasarkan aturan yang sama | UI dan headless rules memberi syarat identik | Package tests dan browser tests |
| Passive sebagai kartu otomatis | Tidak ada tombol passive yang terlihat rusak | Browser test dan production E2E |
| Calm Current tidak ditumpuk | Energi tidak habis karena mengklik ulang buff yang masih aktif | Package test |
| Sonar punya manfaat saat memancing | Tension turun 5, minimum 0; preview tetap 12 detik | Package test dan expiry browser test |
| Pulse singkat | Skill kembali ke posisi semula, tanpa glow berulang saat siap | CSS feedback 350 ms; reduced motion tetap berlaku |

Stack tetap React, headless packages, Phaser dan GSAP yang sudah terpasang. Pemeriksaan memakai Vitest dan Playwright. Tidak ada layanan berbayar, runtime library baru, atau asset dari game referensi yang diambil.

## 4. Ide lanjutan yang paling layak diuji

Urutan ini adalah prioritas desain, bukan daftar fitur yang sudah selesai.

1. **Tujuan voyage yang terlihat.** Tampilkan satu sasaran opsional berdasarkan koleksi yang belum lengkap. Tetap beri progress jika run gagal. Ukur apakah pemain memahami tujuan tanpa membuka panel tambahan.
2. **Telegraph perilaku ikan.** Sebelum tekanan berubah, beri petunjuk pendek seperti arus menguat atau ikan menahan reel. Gunakan event dan animasi Phaser yang sudah ada. Pastikan petunjuk tidak menutup karakter aktif dan masih terbaca tanpa warna/audio.
3. **Refit yang menunjukkan konsekuensi.** Jelaskan perbedaan memilih Steel Line, Calm Current atau Reel Mastery untuk voyage berikutnya. Pertahankan tiga slot; hindari jumlah opsi yang hanya menambah waktu di menu.
4. **Tantangan berbasis ketelitian.** Pengujian lanjutan dapat memakai passage panjang, clean-word streak atau batas kesalahan. Teks target harus tetap bisa dibaca, dan syarat menang harus muncul sebelum mulai.

Keempat ide perlu playtest manusia. Catat waktu sampai ketikan pertama, penggunaan skill yang berhasil, penyebab gagal dan alasan berhenti. Coverage source tidak membuktikan bahwa pemain merasa senang atau ingin kembali.

## 5. Aturan visual dan kenyamanan

- Pertahankan keluarga panel/button pixel dari main menu dan palet Ocean. Referensi memengaruhi perilaku, bukan membawa gaya UI baru.
- Nama ikan, tension, line, waktu dan skill harus bisa dibaca pada desktop dan 320×640.
- Hindari mengguncang kamera pada setiap huruf. Reservasikan feedback besar untuk passive penting, skill, pergantian fase boss dan tangkapan.
- Tidak mengunci hadiah yang sudah diperoleh ketika pemain berhenti; simpan dan akui progres yang sah.
- Animasi mengikuti Pause dan Reduced Effects. Ketikan tidak menunggu animasi selesai.
