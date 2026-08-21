# 1. Visi & Design Pillars

**Elevator pitch:** *"Balatro meets Vampire Survivors, tapi senjatanya adalah jari kamu."*

Empat pilar yang menjadi filter untuk setiap keputusan desain:

1. **Ngetik = keputusan, bukan kewajiban.** Setiap detik, pemain memilih target mana yang diketik duluan, risiko apa yang diambil, dan build apa yang dikejar. Kalau sebuah fitur tidak menghasilkan keputusan, fitur itu dibuang.
2. **Setiap run beda cerita.** Kombinasi item, musuh, dan event membuat run ke-50 terasa fresh seperti run ke-5.
3. **Juice first.** Game ketik hidup-matinya di game feel. Tidak ada aksi tanpa feedback visual + audio yang memuaskan.
4. **Zero friction.** Dari buka typecade.com ke kata pertama yang diketik: **di bawah 10 detik, tanpa login.**

---

## 2. Core Loop

### Struktur satu run (10–15 menit)

1. **Wave survival** — musuh muncul dari kanan layar, masing-masing membawa kata di atas kepala. Selesaikan kata = musuh mati. Musuh mencapai garis pemain = kena damage.
2. **Reward phase** — setiap 3–4 wave, muncul pilihan **1 dari 3 item** (ala Vampire Survivors) ATAU masuk **Shop** (ala Balatro) tiap 5 wave.
3. **Boss wave** — tiap 5 wave: kalimat/paragraf panjang dengan mekanik khusus.
4. **Run selesai** (HP habis atau tamat) → layar hasil → tombol **"Run Lagi"** bisa ditekan dalam 1 klik, <2 detik.

### Angka dasar run

| Parameter | Nilai awal | Catatan |
| --- | --- | --- |
| Panjang run | 20 wave (4 boss) | ~12 menit |
| HP pemain | 100 | Balancing awal, di-tune dari playtest |
| Damage musuh ke pemain | 5–25 per musuh yang lolos | Tergantung tipe musuh |
| Currency ("Bits") | drop per kill, 1–5 per musuh | Untuk belanja di Shop |
| Wave 1 | 6 musuh, kata 3–4 huruf | Tutorial terselubung |

### Formula scaling per wave (draft untuk playtest)

- Jumlah musuh: `5 + wave` (cap 25)
- Panjang kata: mulai 3–4 huruf → wave 20 campuran 6–12 huruf
- Kecepatan jalan musuh: `1 + (wave × 0.08)`
- HP boss: `40 × bossIndex` "damage point" (1 huruf benar = base damage, dimodifikasi item)

---

## 3. Sistem Musuh — kunci "typing = keputusan"

Ini bagian yang mengubah ngetik dari gimmick menjadi gameplay. **Musuh yang berbeda = keputusan yang berbeda.**

| Tipe | Ciri | Kata | Perilaku | Keputusan yang dipaksa |
| --- | --- | --- | --- | --- |
| **Runner** | Kecil, cepat | 3–4 huruf | Jalan cepat, damage kecil (5) | Bersihkan cepat atau abaikan? |
| **Tank** | Besar, lambat | 8–12 huruf | Jalan pelan, damage besar (25) | Investasi waktu ngetik panjang, reward besar |
| **Golden** | Bersinar, langka | Kata dengan kapital + tanda baca | Spawn random, despawn 8 detik | Risiko typo tinggi, reward 10x Bits |
| **Toxic** | Warna hijau beracun | Kata biasa | **JANGAN diketik** — kalau selesai diketik, meledak merugikanmu | Melatih kontrol: tidak semua kata boleh diketik |
| **Splitter** | Sedang | 5–6 huruf | Mati → pecah jadi 2 Runner | Prioritas tinggi sebelum dekat |
| **Shielded** | Ada perisai | 2 kata berturut-turut | Kata 1 = perisai, kata 2 = badan | Komitmen 2 kata, blokir fokus |
| **Healer** | Aura hijau | 6 huruf | Menyembuhkan musuh lain tiap 2 detik | Target prioritas #1 — tes decision making |
| **Boss** | Layar bergetar | Kalimat penuh / paragraf | Mekanik unik per boss (lihat bawah) | Climax moment, bahan clip TikTok |

### Ide mekanik boss (rotasi 4 boss)

1. **The Compiler** — mengetik kalimat kode dengan bracket & simbol; tiap 10 detik melempar kata "Toxic" sebagai distraksi.
2. **Ghost Writer** — kata-katanya **memudar dan muncul kembali**; harus hafal urutan huruf (mechanic memory + typing).
3. **The Mirror** — kata ditulis **terbalik** (`elpmaxe`) di 50% HP kedua.
4. **The Monologue** (final) — paragraf 4 kalimat; tiap kalimat selesai = fase baru dengan musuh kecil ikut spawn. Ini momen "satu tangan berkeringat" yang akan di-clip orang.

---

## 4. Sistem Item — 40 item dengan sinergi nyata

Prinsip: **item bagus mengubah cara main, bukan cuma +stat.** Setiap item punya tag untuk sinergi. Pemain melihat tag dan mulai "meracik build" — itulah candu Balatro.

**Tag sinergi:** `SPEED`, `CRIT`, `COMBO`, `ECON`, `DEFENSE`, `CHAOS`, `LONG` (kata panjang)

### Common (16)

| Item | Tag | Efek |
| --- | --- | --- |
| Keyboard Karet | DEFENSE | 1 typo pertama per wave diampuni |
| Rush Hour | SPEED | Kata ≤4 huruf: +20% damage |
| Kopi Sachet | SPEED | +10% kecepatan proyektil |
| Koin Receh | ECON | +1 Bits per kill |
| Sarung Tangan | DEFENSE | +20 max HP |
| Tombak Lurus | LONG | Kata ≥7 huruf: +15% damage |
| Pemantik | COMBO | Streak 5: ledakan kecil (radius 1 musuh) |
| Magnet Uang | ECON | Bits tertarik otomatis dari jarak jauh |
| Refleks Kucing | SPEED | 3 detik pertama tiap wave: damage 1.5x |
| Perban | DEFENSE | Heal 5 HP tiap wave selesai |
| Peluru Tumpul | — | +10% damage flat |
| Alarm Pagi | SPEED | Musuh berjalan 10% lebih lambat |
| Kalkulator | ECON | +2 Bits tiap selesaikan kata tanpa typo |
| Cadangan Baterai | COMBO | Streak tidak putus saat ganti target |
| Kaca Pembesar | CRIT | +10% crit chance (crit = 2x damage) |
| Sepatu Lari | SPEED | Musuh Runner 25% lebih lambat |

### Rare (16) — mulai mengubah keputusan

| Item | Tag | Efek |
| --- | --- | --- |
| Sniper Scope | LONG, CRIT | Kata ≥8 huruf selalu crit |
| Combo Reactor | COMBO | Tiap 10 streak tanpa typo: ledakan AoE (radius 3 musuh) |
| Vampire Keys | DEFENSE | Tiap kill heal 1 HP, tapi max HP dikunci 50 |
| Cashback | ECON | 30% harga shop kembali sebagai Bits |
| Double Tap | SPEED | 15% chance proyektil menembak 2x |
| Poison Ivy | CHAOS | Kata Toxic yang kamu biarkan lolos malah meledak ke musuh lain |
| Bunga Rampai | LONG | Tiap kata panjang: +1 Bits bonus |
| Panic Button | DEFENSE | Di bawah 30 HP: musuh 20% lebih lambat |
| Ricochet | SPEED | Kill meluap: sisa damage lompat ke musuh terdekat |
| Tangan Kiri | CHAOS | Kata hanya dari huruf tangan kiri keyboard: semua reward 1.5x |
| Saklar Otomatis | COMBO | Streak ≥15: auto-target musuh terdekat (kata otomatis terseleksi) |
| Lintah Darat | ECON | Bits drop +50%, tapi harga shop +25% |
| Executor | CRIT | Musuh di bawah 30% HP langsung mati oleh 1 huruf |
| Tameng Pecah | DEFENSE | Sekali per run: selamat dari serangan fatal dengan 1 HP |
| Mesin Waktu | SPEED | Golden enemy tidak despawn selama kamu mengetiknya |
| Fragmentasi | LONG | Kill Tank: pecah jadi proyektil ke 3 musuh terdekat |

### Legendary (8) — build-defining, konten clipable

| Item | Tag | Efek |
| --- | --- | --- |
| **Glass Cannon** | CRIT | Typo = mati. Damage 3x. Mode deg-degan maksimal |
| **Echo** | COMBO | Tiap kata selesai "menggema": 50% damage ke musuh random lain |
| **Left Hand Only** | CHAOS | Semua kata jadi huruf tangan kiri saja, SEMUA reward 2x |
| **The Intern** | ECON | Musuh kecil mati otomatis tiap 5 detik tanpa diketik |
| **Overtime** | SPEED | Wave berjalan 25% lebih cepat, semua reward 2x |
| **Pacifist** | DEFENSE | Kamu tidak bisa menyerang 10 detik pertama tiap wave; setelah itu damage 2.5x |
| **Slot Machine** | CHAOS | Tiap kill: 10% chance jackpot 50 Bits, 5% chance spawn Toxic |
| **Second Monitor** | LONG, CRIT | Kata ≥8 huruf memberikan crit 3x DAN AoE kecil |

### Contoh build yang harus "ditemukan" pemain

- **Long-word crit machine:** Sniper Scope + Second Monitor + Bunga Rampai + Tombak Lurus → berburu Tank & kata panjang.
- **Combo explosion:** Combo Reactor + Echo + Cadangan Baterai + Pemantik → typo adalah musuh utama.
- **Economy rush:** Koin Receh + Cashback + Lintah Darat + Slot Machine → kaya tapi mahal.
- **Chaos run:** Left Hand Only + Glass Cannon + Poison Ivy → clip TikTok dijamin.

---

## 5. Mode 1v1 — "TypeRacer dengan kartu UNO"

Jangan bikin "dua orang ngetik siapa cepat" — itu sudah ada di mana-mana. Tambahkan **interaksi langsung**:

- Kata diselesaikan < 3 detik → **kirim musuh junk ke layar lawan**.
- Typo → lawan dapat buff kecepatan 3 detik (karma).
- Match 3 menit atau sampai satu pemain HP habis.
- **Comeback mechanic:** pemain yang tertinggal >20% progres mendapat kata 20% lebih pendek (rubber-banding ala Mario Kart).
- **Rematch 1 tombol** setelah match — 80% retensi mode versus datang dari tombol ini.
- Rank sederhana: Bronze → Silver → Gold → Diamond → Master, dengan ghost replay pertandingan.
- **Challenge via link:** kirim URL ke teman → dia masuk lobby **tanpa perlu daftar**. Ini viral loop terkuatmu.

---

## 6. Meta-progression & Retensi

| Sistem | Detail |
| --- | --- |
| **Karakter** | Bukan skin — tiap karakter mulai dengan 1 item tetap berbeda (ala deck Balatro). 6 karakter saat launch, unlock lewat pencapaian. |
| **Ascension tiers** | Menang di tier N unlock tier N+1 dengan modifier (musuh lebih cepat, Toxic lebih banyak, dst). 5 tier. |
| **Daily Challenge** | Semua pemain dunia mendapat seed + urutan item yang sama → leaderboard harian. **Ini senjata retensi #1 (Wordle effect) dan murah dibuat.** |
| **Share card** | Tiap run selesai: generate gambar (og:image) berisi wave tertinggi, build item, DPS → tombol share. Setiap share = iklan gratis. |
| **Streak** | Main 1 run per hari = streak. Jangan hukum berat; reward kosmetik saja. |

### Kenapa gaada yang daftar — perbaikan funnel

1. **Guest play default.** Main langsung tanpa akun. Login Google diminta **setelah run pertama selesai**: "Simpan skor 847 kamu?" — konversi akan jauh lebih tinggi karena sudah ada sesuatu yang dipertaruhkan.
2. **Landing page = game.** Hero section literally playable mini-wave (5 kata). Bukan screenshot + tombol signup.
3. **Time-to-first-key < 10 detik** dari buka domain.

---

## 7. Game Feel & Juice — spesifikasi wajib

> Game ketik dengan mekanik dasar yang membosankan HARUS menang di feel. Ini bukan opsional.
> 

| Momen | Efek |
| --- | --- |
| Huruf benar | Sound ketik memuaskan; **pitch naik seiring streak** (efek Peggle/Balatro — candu neurologis) |
| Huruf benar | Damage number kecil terbang per huruf, bukan per kata |
| Kata selesai | Proyektil besar + hit-stop 40ms + partikel ledakan |
| Typo | Bunyi "salah" yang distinct + layar merah kedip 100ms + streak pitch reset |
| Kill musuh besar | Screen shake proporsional panjang kata |
| Boss mati | Slow-mo 0.3x selama 1 detik + flash putih + shockwave |
| HP < 25% | Vignette merah berdenyut + heartbeat audio + musuh terasa lebih mengancam |
| Combo 10/20/30 | Label muncul dengan scale-up bounce + suara naik satu oktaf |
| Item didapat | Kartu item flip-in dengan glow sesuai rarity (abu → biru → emas) |

**Aturan tampilan:** jangan tampilkan "WPM" sebagai angka mati di tengah game — tampilkan sebagai **DPS** ("247 damage/detik"). WPM asli muncul di layar hasil akhir.

---

## 8. Spesifikasi VFX (implementasi PixiJS)

| Efek | Trigger | Teknik | Durasi |
| --- | --- | --- | --- |
| Muzzle flash | Huruf benar | Sprite partikel 4-frame di ujung "senjata" | 80ms |
| Damage number | Huruf benar | Text object + tween naik + fade (GSAP) | 600ms |
| Ledakan kill | Musuh mati | Particle burst 12–20 partikel + lingkaran expand | 400ms |
| Screen shake | Kill besar / kena damage | Offset container random decay | 150–300ms |
| Hit-stop | Kata selesai | Freeze semua tween/update 40ms | 40ms |
| Slow-mo boss | Boss mati | Time scale global 0.3 → 1 | 1000ms |
| Shockwave | Boss / AoE | `ShockwaveFilter` (pixi-filters) atau mesh circle scale | 500ms |
| Glow item | Rarity rare+ | `GlowFilter` (pixi-filters), warna per rarity | Persisten |
| Chromatic aberration | Boss spawn / ulti | `RGBSplitFilter` singkat | 300ms |
| Vignette bahaya | HP < 25% | Gradient overlay + alpha berdenyut (sin wave) | Persisten |
| Trail proyektil | Proyektil terbang | Garis fade atau `pixi-particles` trail | Selama terbang |
| Toxic explosion | Toxic selesai diketik | Partikel hijau + screen shake + damage number merah ke pemain | 500ms |
| Golden sparkle | Golden spawn | Twinkle partikel emas looping | Selama hidup |

**Prinsip partikel:** satu sistem partikel generic (posisi, velocity, gravity, fade, tint) yang dipakai ulang untuk SEMUA efek di atas. Jangan bikin sistem baru per efek — 50–100 baris kode cukup.

---

## 9. Audio Spec

| Kategori | Detail | Sumber |
| --- | --- | --- |
| Ketikan benar | 1 sample mechanical switch, pitch shift +5% per streak step (max +50%) | Generate/record sendiri atau freesound.org |
| Typo | Buzz pendek 80ms, low-pass — harus "nyebelin tapi fair" | freesound.org |
| Kill | 3 varian ledakan pendek agar tidak repetitif | generate AI (SFXR/ElevenLabs SFX) |
| Musik | Loop synthwave/lo-fi dark 120 BPM; layer intensitas naik per 5 wave (stems) | Generate AI (Suno/Udio) atau library |
| UI | Hover, click, item flip, rarity reveal (semakin rare semakin dramatis) | SFXR |
| Heartbeat | HP < 25% | loop pendek |

Library audio: **Howler.js** (sprite audio + pitch control mudah).

---

## 10. Pipeline Produksi Aset (AI-assisted)

### Art direction

**Satu style, konsisten, murah diproduksi:** pilih salah satu:

- **Opsi A (rekomendasi): Pixel art dark-neon** ala Vampire Survivors — forgiving untuk AI generation, kecil filenya, nostalgik, dan "bocah warnet" friendly.
- Opsi B: Flat vector bold ala Balatro — lebih bersih tapi butuh konsistensi garis yang lebih sulit dari AI.

Palet warna (Opsi A): background gelap `#0D0D1A`, neon primer `#00E5FF` (cyan), aksen musuh `#FF2E63`, Bits/currency `#FFD166`, Toxic `#7CFC00`.

### Daftar aset + prompt AI siap pakai

Gunakan satu tool (Midjourney/DALL-E/Ideogram/Recraft) dengan **style suffix yang sama di semua prompt**: `"pixel art, dark neon palette, cyan and magenta glow, 2D game sprite, plain black background, crisp pixels, no text"`

| Aset | Jumlah | Ukuran | Prompt dasar |
| --- | --- | --- | --- |
| Musuh Runner | 6 varian | 64×64 | `"small fast alien runner creature, {suffix}"` |
| Musuh Tank | 4 varian | 128×128 | `"hulking armored mech enemy, slow heavy, {suffix}"` |
| Musuh Healer | 2 varian | 64×64 | `"floating drone with green healing aura, {suffix}"` |
| Golden enemy | 2 varian | 64×64 | `"golden shimmering creature, treasure-like, {suffix}"` |
| Toxic enemy | 2 varian | 64×64 | `"toxic slime creature, glowing green, dangerous, {suffix}"` |
| Boss | 4 | 256×256 | `"massive boss {compiler machine / ghost typewriter / mirror entity / final monologue god}, {suffix}"` |
| Icon item | 40 | 64×64 | `"game item icon: {nama item, mis. sniper scope / coffee sachet}, {suffix}"` |
| Background parallax | 4 layer × 3 tema | 1920×1080 per layer | `"parallax background layer, cyberpunk city silhouette, far distance, {suffix}"` |
| Karakter pilihan | 6 | 128×128 | `"character portrait, keyboard warrior theme, {suffix}"` |
| Partikel | 1 sheet | 256×256 | `"particle sprite sheet: spark, circle, star, glow dot, {suffix}"` |

### Workflow produksi aset (5 langkah)

1. **Generate batch** — 1 sore untuk semua prompt di atas, generate 4 kandidat per aset.
2. **Kurasi** — pilih yang paling konsisten; jangan campur 2 style walau bagus.
3. **Post-process seragam** — naikkan saturasi +15%, terapkan color grading sama (biar hasil beda prompt tetap nyatu), hapus background, downscale ke ukuran target (downscale menyembunyikan artifact AI dan menguatkan kesan pixel art).
4. **Sprite sheet** — gabung via TexturePacker atau free alternative (Free Texture Packer); animasi jalan cukup 2–4 frame per musuh.
5. **Kompres** — WebP atau PNG quantized (pngquant); total seluruh aset game target **< 3MB** supaya first load cepat (ingat: time-to-first-key < 10 detik).

---

## 11. Tech Stack (final)

| Kebutuhan | Pilihan | Alasan |
| --- | --- | --- |
| Renderer 2D | **PixiJS (tetap)** | Sudah tepat; performa bukan bottleneck — game feel adalah bottleneck |
| Tween/animasi UI | GSAP | Juice murah dan cepat dibuat |
| Audio | Howler.js | Pitch shifting untuk streak, sprite audio |
| Post-processing | pixi-filters | Glow, shockwave, RGB split, bloom |
| Partikel | Custom ~100 baris atau pixi-particles | Satu sistem generic untuk semua VFX |
| Networking 1v1 | WebSocket (Colyseus atau native + partykit) | Authoritative server sederhana untuk anti-cheat |
| Share card | Satori/og-image di server | Auto-generate gambar hasil run |

**Keputusan: TIDAK pakai Three.js.** 3D untuk typing game = 3x kerja, 0x fun. Juga tidak migrasi ke Phaser/Kaplay sekarang — buang momentum; PixiJS + library di atas sudah cukup sampai 100k pemain.

---

## 12. Roadmap Sprint (prioritas = urutan pengerjaan)

| Sprint | Deliverable | Kriteria selesai |
| --- | --- | --- |
| **1. Juice** | Sound per huruf + pitch streak, damage number per huruf, screen shake, hit-stop, ledakan kill | Main 5 menit terasa "mahal" walau konten masih sedikit |
| **2. Decision layer** | 5 tipe musuh pertama (Runner, Tank, Golden, Toxic, Healer) + spawn table per wave | Pemain test bilang "aku mikir mau ngetik yang mana dulu" |
| **3. Items v1** | 20 item pertama (10 common, 8 rare, 2 legendary) + pilih-1-dari-3 tiap 3 wave | 2 build berbeda terasa berbeda cara mainnya |
| **4. Funnel** | Guest play, landing playable, login setelah run 1, share card | Dari URL ke ngetik < 10 detik |
| **5. Daily** | Daily challenge + leaderboard harian + streak | Alasan balik tiap hari |
| **6. Boss** | 2 boss pertama (The Compiler, Ghost Writer) | Momen clipable pertama |
| **7. 1v1** | Real-time versus, kirim-junk, rematch, challenge link | Viral loop aktif |
| **8. Meta** | Karakter, ascension, sisanya 20 item | Konten untuk 50+ run |

**Aturan keras: marketing agresif (Product Hunt, dsb) hanya setelah sprint 5.** Launch sebelum retention loop jadi = buang peluru satu-satunya.

---

## 13. Metrik yang diukur (analytics)

| Metrik | Target | Artinya |
| --- | --- | --- |
| Time-to-first-key | < 10 detik | Funnel sehat |
| Run completion (run pertama) | > 40% | Tutorial & difficulty curve benar |
| "Run lagi" rate | > 50% langsung klik | Candu bekerja |
| D1 retention | > 25% | Daily challenge bekerja |
| Guest → signup conversion | > 30% | Timing permintaan login tepat |
| Share rate | > 5% run selesai | Share card menarik |
| 1v1 rematch rate | > 60% | Mode versus sehat |

---

## 14. Prinsip penutup

> **Sekarang: typing test yang dikasih kostum game.**
> 

> **Target: game yang kebetulan dikontrol pakai keyboard.**
> 

> 
> 

> Kalau setiap detik pemain berpikir, setiap run punya cerita, dan setiap kill terasa memuaskan — orang akan daftar sendiri tanpa disuruh.
