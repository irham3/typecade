# 🕹️ TYPECADE: MASTER GAME DESIGN DOCUMENT (GDD) — FULL EDITION

**Typecade** adalah game *2.5D Action-Typing Roguelike Endless Survival* yang menggabungkan sensasi *flow state* mengetik cepat ala **Monkeytype** dengan kepungan ratusan monster tanpa akhir dan progresi *level-up* adiktif ala **Vampire Survivors**, dibalut estetika visual HD-2D (*Octopath Traveler*).

---

## 📘 BAGIAN 1: IDENTITAS PROYEK & ATURAN EMAS UX (CORE BRIEF)

* **Judul Resmi:** **Typecade**
* **Genre:** 2.5D Endless Action-Typing Roguelike Survival
* **Tagline:** *The Flow State Typing Roguelike — Unleash Your WPM.*
* **Target Platform:** Web Browser (Instant Play via Three.js / WebGL) & Desktop (Steam via Tauri/Electron).
* **4 Aturan Emas Desain (*Zero-Friction UX*):**
1. **Hands Locked on Home Row:** Selama permainan berlangsung (baik saat bertarung, memakai skill, maupun memilih *upgrade* saat *level up*), jari pemain **tidak pernah** menyentuh tombol panah (*arrow keys*), WASD, atau *mouse*.
2. **Combat-Driven Movement (*Auto-Dash*):** Tidak ada kata navigasi pasif seperti "PINDAH". Setiap kali pemain menyelesaikan kata di atas kepala musuh, ksatria otomatis meluncur cepat (*dash*) menebas target tersebut dan menggeser posisi kamera di arena terbuka.


3. **Dual-Phase Pacing (Anti-Gimmick):**
* *Fase Normal (Endless Horde):* Layar bawah bersih dari kotak teks besar. Mata pemain fokus 100% ke arena pertarungan untuk mengetik kata di atas musuh terdekat, memicu jebakan lingkungan, dan mengumpulkan permata XP.


* *Fase Boss Stagger (Monkeytype Overdrive):* Kotak paragraf panjang ala *Monkeytype* **hanya terbuka** ketika pertahanan berlapis Boss hancur (`ARMOR BREAK!`), memberikan waktu 10 detik bagi pemain untuk memacu WPM setinggi mungkin.




4. **Bilingual Word Engine (EN / ID):** Mendukung penuh kosakata Bahasa Inggris (kata pendek 1–2 suku kata untuk kecepatan kompetitif global) dan Bahasa Indonesia (untuk keterbacaan lokal).



---

## ♾️ BAGIAN 2: CORE LOOP — ENDLESS SURVIVAL & SISTEM LEVELLING

Gameplay utama **Typecade** dirancang sebagai **Endless Run & Leveling Loop** di mana pemain bertahan hidup selama mungkin melawan gelombang monster yang semakin padat, sambil meracik *build* karakter yang semakin *overpowered* (OP).

### 1. Siklus Utama Permainan (*The Endless Loop*)

1. **Spawn & Terjang Kerumunan:** Ksatria berada di tengah arena *infinite scrolling* (reruntuhan kastil/dungeon yang tak berujung). Musuh datang dari 360 derajat.


2. **Ketik & Tebas (*Dash-and-Slash*):** Mengetik kata pada musuh membuat ksatria meluncur membelah musuh tersebut.


3. **Loot XP Gems & Gold:** Setiap musuh yang tewas menjatuhkan **Permata XP** (Hijau, Biru, Ungu) dan **Koin Emas** ke lantai arena. Saat ksatria melakukan *dash* melewati area tersebut, permata XP otomatis tersedot masuk ke bar **`xp`** di pojok kanan atas layar.


* *Streak Magnet Bonus:* Setiap kali *Streak* ketikan tanpa salah mencapai kelipatan **50x** (misal `STREAK: 57x` dengan efek api menyala), gelombang magnet otomatis menyedot seluruh permata XP yang berserakan di layar!




4. **Level Up & Draft Upgrade (Tanpa Mouse):** Begitu bar `xp` penuh, level karakter naik dan pemain memilih 1 dari 3 berkah/evolusi dengan cara mengetik kata kuncinya.
5. **Eskalasi Tanpa Akhir (*Endless Scaling*):** Semakin tinggi menit bertahan dan level pemain, semakin banyak musuh Elite berlapis dan Boss yang bermunculan hingga pemain kehabisan HP.

### 2. Mekanisme "Type-to-Pick" saat Level Up (Zero-Mouse Upgrade UI)

Saat bar `xp` di kanan atas penuh, waktu di arena berhenti sejenak (*Tactical Freeze*) dan muncul **3 Kartu Upgrade Roguelike** di tengah layar. Pemain tidak perlu memegang *mouse*—cukup ketik kata kunci pendek di bawah kartu yang diinginkan:

```text
+-------------------------------------------------------------------------+
|                        ✨ LEVEL UP! (LEVEL 12) ✨                       |
|             Ketik kata kunci berwarna untuk memilih Upgrade:            |
|                                                                         |
|  +---------------------+  +---------------------+  +-----------------+  |
|  |  ⚔️ [SAPU] LV. 2    |  |  ⚡ CHAIN LIGHTNING |  | 🧲 XP MAGNET +  |  |
|  |  Radius tebasan     |  |  Setiap huruf ke-10 |  | Jarak sedot XP  |  |
|  |  +40% & kupas       |  |  menyambar 2 musuh  |  | +50% & Bonus    |  |
|  |  2 Lapis Armor!     |  |  acak di layar!     |  | WPM XP +20%!    |  |
|  |                     |  |                     |  |                 |  |
|  |   Ketik: [UP-SAPU]  |  |   Ketik: [PETIR]    |  |  Ketik: [MAGNET]|  |
|  +---------------------+  +---------------------+  +-----------------+  |
+-------------------------------------------------------------------------+

```

### 3. Katalog Upgrade, Evolusi Skill, & Relic Pasif (Build Synergies)

Agar setiap sesi *Endless* terasa berbeda dan bikin ketagihan, terdapat 3 kategori *upgrade* yang bisa dikombinasikan:

| Kategori Upgrade | Nama Upgrade / Relic | Efek Mekanik terhadap Ketikan & Tempur |
| --- | --- | --- |
| **A. Evolusi Kartu Skill Aktif** | **Crimson Cleave** (`[SAPU]` Max Evo) | Mengubah `[SAPU]` menjadi badai pedang merah yang mengupas **2 lapis darah** sekaligus dan menyedot seluruh XP gem di layar.

 |
| *(Meningkatkan 3 skill di bawah layar)* | **Absolute Zero** (`[BADAI]` Max Evo) | `[BADAI]` tidak hanya memberikan *damage* area, tetapi membekukan semua musuh yang selamat selama 5 detik dan memotong panjang kata mereka menjadi separuhnya.

 |
|  | **Divine Aegis** (`[SEMBUH]` Max Evo) | Selain memulihkan 2 hati (HP), memberikan perisai kebal serangan (*invulnerability*) selama 4 detik.

 |
| **B. Relic Pasif Berbasis Huruf** | **Thocky Mechanical Switch** | Setiap kamu menekan **huruf terakhir** dari sebuah kata (atau tombol *Spacebar*), ksatria memancarkan gelombang kejut yang mendorong mundur (*knockback*) semua kroco di dekatnya. |
| *(Otomatis aktif saat mengetik biasa)* | **Vowel Spitfires (A-I-U-E-O)** | Setiap kali kamu mengetik huruf vokal (`a, i, u, e, o`), ksatria otomatis menembakkan bola api kecil ke musuh kroco acak tanpa perlu mengincarnya! |
|  | **100+ WPM Overclock** | Selama kecepatan mengetikmu bertahan di atas **100 WPM**, kecepatan *recovery* Mana dan pengurangan Cooldown skill meningkat **2x lipat**.

 |
| **C. Modifikasi Kata (Lexicon Relics)** | **Programmer's Glasses** | Menghapus semua karakter simbol rumit (`!`, `_`, `-`) pada musuh *Cursed Mage* dan *Bomber* (misal `[hex_bolt!]` disederhanakan menjadi `[hexbolt]`), membuat jari jauh lebih santai. |
| *(Mengubah aturan teks musuh)* | **Execute Shortener** | Lapis darah terakhir (`[x1]`) dari semua musuh Elite dan Mini-Boss selalu dipangkas menjadi **maksimal 3 huruf saja** (contoh: `CUT`, `END` / `MATI`). |

### 4. Kurva Kesulitan Tanpa Batas (*Endless Scaling Timeline*)

Dalam mode utama *Endless*, permainan tidak berhenti di satu lantai, melainkan terus berlanjut melewati zona bioma yang bergeser otomatis sambil meningkatkan intensitas:

* **Menit 00:00 – 02:30 (Warm-Up Phase):** Musuh didominasi Tengkorak dan Goblin Kroco (1 lapis darah, kata 3–5 huruf kecil). Fokus pemain adalah menaikkan 3–5 level pertama dan membangun *Streak*.


* **Menit 02:30 – 04:59 (Tactical Escalation):** Muncul musuh Elite berlapis (`[x3] HANCURKAN`), tengkorak pembawa bom waktu (`[detonate-3]`), dan penyihir kutukan (`[hex_bolt!]`).


* **Setiap Kelipatan 5 Menit (05:00, 10:00, 15:00... — Boss Anomaly):** Muncul Boss raksasa (seperti *Obsidian Minotaur Boss*) langsung di tengah arena terbuka! Mengalahkannya lewat fase *Monkeytype Overdrive* akan menjatuhkan **Peti Relik Legendaris** dan menggeser arena ke bioma berikutnya.


* **Menit 15:00 – $\infty$ (True Endless / Leaderboard Push):** Kecepatan gerak kerumunan meningkat, musuh Elite memiliki hingga `[x5]` lapis armor, dan kosakata yang muncul di atas kepala musuh mulai menggunakan kata-kata panjang (8–12 huruf) untuk menguji batas maksimal WPM pemain di papan peringkat dunia (*Global Leaderboard*).

---

## ⚔️ BAGIAN 3: MEKANIK TEMPUR, MUSUH, & SKILL ("TAB-TO-CAST")

### 1. Kamus Tipe Musuh & Darah Berlapis (Bilingual EN / ID)

Supaya layar tidak berantakan saat dikepung 50+ musuh, sistem menerapkan **Smart Inner-Ring Queue**: hanya 4–6 musuh terdekat atau objek paling berbahaya yang memunculkan teks kata di atas kepalanya. Begitu satu musuh tewas, teks langsung muncul di musuh barisan belakangnya.

| Tipe Musuh / Objek | Struktur Darah & Aturan Ketik | 🇬🇧 Opsi Bahasa Inggris | 🇮🇩 Opsi Bahasa Indonesia | Efek Saat Kata Selesai Diketik |
| --- | --- | --- | --- | --- |
| **1. Kroco (Trash Mobs)** | 1 Bar Merah (Huruf kecil pendek) | `slash`, `strike`, `cut` | `tebas`, `sabet`, `hajar`<br> | Ksatria langsung *dash* membelah musuh dalam sekali tebas dan menjatuhkan XP gem.

 |
| **2. Shielded Mob** | Diawali **Huruf Kapital (`Shift`)** | `Guard`, `Shatter`, `Break` | `Perisai`, `Hantam`, `Besi` | Menekan `Shift` memberikan sensasi ayunan berat untuk memecah tameng kayu/besi. |
| **3. Elite / Tank (Multi-Layer)** | 2–4 Bar Bertumpuk (Biru: Perisai, Kuning: Armor, Merah: HP)

 | `[x3] CRUSH` $\rightarrow$ `[x2] BREAK` $\rightarrow$ `[x1] EXECUTE`<br> | `[x3] HANCURKAN` $\rightarrow$ `[x2] TEMBUS` $\rightarrow$ `[x1] EKSEKUSI`<br> | Setiap 1 kata selesai, 1 bar warna teratas pecah (`SHATTER!`) dan teks langsung berganti ke kata berikutnya tanpa jeda.

 |
| **4. Bomber / Mecha** | Mengandung **Angka (`0-9`)** | `[detonate-3]`, `[bot-09]`<br> | `[ledak-3]`, `[mesin-09]` | Jika diketik sebelum hitung mundurnya habis, bom meledak menghancurkan kroco di sekitarnya.

 |
| **5. Cursed Mage** | Mengandung **Simbol (`! _ - @`)** | `[hex_bolt!]`, `[void_orb!]`<br> | `[kutuk_petir!]`, `[mantra!]` | Membalikkan proyektil sihir ungu kembali ke kerumunan musuh dan menjatuhkan *Mana Crystal* biru.

 |
| **6. Objek Lingkungan** | Teks Pemicu Warna Merah/Emas | `[IGNITE]` (Tong), `[LOOT]` (Peti) | `[LEDAKKAN]` (Tong), `[BUKA]` (Peti)

 | Berfungsi sebagai *skill* gratis di arena untuk meledakkan area atau menarik harta karun.

 |

### 2. Sistem Skill "Tab-to-Cast" & Aturan Anti-Bingung

Untuk menghindari ketidaksengajaan mengetik nama skill saat sedang menargetkan musuh, seluruh skill aktif diakses melalui tombol **`Tab`** (mudah dijangkau jari kelingking kiri):

1. **Tekan `Tab` (Masuk *Skill Mode*):**
* Waktu di dalam game melambat **50% (*Tactical Slow-Mo*)** dengan kubah aura biru di sekitar ksatria.


* Jika pemain sedang mengetik kata musuh setengah jalan (contoh: `CrU|sh` pada Minotaur), progres ketikan tersebut **dikunci/di-pause otomatis** (tidak hilang).


* Tiga kartu skill di bawah layar terangkat naik dan siap diketik: **`[CLEAVE]` / `[SAPU]**`, **`[STORM]` / `[BADAI]**`, dan **`[HEAL]` / `[SEMBUH]**`.




2. **Efek *Top-Down Armor Shred* (Tanpa Merusak Ketikan Aktif):**
* Saat `[CLEAVE]` / `[SAPU]` diketik, gelombang tebasan memotong **1 lapis darah** dari seluruh musuh di sekitar ksatria.


* Semua kroco (1 lapis) langsung musnah menjadi lautan XP gem.
* Untuk musuh Elite yang punya 3 lapis (`[x3]`), perisai biru teratasnya langsung pecah menjadi **`[x2]`**, namun **kata yang sedang kamu ketik (`CrU|sh`) tidak berubah** supaya jarimu tidak bingung saat keluar dari mode `Tab`! Kata terakhir di antreanlah yang dihapus.




3. **Word-Driven Cooldown:**
* Setelah skill dipakai, kartu masuk masa *cooldown* yang dihitung berdasarkan **jumlah kata yang diselesaikan** (contoh: `[COOLDOWN: 3w]` / `Ketik 3 kata`). Semakin cepat kamu membunuh musuh dengan WPM tinggi, semakin cepat skill bisa dipakai kembali!





### 3. Fase Boss Fight: "ARMOR BREAK!" & Monkeytype Overdrive Box

Saat Boss muncul di menit ke-5, 10, atau 15:

1. **Fase Pengupasan Perisai:** Boss memiliki beberapa lapis perisai yang harus dipecahkan lewat ketikan kata di atas kepalanya sambil menghindari kroco.
2. **Fase Stagger (`ARMOR BREAK!`):** Begitu perisai Boss habis, Boss jatuh berlutut tak berdaya dengan bintang *stun* selama beberapa detik (contoh: `STAGGER: 06.4s`).


3. **Kemunculan Kotak Paragraf Monkeytype:** Tiga kartu skill di bawah bergeser turun dan digantikan oleh **Kotak Paragraf Panjang ala Monkeytype**.


* Pemain memacu kecepatan ketik murni (120–150+ WPM) pada kalimat cerita/mantra di kotak tersebut.


* **Visual Feedback Brutal:** Setiap karakter huruf yang berhasil diketik meluncurkan tebasan bayangan pedang (*phantom slash*) ke tubuh Boss yang berlutut, memunculkan rentetan angka **`999 CRIT!`** dan **`+250 XP`**.


* Di dalam paragraf tersebut juga terselip kata kunci *Ultimate* berwarna ungu seperti **`[BLIZZARD]`** yang otomatis menjatuhkan badai es raksasa begitu selesai diketik di dalam kalimat!





---

## 🌐 BAGIAN 4: RAGAM MODE PERMAINAN (SINGLEPLAYER, DOJO, & MULTIPLAYER 4+)

Selain mode utama **Endless Survival (Singleplayer)**, **Typecade** menyediakan mode latihan dan 3 mode *Multiplayer* kompetitif/kooperatif untuk 2 hingga 4+ pemain sekaligus:

1. **Practice Mode — Typing Dojo:**
* Ruangan latihan tenang bersama NPC **Sensei** dan boneka kayu **`[x3] TRAINING DUMMY`**.


* Dilengkapi jendela objektif latihan (misal: *Maintain WPM above 60*, latihan mengetik angka/simbol, atau latihan kombo `[DODGE]` dan `[STRIKE]`) tanpa risiko kehabisan nyawa (`0 STAKES`).




2. **Multiplayer Mode 1 — Castle Sprint (4+ Player Race Mode):**
* 4 Ksatria berwarna (**P1 Biru, P2 Merah, P3 Hijau, P4 Kuning**) adu cepat berlari di lintasan lurus benteng panjang.


* HUD atas menampilkan *mini-map* garis balapan (`LAP 1/2`, `SURVIVAL DISTANCE: 450m`) dan klasemen WPM secara *real-time*.


* Pemain mengetik di *Tactical Word Stream* (`sprint leap strike dash double_jump! accelerate`) untuk memacu kecepatan lari, sambil mengetik `[DODGE]` untuk melompati gawang rintangan, `[LEDAKKAN]` untuk memicu jebakan api, atau `TEBAS` untuk menyingkirkan goblin penghalang jalan.




3. **Multiplayer Mode 2 — Bridge Clash / Arena Royale (2–4+ Player PvP):**
* Pertarungan bebas (*Free-For-All* atau *1v1 Duel*) di atas jembatan kastil.


* Setiap kata yang diketik menyerang pemain lawan atau mengaktifkan pertahanan seperti `[x2] BLOCK! SHIELD` dan serangan berat `[SLAM]`. Pemain dengan skor poin dan ketahanan tertinggi menjadi juara.




4. **Multiplayer Mode 3 — Co-Op Dungeon Raid (4+ Player Boss Raid):**
* 4 pemain bersatu di satu arena melawan Mega Boss dengan 5 lapis darah tebal (`OBSIDIAN MINOTAUR BOSS - HP x5`).


* Sistem pembagian peran (*Role*): **2 DPS** (Fokus memberikan *Critical Damage* lewat kata tebasan), **1 Healer** (Mengetik mantra `HEAL` untuk menciptakan lingkaran penyembuh hijau bagi rekan setim), dan **1 Tank** (Menahan agresi dan memecah perisai Boss).


* HUD menampilkan kecepatan gabungan tim (**`TEAM DAMAGE SPEED: 420 WPM`**) dan sisa kesempatan hidup bersama (`REVIVES: 3`).





---

## 🖼️ BAGIAN 5: GALERI VISUAL LENGKAP (SCREENSHOTS) & MASTER AI PROMPTS

Di bawah ini adalah dokumentasi visual lengkap untuk seluruh mode dan fase permainan **Typecade** beserta *Master AI Prompt*-nya:

### 1. Gameplay Utama: Endless Scrolling Arena, XP Gems & Environmental Skills

* **Detail Visual:** Menunjukkan gameplay utama *Endless* di mana ksatria meluncur menebas kerumunan musuh dari segala arah, dikelilingi koin emas dan permata XP biru/hijau yang siap disedot untuk *Level Up*. Terdapat musuh Kroco (`TEBAS`), Elite 3 lapis (`[x3] HANCURKAN`), serta pemicu skill lingkungan (`[LEDAKKAN]`, `[detonate-3]`, `[hex_bolt!]`) dan 3 kartu skill di bawah (`[SAPU]`, `[BADAI]`, `[SEMBUH]`).


* **Master Prompt:**
> A production-ready 2.5D HD-2D isometric action roguelike gameplay screenshot (Octopath Traveler meets Vampire Survivors style). Wide elevated isometric camera view of a dark ruined castle courtyard swarming with dozens of pixel-art skeletons and goblins from all directions, with gold coins and glowing XP gems scattered on the stone path. In the center, a blue pixel-art knight is dashing forward with a glowing cyan sword slash trail toward a skeleton labeled "TEBAS". Behind it stands an armored Elite Minotaur with a stacked 3-layer health bar and bold orange text "[x3] HANCURKAN". Environmental skill triggers glow in the crowd: a red explosive barrel labeled "[LEDAKKAN]", a bomb skeleton labeled "[detonate-3]", and a dark mage with purple aura labeled "[hex_bolt!]". At the bottom-center edge are 3 glowing RPG skill cards side-by-side: "[SAPU]", "[BADAI]", and "[SEMBUH]". Top-left HUD shows "WPM: 114 | ACC: 98% | STREAK: 57x" with fire effect. Top-right shows HP bar, Mana crystals, XP bar, timer "01:45", and "1,250g".
> 
> 



---

### 2. Mekanik Taktis: `Tab` Pressed (Skill Mode, Slow-Mo & Word Cooldown)

* **Detail Visual:** Saat tombol `Tab` ditekan, kubah *Slow-Mo* biru aktif melindungi ksatria, kata pada Minotaur terkunci di tengah ketikan (`[x2] CrU|sh`) saat perisai birunya hancur, dan 3 kartu skill muncul jelas dengan indikator `Ketik 3 kata` (`[COOLDOWN: 3w]`).


* **Master Prompt:**
> A 2.5D HD-2D isometric dungeon gameplay screenshot showing the tactical "TAB PRESSED: SKILL MODE!" overlay. In the center, the blue pixel knight is surrounded by a glowing cyan slow-motion time bubble. On the left is a bomb skeleton with red text "[detonate-3]". At the top is a dark mage casting purple orbs with text "[hex_bolt!]". On the right is an Elite Minotaur whose top blue shield bar is shattering into fragments, showing "[x2] CrU|sh" with an active typing caret. Across the lower third is a glowing cyan banner reading "TAB PRESSED: SKILL MODE!" Above the bottom edge, 3 large detailed skill cards pop up: orange "[CLEAVE] (Shred 1 Layer!)", greyed-out blue "[STORM] [COOLDOWN: 3w / Ketik 3 kata]", and glowing green "[HEAL] (Pulihkan 2 Hearts!)".
> 
> 



---

### 3. Klimaks Boss: "ARMOR BREAK!" & Monkeytype Overdrive Box

* **Detail Visual:** Perisai *Obsidian Minotaur Boss* hancur berkeping-keping (`ARMOR BREAK!`), memicu munculnya kotak paragraf *Monkeytype* di bawah layar. Kecepatan mengetik melonjak ke `142 WPM` (`STREAK: 112x`), menghujani Boss dengan tebasan `999 CRIT!` dan menghasilkan `+250 XP`.


* **Master Prompt:**
> A dramatic 2.5D HD-2D isometric boss battle screenshot in the wide ruined castle courtyard. A giant Obsidian Minotaur Boss is kneeling stunned on the stone floor with broken armor pieces around him, yellow stun stars circling his head, and bold yellow text "ARMOR BREAK!". At the top-center is a 3-layer boss health bar titled "OBSIDIAN MINOTAUR BOSS (HP x3)". The blue pixel knight is unleashing a massive blinding flurry of cyan sword slashes into the kneeling boss, generating huge arcade numbers "999 CRIT!" and "+250 XP". Across the bottom of the screen is a dark sleek Monkeytype-style paragraph box titled "Boss Fight Armor Break" where the player is typing a continuous English sentence at 142 WPM: green completed words "shadow blade cleave", blue words "the ancient", orange active word "obsidian|", and grey upcoming words "words core shatter the dark realm and unleash eternal light".
> 
> 



---

### 4. Perbandingan Pacing & Penggunaan Skill ("Type-to-Cast")

* **Detail Visual:** Dua gambar *split-screen* yang memperlihatkan kontras antarmuka antara Fase Level Biasa (tanpa kotak paragraf bawah) vs Fase Boss Fight (dengan kotak paragraf bawah), serta aksi visual ketika jurus area `SAPU` (tebasan berputar 360 derajat) dan `BLIZZARD` (badai es dari kata kunci `[BLIZZARD]` di dalam kalimat) dilepaskan.



---

### 5. Mode Latihan (Typing Dojo) & Multiplayer PvP (2–4 Pemain)

* **Detail Visual:** Menampilkan **Practice Mode (Typing Dojo)** bersama NPC *Sensei* di sebelah kanan, serta pertarungan **Multiplayer Arena Duel (2 Pemain)** dan **4-Player Bridge Clash** (Biru, Merah, Hijau, Kuning) lengkap dengan bar perbandingan WPM masing-masing pemain di bagian atas.



---

### 6. Mode Multiplayer Spesial: Castle Sprint (Balapan) & Co-Op Raid Boss

* **Detail Visual:**
* **Castle Sprint (Atas):** 4 pemain balapan lari di jalur benteng panjang dengan indikator posisi pelari menuju garis finis di atas layar (`LAP 1/2`, `SURVIVAL DISTANCE: 450m`) sambil melewati rintangan `[DODGE]` dan `[LEDAKKAN]`.


* **Co-Op Raid (Bawah):** 4 pemain dengan pembagian *Role* (`DPS`, `HEALER`, `TANK`) menggabungkan kecepatan ketik mereka (`TEAM DAMAGE SPEED: 420 WPM`) untuk menumbangkan *Obsidian Minotaur Boss (`HP x5`)*.





---

## 🛠️ BAGIAN 6: ARSITEKTUR TEKNIS & ENGINE BLUEPRINT (THREE.JS STACK)

Untuk membangun **Typecade** agar berjalan mulus 60–120 FPS di *browser* meski ada ratusan musuh dan permata XP di mode *Endless*, berikut adalah cetak biru arsitektur teknisnya:

### 1. Rendering & Visual Pipeline (Three.js + Post-Processing)

* **Kamera Isometrik:** Gunakan `THREE.OrthographicCamera` dengan sudut kemiringan **35.264°** dan rotasi sumbu Y **45°** agar seluruh *sprite* dan lantai terlihat presisi seperti game HD-2D.
* **Pixelation & Neon Bloom:** Gabungkan `RenderPixelatedPass` (ukuran piksel `4`) dengan `UnrealBloomPass` selektif pada *layer* tebasan pedang, permata XP, api obor, dan teks aktif agar warnanya menyala tajam di atas latar *dungeon* yang gelap.


* **Optimasi Ratusan Musuh & XP Gems (`InstancedMesh`):**
* Gunakan `THREE.InstancedMesh` untuk merender ratusan *sprite* kroco, koin emas, dan permata XP dalam 1 *draw call*.
* Gunakan **Infinite Chunk Map Generator** (3x3 *grid chunk* ukuran 32x32 *tile*): saat ksatria terus melakukan *dash* ke kanan-atas mengikuti arah musuh, *chunk* lantai di belakang kamera langsung dipindahkan (*recycle*) ke depan kamera tanpa beban memori tambahan.





### 2. State Machine untuk Input Mengetik (Zero-Latency Keydown Listener)

Jangan gunakan elemen `<input>` HTML biasa agar kursor tidak pernah kehilangan fokus. Tangkap langsung melalui `window.addEventListener('keydown')` dengan 4 *State* utama:

```typescript
type TypingState = 
  | 'ENDLESS_ARENA'    // Ketik kata di atas kepala musuh / objek lingkungan
  | 'TAB_SKILL_MODE'   // Aktif saat Tab ditekan (Slow-Mo + pilih 3 kartu skill)
  | 'BOSS_OVERDRIVE'   // Aktif saat Boss Armor Break (Kotak Paragraf Monkeytype)
  | 'LEVEL_UP_DRAFT';  // Aktif saat bar XP penuh (Ketik kata kunci 1 dari 3 kartu Upgrade)

```

* **Algoritma *Smart Target Lock* (`ENDLESS_ARENA`):**
* Saat belum ada musuh yang terkunci (`lockedTarget === null`) dan pemain menekan huruf pertama (misal `'t'`), cari musuh di dalam **Inner Ring** (jarak terdekat dari ksatria) yang katanya diawali huruf `'t'` (misal `tebas`).


* Begitu terkunci, semua huruf berikutnya diarahkan ke musuh tersebut sampai katanya selesai.
* Saat huruf terakhir tertekan: picu animasi *Combat-Dash* dari koordinat ksatria ke koordinat musuh, kurangi 1 lapis darah musuh (`layersRemaining--`), dan kurangi *Word Cooldown* pada semua kartu skill sebesar `1w`.




* **Algoritma *Pause & Resume* (`TAB_SKILL_MODE`):**
* Saat tombol `Tab` ditekan, simpan `lockedTarget` dan indeks huruf yang sudah diketik (`CrU|sh` $\rightarrow$ indeks `3`) ke dalam memori sementara.


* Ubah `timeScale` permainan menjadi `0.5` (Slow-Mo) dan arahkan *buffer* ketikan ke 3 kartu skill (`cleave`, `storm`, `heal` / `sapu`, `badai`, `sembuh`).


* Begitu nama skill selesai diketik, eksekusi efek skill, kembalikan `timeScale` ke `1.0`, dan pulihkan kembali `lockedTarget` beserta progres ketikan `CrU|sh` sehingga pemain tinggal mengetik sisa huruf `sh`!





### 3. Struktur Data Progression & Endless Scaling

```typescript
interface PlayerRunState {
  level: number;
  currentXp: number;
  xpToNextLevel: number; // Naik secara eksponensial ringan: Math.floor(100 * Math.pow(1.25, level))
  wpm: number;
  accuracy: number;
  streak: number;
  gold: number;
  activeSkills: SkillSlot[]; // [SAPU, BADAI, SEMBUH] beserta level evolusinya
  relics: RelicId[];         // Daftar pasif yang sudah diambil saat Level Up
}

```

### 4. Arsitektur Multiplayer Real-Time (WebSockets)

* Gunakan **Colyseus** atau **PartyKit (Cloudflare Workers)** untuk sinkronisasi kamar bermain (*room state*) hingga 4+ pemain dengan latensi rendah.
* Server tidak perlu menyinkronkan setiap posisi *frame* kroco, melainkan hanya menyinkronkan **Event Ketikan Pemain** (`WORD_COMPLETED`, `SKILL_CAST`, `WPM_UPDATE`, `DAMAGE_DEALT`), sehingga sangat ringan di jaringan dan bebas *cheat*.

---

Apakah kamu ingin kita langsung membuat **prototipe kode interaktif (HTML/JS/Three.js)** untuk menguji *core loop* **Endless + Level-Up + Tab Skill** dari **Typecade** ini di *browser*-mu?