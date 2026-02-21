# Typecade — Full Prompt untuk Web Typing Game

---

## KONTEKS & TUJUAN

Buat aplikasi web typing game bernama **Typecade** — sebuah platform latihan dan kompetisi mengetik yang menggabungkan keeleganan minimalis Monkeytype dengan fitur multiplayer sosial dari 10FastFingers, ditambah modul pembelajaran mengetik untuk pemula dari nol.

Target audience: pelajar, programmer, content writer, dan siapa saja yang ingin meningkatkan kecepatan & akurasi mengetik mereka. Aplikasi ini harus terasa **smooth, cepat, responsif**, dan tidak terlihat seperti template atau AI-generated — setiap detail harus terasa *crafted with intention*.

**Tahap ini adalah frontend-only (static)** — tidak ada koneksi ke server, database, atau API. Semua data bersifat lokal / dummy. Fokus utama adalah UI/UX dan fungsionalitas core yang benar-benar bekerja.

---

## DESIGN DIRECTION

### Visual Identity
- **Tema**: Dark mode utama dengan aksen warna amber/gold (`#F5A623`) dan off-white (`#E8E3D9`) di atas background gelap charcoal (`#0F0F0F` / `#141414`)
- **Tipografi**: 
  - Display / heading: `"Syne"` atau `"Space Grotesk"` — bold dan berkarakter
  - Typing area (teks yang diketik): `"JetBrains Mono"` atau `"Fira Code"` — monospace yang nyaman dibaca
  - UI body: `"DM Sans"` — bersih dan modern
- **Feel**: Seperti code editor meets arcade game. Terasa premium tapi tidak pretentious. Dark, focused, clean.
- **Motion**: Semua transisi menggunakan `cubic-bezier(0.22, 1, 0.36, 1)` untuk feel yang smooth dan natural. Tidak ada animasi yang berlebihan — hanya pada momen yang berarti (cursor blink, karakter benar/salah, hasil selesai).
- **Karakter unik**: Ada subtle noise texture di background, cursor mengetik yang custom, dan progress bar yang smooth. Nuansa "hacker aesthetic" yang bersih.

---

## STRUKTUR HALAMAN & NAVIGASI

Aplikasi ini adalah **Single Page Application (SPA)** — navigasi antar halaman tidak reload browser, semua transisi mulus dengan fade/slide.

### Layout Utama
```
[Navbar minimal — Logo kiri | Nav tengah | Settings kanan]
[Content Area — berubah sesuai mode aktif]
[Footer minimal — stats session hari ini]
```

### Halaman / View yang Dibutuhkan:
1. **Home / Typing Test** (halaman utama)
2. **Multiplayer Lobby** (list room & buat room)
3. **Multiplayer Race** (tampilan race real-time)
4. **Learn to Type** (modul pemula)
5. **Profile & Stats** (history & progress personal)
6. **Leaderboard** (top scores)

---

## DETAIL SETIAP HALAMAN

---

### 1. HOME — TYPING TEST

Ini adalah inti dari aplikasi. Inspirasinya dari Monkeytype tapi dengan sentuhan personal.

**Layout:**
- Center-aligned, konten tidak lebih lebar dari `800px`
- Background gelap dengan noise texture halus
- Teks besar dan terfokus — tidak ada distraksi

**Mode Selector (pill tabs di atas area ketik):**
```
[Words] [Quote] [Time] [Custom]          [ID 🇮🇩] [EN 🇬🇧]
```

**Sub-options (muncul sesuai mode):**
- Words: `[10]  [25]  [50]  [100]`
- Time: `[15s]  [30s]  [60s]  [120s]`
- Difficulty: `[Easy]  [Medium]  [Hard]`

**Area Mengetik:**
- Tampilkan 3 baris teks sekaligus (baris pertama aktif, dua berikutnya preview samar)
- Teks yang sudah diketik benar: warna `#F5A623` (amber)
- Teks yang salah: background merah gelap `#3D1515`, teks `#FF6B6B`
- Teks belum diketik: warna abu `#4A4A4A`
- Cursor: blinking line `|` berwarna amber, bukan block cursor
- Smooth scroll ke baris berikutnya saat ganti baris (tidak jump)
- Font size `1.4rem`, line height `2.2`, letter spacing `0.02em`
- Klik area typing → langsung fokus ke input tersembunyi

**Live Stats (muncul saat mulai mengetik, di bawah teks):**
```
WPM: 84    Accuracy: 97%    Time: 0:23    Progress: ████████░░ 78%
```
Angka WPM update setiap detik dengan animasi counter yang smooth.

**Hasil Selesai (overlay atau section baru yang slide in):**
```
        ──────────────────────
              84 WPM
         ━━━━━━━━━━━━━━━━━━━
         Accuracy    97%
         Characters  423/436
         Errors      13
         Time        60s
         Consistency ████████░░ 84%
        ──────────────────────
        [Retry ↺]   [Share]   [Next →]
```
Ada grafik mini WPM over time (line chart sederhana) yang menunjukkan konsistensi speed.

**Keyboard shortcut:**
- `Tab + Enter` → restart dengan teks baru
- `Esc` → reset/restart
- Saat mengetik, klik apapun selain typing area tidak interrupt session

---

### 2. MULTIPLAYER LOBBY

**Layout dua kolom:**
- Kiri: Form buat room baru
- Kanan: List room yang tersedia (cards)

**Card setiap room:**
```
┌─────────────────────────────┐
│  🏎  SpeedRace #4821         │
│  Host: TypingNinja           │
│  Players: 3/5  ●●●○○         │
│  Language: EN  |  Medium     │
│  Status: Waiting...          │
│                   [Join →]   │
└─────────────────────────────┘
```

**Buat Room Form:**
- Nama room (auto-fill dengan random fun name)
- Max players (2-8)
- Bahasa (ID/EN)
- Difficulty
- Mode (Words/Quote)
- Toggle: Private room (pakai kode 6 digit)

**Room code:** 6 karakter alfanumerik kapital, styling seperti OTP input — kotak terpisah untuk tiap karakter, terlihat premium.

---

### 3. MULTIPLAYER RACE

Ini halaman paling kompleks dan paling seru.

**Layout:**
```
┌──────────────────────────────────────┐
│  Room: SpeedRace #4821   Time: 00:45  │
├──────────────────────────────────────┤
│  PLAYER LANES:                        │
│                                        │
│  🟡 You (TypingNinja)                  │
│  ████████████████████░░░░  84 WPM     │
│                                        │
│  🔵 FastFingers99                      │
│  ██████████████░░░░░░░░░░  67 WPM     │
│                                        │
│  🟢 CodeMonkey                         │
│  ██████████░░░░░░░░░░░░░░  52 WPM     │
│                                        │
│  🔴 Keyboard_Slayer                    │
│  ████████████████████████  FINISHED ✓ │
├──────────────────────────────────────┤
│  [TYPING AREA DI BAWAH]               │
└──────────────────────────────────────┘
```

**Progress bar** tiap player: smooth CSS transition, update real-time. Warna unik per player (kuning, biru, hijau, merah, ungu).

**Countdown sebelum mulai:**
- Full-screen overlay dengan countdown `3... 2... 1... GO!`
- Animasi scale + fade yang impactful
- Sound effect (opsional, bisa dimatikan)

**Saat ada yang finish:**
- Banner kecil muncul: `🏆 Keyboard_Slayer finished! (1st - 78 WPM)`

**Hasil akhir (setelah semua finish atau waktu habis):**
```
         🏆 RACE RESULTS
    ─────────────────────────
    1st  Keyboard_Slayer  92 WPM  98% acc
    2nd  TypingNinja      84 WPM  97% acc
    3rd  FastFingers99    67 WPM  94% acc
    4th  CodeMonkey       52 WPM  89% acc
    ─────────────────────────
    [Play Again]   [New Room]   [Home]
```

---

### 4. LEARN TO TYPE (Modul Pemula)

Ini yang membedakan Typecade dari kompetitor — ada jalur pembelajaran terstruktur.

**Curriculum Tree (visual seperti Duolingo tapi lebih minimal):**
```
  MODULE 1: Home Row Keys
  ○ Lesson 1.1 — Pengenalan ASDF JKL;
  ○ Lesson 1.2 — Latihan A & F
  ○ Lesson 1.3 — Kombinasi ASDF
  ● Lesson 1.4 — Review & Test    ← locked sampai lulus
  
  MODULE 2: Top Row Keys
  ⬡ (locked)
  
  MODULE 3: Bottom Row Keys
  ⬡ (locked)
  
  MODULE 4: Numbers & Symbols
  ⬡ (locked)
```

**Tampilan Lesson:**
Bagi dua bagian:
- **Kiri/Atas**: Keyboard visual interaktif (SVG) yang menyala. Key yang harus ditekan highlight dengan warna amber, tangan/jari yang benar ditampilkan sebagai hint (finger indicator di bawah keyboard).
- **Kanan/Bawah**: Area latihan dengan kata-kata yang terbatas sesuai tombol yang sudah dipelajari.

**Keyboard visual:**
- SVG keyboard QWERTY
- Saat user menekan tombol yang benar → tombol menyala hijau sebentar
- Saat salah → menyala merah + shake ringan
- Tombol yang belum dipelajari: tampil redup/greyed out

**Progress per lesson:**
```
Lesson 1.1  ●●●●●●●●●●  100%  ✓  (Stars: ★★★)
Lesson 1.2  ●●●●●●●░░░  70%   
Lesson 1.3  ○○○○○○○○○○  0%    (locked)
```
Stars: 1 star = selesai, 2 star = >80% accuracy, 3 star = >95% accuracy + speed target

**Instruksi per lesson:**
Kotak instruksi di atas yang menjelaskan tombol apa yang dipelajari, posisi jari yang benar, dan tips singkat. Bahasa Indonesia untuk mode ID, English untuk mode EN.

---

### 5. PROFILE & STATS

**Header Profile:**
```
  [Avatar placeholder]
  Username: TypingNinja
  Member since: Jan 2025
  
  ──── Personal Best ────
  WPM: 94   |   Accuracy: 98.2%   |   Tests: 847
```

**Grafik Progres:**
- Line chart WPM over last 30 hari
- Bar chart accuracy per sesi
- Heatmap aktivitas (seperti GitHub contributions) — seberapa sering latihan per hari

**Stats Detail:**
```
  Average WPM (all time)     : 72
  Average WPM (last 10 tests): 81
  Average Accuracy           : 96.4%
  Total Time Typed            : 14h 23m
  Total Words Typed           : 48,392
  Favorite Mode               : Time 60s
  Preferred Language          : English
```

**History Table:**
```
  Date        Mode      WPM   Accuracy   Duration
  2025-01-15  Time 60s  84    97%        1 min
  2025-01-15  Words 50  78    96%        45 sec
  2025-01-14  Quote     91    98%        1m 12s
```
Sortable, searchable, dengan pagination.

---

### 6. LEADERBOARD

**Tab filter:**
```
[All Time]  [This Week]  [Today]     [Words]  [Time]  [Quote]
```

**Table:**
```
Rank  User              WPM   Accuracy  Tests
────────────────────────────────────────────
🥇 1  CodeWizard        156   99.1%     2,341
🥈 2  UltraTyper        148   98.7%     1,892
🥉 3  SpeedDemon        142   97.3%     4,201
   4  TypingNinja (you) 94    98.2%     847
   ...
```

Highlight row "you" dengan warna berbeda.

---

## KOMPONEN UI GLOBAL

### Navbar
```
[T] Typecade          [Test] [Multiplayer] [Learn] [Board]          [⚙] [👤]
```
- Logo kiri: huruf `T` dalam kotak amber kecil + wordmark
- Active link: underline amber animasi
- Mobile: hamburger menu dengan slide-in drawer
- Settings icon → dropdown: theme toggle, sound toggle, caret style, font size

### Settings Panel (slide-in dari kanan)
```
  ─── Appearance ───
  Theme        [Dark ●] [Light]
  Font Size    [◀] 1.4rem [▶]
  Font Family  [JetBrains Mono ▾]
  
  ─── Typing ───
  Caret Style  [Line ●] [Block] [Underscore]
  Sound        [Off ●] [Soft] [Mechanical]
  Live WPM     [Show ●] [Hide]
  Smooth Caret [On ●] [Off]
  
  ─── Language ───
  Interface    [Indonesia ●] [English]
```

### Notifications / Toast
- Muncul di pojok kanan bawah
- Style: rounded pill, dark bg dengan border subtle
- Contoh: `✓ New personal best! 84 WPM` (warna amber)
- Auto-dismiss setelah 3 detik dengan slide-out animation

---

## FUNGSIONALITAS CORE YANG HARUS BEKERJA (Frontend Only)

### Engine Typing Test
- [ ] Input detection yang presisi — tidak ada lag antara ketukan dan respons visual
- [ ] Deteksi kata benar/salah karakter per karakter
- [ ] Kalkulasi WPM: `(karakter benar / 5) / (waktu dalam menit)`
- [ ] Kalkulasi Accuracy: `(karakter benar / total karakter diketik) * 100`
- [ ] Timer countdown (untuk mode Time) dan stopwatch (untuk mode Words/Quote)
- [ ] Auto-detect ganti kata saat spasi ditekan
- [ ] Tidak bisa backspace ke kata sebelumnya (opsi toggle)
- [ ] Smooth scroll baris saat pindah ke baris berikutnya
- [ ] Restart dengan `Tab + Enter` atau klik tombol retry

### Dummy Multiplayer (tanpa server)
- [ ] Buat room → generate kode 6 digit random
- [ ] "Simulasi" 3 bot player dengan WPM dan progress random yang bergerak secara realistis
- [ ] Countdown 3-2-1-GO animasi
- [ ] Progress bar semua player update smooth
- [ ] Hasil akhir dengan ranking

### Learn Module
- [ ] Keyboard SVG yang responsive dan interaktif
- [ ] Highlight tombol yang harus ditekan
- [ ] Deteksi keypress yang benar/salah
- [ ] Progress disimpan di localStorage
- [ ] Star rating per lesson

### Stats (LocalStorage)
- [ ] Simpan setiap hasil test ke localStorage
- [ ] Kalkulasi average, best, consistency dari history lokal
- [ ] Grafik sederhana dari data lokal (bisa pakai Chart.js atau SVG manual)

---

## TECHNICAL SPECS

```
Framework   : Next.js 16+ (App Router)
Styling     : Tailwind CSS + CSS custom properties untuk theming
Animation   : Framer Motion untuk transisi halaman, CSS keyframes untuk micro-interactions
Charts      : Recharts atau Chart.js untuk grafik stats
Icons       : Lucide React
Fonts       : Google Fonts (Syne/DM Sans/JetBrains Mono)
State       : Zustand atau React Context
Storage     : localStorage untuk stats & settings lokal
Deployment  : Cloudflare Pages
```

---

## PERILAKU & UX DETAIL

- **First load**: Langsung fokus ke typing area — user bisa langsung ngetik tanpa klik apapun
- **No disruption**: Notifikasi, animasi, atau elemen apapun tidak boleh menginterrupt sesi mengetik aktif
- **Keyboard-first**: Semua fungsi utama bisa diakses via keyboard shortcut
- **Responsive**: Mobile-friendly, tapi typing test di mobile adalah secondary experience (ada warning halus bahwa best experience di desktop)
- **Accessibility**: Proper `aria-label`, focus states yang visible, color contrast WCAG AA
- **Performance**: Tidak ada layout shift, typing response < 16ms, transisi 60fps
- **Error handling**: Kalau localStorage penuh, graceful degrade — stats tetap tampil meskipun tidak bisa disimpan

---

## TONE & COPY

Semua teks dalam aplikasi harus terasa:
- **Direct, tidak bertele-tele** — "Start typing to begin" bukan "Please start typing to begin your session"
- **Encouraging tanpa berlebihan** — "New best! 84 WPM" bukan "Wow amazing incredible new record!!!"
- **Technical tapi accessible** — gunakan istilah WPM, accuracy, consistency tapi selalu ada tooltip penjelasan singkat

Tagline: *"Type faster. Think clearer."*

---

## YANG TIDAK BOLEH ADA

- Tidak ada modal popup yang meminta login/signup di awal
- Tidak ada iklan atau placeholder iklan
- Tidak ada animasi yang terjadi saat user sedang aktif mengetik
- Tidak ada loading spinner yang tidak perlu
- Tidak ada warna purple/violet — sudah terlalu generic
- Tidak ada design yang terlihat seperti Bootstrap atau Material UI default
- Tidak ada font Comic Sans, Arial, atau Roboto