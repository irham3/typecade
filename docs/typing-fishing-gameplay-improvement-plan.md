# Rencana Perbaikan Gameplay Typing Fishing

Status: draft hasil audit menyeluruh

Tanggal audit: 2026-09-05

Ruang lingkup: Milestone 0/1 — Shallow Coast saja. Tidak mencakup ranked, server, Boat Duel, atau ocean berikutnya.

## Putusan singkat

Build saat ini mempunyai shell visual yang jauh lebih matang daripada permainan yang dikandungnya. Menu, chrome, parallax, meter, sprite states, audio cue, dan koleksi sudah memberi **tanda** bahwa ini adalah fishing RPG. Namun loop yang benar-benar dimainkan masih terutama sebuah typing passage dengan timer: sebagian besar pilihan tidak mengubah encounter, ikan tidak mengubah cara mengetik secara nyata, dan boss tidak mengubah aturan pertarungan.

Itulah penyebab yang paling mungkin dari rasa "kurang": lebih banyak partikel atau aset beresolusi tinggi saja tidak akan menyelesaikannya. Pemain perlu dapat menjawab tiga hal dalam setiap run:

1. **Mengapa aku memilih spot/rute ini?**
2. **Mengapa ikan ini menuntut cara mengetik yang berbeda?**
3. **Mengapa hasil tangkapan atau kegagalanku merupakan akibat dari keputusan dan performaku?**

Rencana ini mengubah M1 menjadi *fishing duel yang dikendalikan oleh typing*: setiap ikan mempunyai pola tekanan yang dapat dibaca, tiap rute mempunyai konsekuensi yang nyata sebelum dipilih, skill membuka waktu atau informasi yang berarti, dan setiap kata yang selesai terlihat menarik ikan/garis/air secara material.

## Objek review dan keputusan yang dipertaruhkan

**Objek:** gameplay expedition Shallow Coast, dari menu/preparation hingga catch, escape, checkpoint, collection, art, audio, HUD, dan responsif.

**Keputusan:** apakah vertical slice sudah menguji janji produk "fishing RPG whose combat mechanic is typing", atau masih harus dipusatkan ulang sebelum aset/polish berikutnya ditambah.

Jawabannya: **pusatkan ulang dahulu.** Menambah lebih banyak ikan, rarity, screen shake, atau currency pada loop yang sama hanya akan memperbesar volume tanpa memperbesar pilihan dan keterikatan pemain.

## Dasar bukti dan batas audit

### Bukti terkonfirmasi

- Desain sumber kebenaran meminta run tiga zona yang bercabang, perilaku ikan berbeda, skill yang mengubah keputusan, checkpoint berisiko, serta boss tiga fase (`docs/game-design(new).md`, bagian 5–6 dan 12–13).
- Playthrough desktop build lokal dilakukan melalui jalur **Play → preparation → Set Sail → Pebble Goby → catch → Kelp Darter**. Ketik yang benar menaikkan tension/reel/skill, menghasilkan catch, dan perpindahan encounter berfungsi.
- Pemilihan route pada preparation tidak menentukan route encounter berikutnya: startup encounter menetapkan route berdasarkan indeks encounter (`apps/web/src/hooks/useOceanRun.ts:158-166` dan `:170-179`). Pada playthrough, pilihan Lagoon Gate berubah menjadi Reef Shelf ketika masuk encounter kedua.
- Urutan encounter adalah fixed 3/3/4 dan mengandung semua sepuluh ikan (`packages/game-rules/src/index.ts:51-55`); `RouteNode.fishIds` hanya dipakai untuk teks yang direveal Sonar, bukan untuk memilih target.
- Semua encounter mengambil passage secara berurutan dari satu list umum (`apps/web/src/hooks/useOceanRun.ts:171-175`), sementara `typingProfile` disimpan di data tetapi tidak dipakai untuk memilih/membentuk target.
- Menyelesaikan passage langsung memaksa `progress = 1` dan status `caught` (`packages/game-rules/src/index.ts:282-287`). Maka nilai reel per karakter/kata dan sebagian besar behaviour hanya mengubah meter/tempo sebelum hasil yang sama.
- Boss hanya mengubah nomor fase berdasarkan threshold progress (`packages/game-rules/src/index.ts:552-562`); tidak ada perubahan target, tekanan, pilihan, atau kondisi menang per fase.
- Semua catch diberikan langsung ke collection sebelum checkpoint (`apps/web/src/hooks/useOceanRun.ts:235-254`), sehingga checkpoint tidak lagi menciptakan risiko hadiah seperti yang dijanjikan desain.
- Asset ikan runtime dibuat oleh generator berbasis bentuk geometris sederhana (`scripts/generate_ocean_assets.py:438-600`), sedangkan cue audio dibuat sebagai gelombang sinus sintetis (`scripts/generate_ocean_assets.py:342-374` dan `:782-807`). Durasi ambience hanya 4 detik dan dua music loop hanya 6 detik.
- Scene memiliki event-driven VFX, particles bounded, fish movement, audio, dan reduced-effects (`apps/web/src/game/FishingScene.ts`), tetapi satu action paling sering — karakter benar — memberi respons yang relatif kecil/cepat dibanding kepadatan HUD.
- E2E saat ini memastikan canvas tidak blank, HUD tidak overlap berdasarkan rect, dan satu catch dapat dicapai; belum memvalidasi kausalitas rute, variasi perilaku, boss, kualitas asset, atau keterbacaan feedback (`e2e/ocean.spec.ts`).

### Asumsi yang dipakai

- Sasaran M1 adalah pemain yang mau melatih mengetik bahasa Indonesia pada keyboard desktop, termasuk pemain pemula sampai cukup lancar.
- Tujuan sesi 12–15 menit dari desain tetap berlaku, tetapi tidak boleh dipenuhi hanya dengan sepuluh passage linear.
- Pemain menyukai rasa santai/eksploratif di antara puncak tekanan; game tidak boleh menjadi latihan WPM yang terus menerus berisik.

### Yang belum diketahui

- Tidak ditemukan playtest representatif, telemetry perilaku pemain, failure rate, FPS pada hardware target, atau rekaman audio-mix pada kondisi penggunaan nyata. Semua prediksi pengalaman di bawah ini adalah hipotesis yang harus diuji, bukan klaim reaksi pemain.
- Belum ada ukuran produksi yang membandingkan asset ikan sekarang dengan satu asset final yang melewati concept, cleanup, dan review di dalam game.

### Cakupan domain review

Delapan domain ditinjau: pengalaman/audiens, konsep/emosi, aksi/aturan/agency, challenge/progression/economy, pacing, attention/presence, interface/accessibility, serta production/validation.

Domain yang sengaja tidak menjadi fokus: puzzle/deduction (bukan core fantasy), social/community (di luar M1), dan narasi karakter panjang (tidak diperlukan untuk membuktikan duel memancing). Tidak ada evaluasi multiplayer atau monetisasi yang disarankan dalam dokumen ini.

## Diagnosis pengalaman saat ini

### Rantai motivasi yang terbentuk sekarang

```text
Pilih layar prep
  -> mengetik passage
  -> melihat meter dan catch toast
  -> encounter fixed berikutnya
  -> mengulang
```

Rantai tersebut mempunyai konfirmasi mikro yang cukup baik, tetapi lemah pada antisipasi dan kepemilikan. Pemain melihat nama rute, risk, bait, rarity, skill draft, line, reel, dan collection; banyak di antaranya belum mengubah hasil yang dapat diprediksi. Ketika tampilan menyatakan ada strategi tetapi aturan tidak menindaklanjuti, pemain belajar bahwa perhatian pada informasi itu tidak bernilai.

### Rantai motivasi target

```text
Membaca laut dan tujuan koleksi
  -> memilih rute dengan risiko yang dapat dipahami
  -> menemukan ikan dengan kebutuhan mengetik yang khas
  -> membaca tekanan lalu menggunakan skill pada momen yang tepat
  -> catch/escape dengan sebab yang jelas
  -> mengamankan atau mempertaruhkan hasil
  -> mendapat penemuan/build yang membuka keputusan berikutnya
```

Ini bukan berarti membuat sistem lebih banyak. Ini berarti memastikan setiap elemen yang sudah ditampilkan memiliki satu konsekuensi yang konsisten dan dapat dipelajari.

## Temuan prioritas

Severity:

- **Kritis**: membatalkan janji inti atau membuat validasi M1 tidak bermakna.
- **Mayor**: sering merusak keputusan, rasa, atau replayability pemain.
- **Minor**: friksi/polish lokal yang tidak membatalkan arah permainan.

### Kritis — F01: Rute adalah presentasi, bukan keputusan

- **Observasi:** setiap rute memiliki `risk`, `rewardMultiplier`, dan `fishIds`, tetapi fish order fixed. Route yang dipilih pemain juga diganti otomatis ketika encounter dimulai. Hanya multiplier reward dari route aktif yang sampai ke hasil catch.
- **Mekanisme:** pemain tidak dapat menghubungkan pilihan spot dengan ikan, tantangan, atau risiko. Sonar hanya membuka daftar dekoratif. Setelah satu-dua run, menu route menjadi ritual klik, bukan strategi.
- **Status bukti:** terkonfirmasi dari playthrough dan source.
- **Dampak:** pilar "Strategy matters in Adventure" runtuh; Perfect Bait/Sonar kehilangan alasan; replay menjadi sequence yang sama.
- **Intervensi terkecil yang layak:** satu rute harus *mengunci* encounter bundle, trade-off tekanan, dan reward table sampai choice berikutnya. Risk harus memodifikasi sesuatu yang terlihat sebelum ketik dimulai (misalnya margin tension, fish pool, atau potensi reward), bukan hanya angka abstrak.
- **Validasi:** tanpa penjelasan verbal, 4 dari 5 peserta dapat menerangkan perbedaan dua rute sebelum klik; pilihan mereka tersebar ketika tujuan koleksi/risk berbeda; pilihan tetap tercermin pada fish yang benar-benar muncul.

### Kritis — F02: Setiap ikan memakai permainan ketik yang hampir sama

- **Observasi:** `typingProfile` seperti `short_burst`, `long_words`, `tricky_pairs`, dan `boss_mixed` ada di content, tetapi encounter selalu mengambil `getIndonesianPassage(encounterIndex)`. Behaviour terutama mengubah angka progress, idle pressure, dan sprite drift.
- **Mekanisme:** nama dan model ikan berubah, tetapi muscle memory pemain tidak perlu berubah. "Darting", "armored", "swarm", dan "predator" terasa sebagai skin atau statistik tersembunyi, bukan makhluk dengan perilaku.
- **Status bukti:** terkonfirmasi.
- **Dampak:** koleksi tidak membangun pengetahuan/fantasy; kesulitan cenderung terasa sebagai timer/damage yang naik, bukan keterampilan baru yang dipelajari.
- **Intervensi terkecil yang layak:** untuk tiap archetype, tetapkan satu perubahan pada **bentuk target**, satu perubahan pada **pola tekanan**, dan satu respons dunia yang bisa diprediksi. Semua harus dapat diperkenalkan pada ikan common sebelum dipakai pada rare/boss.
- **Validasi:** setelah satu pertemuan per archetype, pemain dapat memprediksi "ikan ini menghukum apa" dan memilih respons yang sesuai tanpa membaca tooltip panjang.

### Kritis — F03: Passage completion mem-bypass duel memancing

- **Observasi:** passage complete menetapkan progress menjadi 100% terlepas dari reel progress sebelumnya; Cast Net juga dapat menjadi finisher begitu threshold tercapai.
- **Mekanisme:** kemenangan terutama berarti "selesaikan teks sebelum waktu habis". Meter reel, armour, pull, dan sebagian skill memberi rasa tetapi bukan struktur keputusan yang menentukan kemenangan.
- **Status bukti:** terkonfirmasi.
- **Dampak:** game gagal membedakan typing test yang didekorasi dari fishing combat; balancing progress per-word tidak punya daya nyata.
- **Intervensi terkecil yang layak:** tetapkan satu kontrak outcome yang tunggal: passage adalah amunisi/serangkaian reel action, bukan saklar menang universal. Finish target dapat membuka final pull hanya jika kondisi duel terpenuhi, atau encounter memakai beberapa target pendek yang benar-benar menyelesaikan progress. Cast Net harus menjadi keputusan situasional dengan biaya/opportunity cost yang jelas, bukan shortcut default.
- **Validasi:** pada rekaman permainan, dua pemain yang menyelesaikan teks dengan kualitas sama namun memakai rute/skill/timing berbeda dapat memperoleh hasil yang masuk akal berbeda; pemain dapat menyebutkan mengapa mereka menang selain "karena teks selesai".

### Kritis — F04: Boss tiga fase hanya kosmetik

- **Observasi:** fase berubah pada 34% dan 67% progress, memicu feedback visual/audio, tetapi tidak mengubah ruleset encounter.
- **Mekanisme:** flash, phase label, dan musik mengumumkan intensitas yang tidak dibuktikan oleh tindakan pemain. Setelah satu kali melihatnya, transisi kehilangan kejutan dan tidak melatih apa pun untuk climax.
- **Status bukti:** terkonfirmasi.
- **Dampak:** boss tidak terasa sebagai integrasi pembelajaran tiga zona; ia hanya ikan dengan timer lebih panjang dan angka lebih berat.
- **Intervensi terkecil yang layak:** masing-masing fase menggabungkan satu kemampuan yang sudah dilatih: pembukaan rhythm stabil, fase tarik/pressure yang meminta recovery, lalu fase final yang meminta pilih skill atau rute reward. Perubahan harus diumumkan melalui gerak/environment dahulu, lalu label singkat sebagai penguat.
- **Validasi:** peserta dapat membedakan fase lewat apa yang mereka lakukan, bukan hanya warna/UI; gagal pada fase tertentu menghasilkan alasan yang dapat dijelaskan dan retry yang terarah.

### Mayor — F05: Janji skill dan perilaku aktualnya saling bertentangan

- **Observasi:** UI prep mengatakan "one active, one passive", tetapi loadout dapat berisi lebih dari satu active atau passive. Perfect Bait dijelaskan meningkatkan rare odds, padahal roster dan rarity encounter fixed; implementasinya terutama tension recovery pada non-common setelah streak. Sonar mereveal daftar fish tetapi tidak mengubah selection. Cast Net masih paling mudah dibaca sebagai finisher catch.
- **Mekanisme:** pemain tidak dapat membangun model mental yang stabil tentang build. Mereka memilih dari deskripsi yang tidak dapat diuji melalui hasil.
- **Status bukti:** terkonfirmasi.
- **Dampak:** skill draft berubah dari buildcraft menjadi UI card selection; kesalahan balance tertutup oleh kebingungan komunikasi.
- **Intervensi terkecil yang layak:** pilih dan tampilkan constraint loadout yang sesungguhnya, lalu tulis ulang setiap skill sebagai perubahan keputusan yang dapat diamati. Perfect Bait hanya boleh menjanjikan odds jika rute benar-benar menghasilkan table/probability; bila tidak, ganti efek dan copy-nya. Sonar harus memberi informasi sebelum komitmen dan informasi itu harus relevan dengan hasil.
- **Validasi:** sebelum run, pemain mampu memperkirakan kapan memakai setiap active dan apa yang dikorbankan; tidak ada skill dengan tooltip yang mengklaim outcome yang tidak mungkin dihasilkan rules.

### Mayor — F06: Struktur run tidak mempunyai arc roguelite yang dijanjikan

- **Observasi:** actual run adalah sepuluh fish fixed. Tidak tampak event, rest, shop keputusan, elite variation, voluntary exit, atau build reward di batas zona seperti desain run.
- **Bukti tambahan durasi:** sepuluh passage run berjumlah 341 karakter. Bahkan bila semua target selalu diketik penuh, pada 30 WPM itu sekitar 136 detik typing; dengan sembilan transition 1,8 detik, baseline-nya hanya sekitar 2,5 menit sebelum menu/pause. Pada 15 WPM baseline sekitar 4,8 menit. Ini jauh dari target desain 12–15 menit.
- **Mekanisme:** semua beat menuntut perhatian yang sama (typing under timer), sehingga tensi cepat mendatar. "Zone" lebih menjadi perubahan backdrop dan daftar ikan daripada bagian perjalanan dengan identitas.
- **Status bukti:** terkonfirmasi.
- **Dampak:** durasi 12–15 menit berisiko terasa panjang sebelum pemain punya alasan untuk replay; player tidak mendapat recovery/planning window.
- **Intervensi terkecil yang layak:** per zone pilih satu beat non-typing yang memberi keputusan nyata: route fork, rest/recovery, skill reward, atau opt-in elite. Jangan menambah semuanya sebelum satu beat terbukti meningkatkan orientasi dan anticipasi.
- **Validasi:** timeline playtest memperlihatkan rise → release → choice → rise setiap zone; pemain dapat menyebutkan satu keputusan run-level yang mereka buat dan ingin coba berbeda pada run kedua.

### Mayor — F07: Checkpoint tidak menciptakan risiko atau recovery yang jujur

- **Observasi:** reward catch langsung masuk ke collection; checkpoint kemudian aman dari duplikasi, bukan pengaman reward yang sebelumnya terancam. Failure menghabiskan spare line dan mengulang fish, tetapi hasil sudah dimiliki pemain.
- **Mekanisme:** UI menyiratkan ekspedisi dengan taruhan, tetapi aturan menghilangkan taruhan ekonomi. Ini menciptakan punishment waktu tanpa decision recovery yang setara.
- **Status bukti:** terkonfirmasi.
- **Dampak:** tension dari run tidak sejalan dengan konsekuensi; checkpoint tidak menarik secara emosional maupun strategis.
- **Intervensi terkecil yang layak:** pilih satu model dan jujurkan UI: (A) arcade run — reward langsung aman, maka failure hanya mengubah score/optional reward dan checkpoint menjadi recovery/build; atau (B) expedition risk — reward zone benar-benar pending sampai boundary, lalu player diberi keputusan cash-out/continue. M1 sebaiknya tidak mengklaim keduanya sekaligus.
- **Validasi:** pemain dapat menjawab sebelum failure apa yang akan hilang, apa yang aman, dan pilihan recovery apa yang masih tersedia.

### Mayor — F08: Ikan runtime belum memenuhi peran sebagai lawan utama

- **Observasi:** common/rare fish runtime berukuran 160×108, beberapa contoh memperlihatkan body yang sangat geometris dan banyak ruang transparan; generator mengulang konstruksi dasar ellipse/polygon dan motif warna. Fish art muncul lagi sebagai kartu statis di HUD. Dibanding menu/latar yang sangat ilustratif, actor fish di stage terasa seperti icon yang diperbesar.
- **Observasi tambahan:** facing/pivot belum konsisten terhadap fantasy hook. Scene selalu menghitung posisi mulut pada sisi kiri actor, sementara Reef Shark dan Crown Leviathan pada asset yang ditinjau menghadap kanan. Sebagian animation frame juga adalah duplicate hold, sehingga banyak file state tidak otomatis menghasilkan gerak yang kaya.
- **Mekanisme:** pemain memusatkan mata pada teks dan card, bukan pada makhluk yang sedang dilawan. Perilaku visual sulit dibaca pada silhouette kecil dan satu gesture generik.
- **Status bukti:** terkonfirmasi dari asset source dan playthrough; penilaian kualitas estetis adalah inferensi desain, bukan pendapat pemain terukur.
- **Dampak:** collection attachment, rarity fantasy, dan respons typo tidak memiliki badan/karakter yang cukup kuat.
- **Intervensi terkecil yang layak:** jangan produksi 10 versi polish sekaligus. Buat dan uji satu **quality bar trio** (common, rare, boss) di layar gameplay: silhouette unik pada skala target, material/marking yang konsisten, dan state yang terlihat berbeda bahkan dalam 250 ms. Baru gunakan kit/parameter yang sama untuk roster lain.
- **Tambahan audit yang wajib:** tetapkan facing, pivot center-body, dan mouth/lure attachment point per species; review still/gif untuk idle, high-tension, caught, dan escape. Tidak boleh ada line yang terlihat menempel pada ekor/flank karena satu offset universal.
- **Validasi:** pada screenshot gameplay normal (tanpa kartu info), observer dapat mengenali rarity dan state fish pada trio; masing-masing masih terbaca ketika target typing dan HUD aktif.

### Mayor — F09: Hierarki layar mengalahkan fantasy memancing

- **Observasi:** gameplay menggabungkan logo besar, top bar, rail, skill dock, fish card, tension bar, typing panel, stats, progress stack, dan result toast. Pada desktop, rail menutupi area boat; fish card berkompetisi dengan fish actor. Pada mobile, fish card dan label skill disembunyikan untuk muat.
- **Observasi mobile yang lebih serius:** pada 390×844, target panjang dapat terpotong karena target dibuat satu baris dengan `white-space: nowrap` dan `overflow: hidden`; action Pause/Settings di topbar dapat keluar frame karena player badge, dua currency pill, dan dua icon action tidak muat. Game juga hanya menerima gameplay melalui global keyboard event; styling mobile membuatnya dapat dilihat, tetapi tidak memberi jalur typing touch/IME.
- **Mekanisme:** layar memperlakukan semua informasi sebagai penting. Mata pemain tidak mendapat jalur jelas: target typing perlu dominan saat input, namun fish/line harus dominan ketika outcome/tekanan berubah.
- **Status bukti:** terkonfirmasi dari playthrough/CSS; dampak perhatian adalah inferensi untuk diuji.
- **Dampak:** VFX kecil tidak terasa karena tertutup oleh chrome; scene bisa tampak ramai namun tetap tidak hidup.
- **Intervensi terkecil yang layak:** tetapkan tiga state layout: **hook/read**, **typing/duel**, dan **resolve/reward**. Saat duel, sisakan hanya target, line/tension ringkas, fish besar, dan skill yang siap; metadata fish pindah menjadi reveal singkat/expandable. Saat resolve, beri fish dan reward panggung penuh sebelum UI kembali.
- **Keputusan scope yang harus jujur:** M1 harus dinyatakan desktop-keyboard playable saja, atau menyediakan input mobile yang benar-benar menyelesaikan loop. "Responsive viewing" bukan sama dengan gameplay playable.
- **Validasi:** screenshot test dan peserta dapat menemukan target berikutnya, status bahaya, dan skill siap dalam ≤2 detik tanpa mencari-cari; fish tidak lagi bersaing dengan kartu duplikat.

### Mayor — F10: Feedback event-driven ada, tetapi belum membentuk bahasa sebab-akibat yang bertingkat

- **Observasi:** correct key, word, combo, typo, tension-critical, skill, catch, phase, dan level-up masing-masing dapat memicu particles/camera/audio. Banyak respons memakai ring, spark, floating text, shake, dan flash yang mirip. Correct-character responses sangat pendek, sementara typo/catch memakai kamera cukup kuat.
- **Mekanisme:** ketika bentuk feedback serupa dipakai untuk event dengan makna berbeda, pemain menerima "sesuatu terjadi" tetapi tidak selalu tahu apa atau seberapa besar. Sebaliknya, shake/flash yang terlalu sering mengurangi headroom bagi boss/catch.
- **Status bukti:** terkonfirmasi untuk wiring event; efektivitas perseptual perlu playtest.
- **Dampak:** input terasa ramai daripada fisik; player fatigue meningkat dan moment besar tidak punya kontras.
- **Intervensi terkecil yang layak:** buat grammar feedback tetap: karakter benar = pulse garis halus; kata sempurna = reel pull yang menggeser fish; milestone = burst/tonal lift; typo = fish melawan + status bahaya yang dapat dipulihkan; skill = bentuk VFX unik; catch/escape/boss = satu-satunya pemilik flash/shake besar. Setiap effect harus menjawab *aksi apa, seberapa besar, dan keadaan apa yang berubah*.
- **Validasi:** pada versi tanpa label floating, peserta bisa membedakan correct, perfect, typo, line-critical, dan skill dari motion/warna/bunyi; reduced-effects mempertahankan informasi yang sama tanpa flash/shake.

### Mayor — F11: Audio sementara terlalu tonal dan terlalu pendek untuk membawa laut

- **Observasi:** seluruh cue dibuat sebagai sinus sederhana dan ambience/music loop 4–6 detik. Cues correct dapat dipicu rapat, sementara variasi splash/line yang tersedia tidak selalu menjadi bagian dari grammar interaksi.
- **Observasi tambahan:** word-complete cue A dikirim oleh hook dan juga dimainkan lagi oleh scene pada jalur normal, sehingga satu keberhasilan kata dapat menghasilkan cue ganda. Sebaliknya, beberapa cue tension/splash/typo variant dimuat tetapi tidak memperoleh peran event yang konsisten.
- **Mekanisme:** repetisi tonal cepat terdengar seperti UI/test harness, bukan air, tali, reel, atau makhluk. Pemain mengetik puluhan kali per menit sehingga kelelahan audio muncul sangat cepat.
- **Status bukti:** terkonfirmasi dari asset generator/durasi; penilaian pendengaran harus divalidasi dalam mix nyata.
- **Dampak:** audio tidak mampu memberi tekstur dunia, membedakan fish, atau membuat catch memorable.
- **Intervensi terkecil yang layak:** produksi satu palette audio kecil tetapi berlapis: ambience 20–40 detik dengan random micro-oneshot, loop musik yang dapat di-crossfade, reel/line yang material, splash berbasis intensity, dan dua sampai tiga variasi non-tonal untuk feedback penting. Throttle tick per kata/interval, bukan per key bila mix membosankan.
- **Validasi:** 10 menit playtest pada headphone/speaker tanpa mute; peserta dapat menyebutkan line-critical, rare, catch, dan boss dari bunyi; tidak ada cue yang mereka minta dimatikan secara spesifik karena repetitif.

### Mayor — F12: Art direction belum satu bahasa dari menu ke duel

- **Observasi:** menu memakai ilustrasi harbour yang kaya dan terang; gameplay stage memakai background berlapis, pixel-style UI, actor fish sangat sederhana, serta typography/ornament dari beberapa density berbeda. Art bible meminta fish cel-shaded pixel-inspired dengan silhouette kuat dan gameplay readability, tetapi quality bar belum konsisten terlihat di stage.
- **Mekanisme:** pemain memasuki permainan dengan ekspektasi petualangan yang kaya, lalu bertemu avatar/ikon yang lebih abstrak. Perbedaan kualitas antar layer membuat VFX tampak tempelan.
- **Status bukti:** supported inference dari screenshot, art bible, dan asset source.
- **Dampak:** presentasi tidak memperkuat role fantasy "captain fighting a fish" secara stabil.
- **Intervensi terkecil yang layak:** pilih satu deklarasi final: *stylized pixel-painterly ocean* dengan contoh screenshot in-game sebagai quality bar, bukan hanya gambar menu. Tetapkan outline, texture density, palette rarity, skala actor, dan cara UI mundur ketika action penting terjadi.
- **Validasi:** review blind 3 screenshot (menu, common duel, rare/boss duel) dinilai sebagai produk yang sama; target text tetap terbaca pada tiap screenshot.

### Mayor — F13: Reward/collection menunjukkan volume sebelum attachment

- **Observasi:** collection M1 yang sepuluh ikan bercampur dengan 40 generated concept previews yang tidak dapat ditemui di run. Economy awal juga sudah memiliki 12.450 coins dan 685 materials, sedangkan shop/equipment masih preview.
- **Mekanisme:** jumlah kartu yang tidak dapat diperoleh mengurangi arti discovery. Currency besar tanpa sink dapat terasa seperti angka pajangan, bukan hasil expedition.
- **Status bukti:** terkonfirmasi.
- **Dampak:** collection tidak menjalankan peran emotional loop; pemain tidak memperoleh tujuan dekat yang kredibel.
- **Intervensi terkecil yang layak:** M1 collection hanya menonjolkan roster yang benar-benar catchable. Sisanya pindahkan ke concept gallery yang jelas terpisah dari completion. Mulai dengan economy yang hanya cukup untuk satu-dua keputusan nyata, atau sembunyikan currency sampai memiliki sink yang akan dipakai dalam M1.
- **Validasi:** pemain dapat menyebutkan ikan mana yang belum mereka tangkap, dimana peluangnya, dan langkah berikutnya untuk mendapatkannya; tidak ada card yang tampak sebagai collectible aktif tetapi tidak mungkin diperoleh.

### Mayor — F14: Onboarding mengajarkan tombol, bukan first decision

- **Observasi:** preparation langsung memperlihatkan route risk/reward dan skill draft tanpa mengajarkan arti pressure, kapan skill dipakai, atau mengapa fish tertentu memerlukan pola berbeda. Input error tidak mempertahankan karakter salah di panel; feedback utamanya pindah ke animation/canvas.
- **Mekanisme:** pemain baru dapat meniru "type highlighted passage", tetapi tidak dapat membentuk strategi atau diagnosis ketika tension naik. Mereka akan menyalahkan timer/kecepatan, bukan belajar recovery.
- **Status bukti:** supported inference dari UI/source; perlu playtest tanpa coaching.
- **Dampak:** game berisiko hanya nyaman untuk typer cepat dan tidak menunjukkan strategi kepada typer akurat/pemula.
- **Intervensi terkecil yang layak:** satu guided first catch dengan Calm fish memperlihatkan urutan **correct → reel**, **typo → fish pulls/tension**, dan **perfect words → skill charge**. Setelah itu, tawarkan fork dengan copy yang menjelaskan konsekuensi, bukan tutorial modal panjang.
- **Validasi:** setelah 5 menit tanpa coaching, peserta bisa menjelaskan win condition, sebab tension naik, satu cara recovery, dan alasan memilih route/skill.

### Mayor — F15: Aksesibilitas belum diuji sebagai permainan utuh

- **Observasi:** tersedia volume categories dan reduced effects. Namun mobile breakpoint menyembunyikan informasi (fish card, nama/cost skill), typing target memakai `white-space: nowrap`, dan tindakan skill bergantung pada angka/UI kecil. Tidak terlihat setting untuk ukuran teks, remap, color/contrast alternative, target wrapping, atau mode latihan pressure.
- **Observasi tambahan:** toggle "Reduced effects" tidak mengikuti `prefers-reduced-motion` dan belum menghentikan seluruh motion non-esensial (misalnya CSS bob/pulse/blink dan beberapa tween decorative). Pause dialog memiliki ARIA role yang baik, tetapi focus journey/modal trapping dan status typo/tension untuk screen reader belum dibuktikan.
- **Mekanisme:** pengurangan visual dapat sekaligus menghilangkan informasi keputusan; UI padat membuat target mobile/tablet sulit dibaca/diakses.
- **Status bukti:** terkonfirmasi untuk UI settings/CSS; device usability perlu uji nyata.
- **Dampak:** pemain yang membutuhkan reduced motion, layar kecil, atau input remap dapat menerima versi game yang lebih sedikit informasi, bukan hanya lebih nyaman.
- **Intervensi terkecil yang layak:** definisikan accessibility equivalence: setiap state critical punya teks/shape/audio alternatif; target dapat wrap/scale tanpa memotong; skill punya input yang dapat diremap dan affordance nama/cost yang tetap tersedia; difficulty assistance menjelaskan perubahan tanpa menghakimi.
- **Validasi:** complete satu encounter dengan reduced effects + 200% text scale dan satu dengan keyboard remap/touch target tanpa kehilangan state critical atau action wajib.

### Minor — F16: Menu menawarkan mode yang belum dimainkan

- **Observasi:** Ranked Duel, Shop, dan Leaderboard dapat diklik dari main menu walau panelnya menjelaskan feature future/out of scope.
- **Mekanisme:** first impression menjanjikan pilihan produk yang belum tersedia sebelum core Adventure terbukti menyenangkan.
- **Status bukti:** terkonfirmasi.
- **Dampak:** fokus audien terpecah dan prototype tampak lebih lengkap tetapi kurang jujur.
- **Intervensi terkecil yang layak:** pada M1, jadikan entry out-of-scope sebagai roadmap/locked item yang tidak bersaing dengan CTA Adventure, atau hilangkan dari critical path.
- **Validasi:** pemain baru bisa menyebutkan satu mode yang dapat dimainkan dan tujuan memulainya; tidak ada click pertama yang berakhir pada "Soon" ketika mereka memilih Play.

### Mayor — F17: Validasi saat ini mengukur rendering, bukan rasa permainan

- **Observasi:** rules tests memeriksa beberapa formula, E2E memeriksa shell/catch/nonblank/overlap. Belum ada test/simulasi untuk route causality, passage-profile mapping, skill truthfulness, expected value risk, checkpoint loss model, boss phase mechanics, audio cooldown, visual readability, atau performance budget.
- **Mekanisme:** regression bisa mempertahankan layar yang terlihat sehat sementara pilihan inti kembali dekoratif. Team dapat salah menganggap pass build sebagai bukti fun.
- **Status bukti:** terkonfirmasi dari test suite yang diperiksa.
- **Dampak:** risiko termahal — membangun asset/content banyak di atas loop yang belum tervalidasi — tetap terbuka.
- **Intervensi terkecil yang layak:** sebelum menambah roster/polish massal, tetapkan game-feel acceptance test untuk satu common, satu pressure fish, satu rare, dan boss prototype; tambahkan observasi playtest dengan decision threshold yang telah disepakati.
- **Validasi:** lihat bagian "Eksperimen dan gates"; setiap milestone hanya diteruskan jika bukti bukan sekadar screenshot/build green tersedia.

### Mayor — F18: Quality/reward belum mengomunikasikan kemampuan typing yang dinilai

- **Observasi:** Catch quality memakai accuracy, consistency, max combo, dan fixed fish difficulty; WPM/raw WPM yang dihitung oleh Typing Engine tidak digunakan. Dengan passage hanya sekitar 5–7 kata tetapi combo dinilai terhadap target sembilan, sebuah run bersih dapat menerima label/perasaan "perfect" namun tidak mendekati Q100 untuk common. Timer yang longgar membuat speed terutama menjadi syarat lolos, bukan ekspresi hasil yang jelas.
- **Mekanisme:** pemain cepat dan akurat tidak melihat hubungan yang jelas antara kemampuan mereka dengan quality; pemain lambat dan bersih tidak tahu kapan kecepatan perlu diperbaiki. Quality/size tampak seperti formula tersembunyi.
- **Status bukti:** terkonfirmasi untuk formula; efek optimal-play adalah hipotesis balance yang harus disimulasikan.
- **Dampak:** chase size/quality/reward kehilangan legitimasi; performance model tidak memberi feedback belajar yang tajam.
- **Intervensi terkecil yang layak:** putuskan apakah pace memberi bonus quality, reel efficiency, atau hanya survival—lalu komunikasikan band tersebut. Selaraskan panjang target, threshold combo, timer, dan quality ceiling agar outcome yang disebut "perfect" dapat benar-benar dicapai pada kondisi yang dijelaskan.
- **Validasi:** simulasi matriks 10/15/25/40/60 WPM × 85/93/98% accuracy. Pemain harus dapat memprediksi urutan quality/reward sebelum result dan masih ada jalur fair bagi typer pemula.

## Kontrak gameplay target

Semua desain lanjutan M1 harus lulus kontrak ini. Jika sebuah fitur tidak mengubah salah satu bagian ini, ia bukan prioritas.

| Elemen | Kontrak yang dapat diamati pemain |
| --- | --- |
| Rute | Sebelum memilih, pemain mengetahui trade-off. Setelah memilih, fish pool/pressure/reward benar-benar mengikuti rute tersebut. |
| Ikan | Pemain dapat mengenali fish, memprediksi pola tekanannya, dan melihat geraknya merespons ketikan. |
| Typing | Karakter benar memberi tarikan mikro; kata/perfect word mengubah posisi dunia/material combat; typo menciptakan masalah yang spesifik dan dapat dipulihkan. |
| Progress | Mencapai 100% reel dan menyelesaikan target mengikuti aturan duel yang sama dan dapat dipahami; tidak ada saklar menang tersembunyi. |
| Skill | Setiap skill menjawab momen keputusan berbeda: informasi sebelum commit, mitigasi tekanan saat krisis, finisher dengan opportunity cost, atau build payoff yang nyata. |
| Risk/recovery | Pemain tahu apa yang terancam, cara mengurangi risiko sebelum/saat encounter, serta apa yang tetap aman setelah failure. |
| Boss | Setiap fase menambahkan atau menggabungkan tuntutan yang telah diajarkan; phase adalah perubahan bermain, bukan hanya announcement. |
| Reward | Catch memperlihatkan fish sebagai hadiah utama, dengan size/quality/reward yang dapat ditelusuri ke performa dan pilihan. |

## Bentuk encounter yang direkomendasikan

### Tiga horizon keputusan

Jangan memaksa pemain menghitung banyak stat. Cukup tiga horizon yang jelas:

1. **Sebelum hook — rute dan tujuan.** Pilih safety, target collection, atau payout/risk. Sonar bernilai di sini.
2. **Saat duel — execution dan timing.** Baca tension/pola fish; pilih kapan memakai active atau menjaga energy.
3. **Di boundary — cash-out/build/lanjut.** Pilih recovery, reward, atau risiko zone berikutnya sesuai model checkpoint yang disepakati.

### Behaviour matrix untuk sembilan ikan dan boss

Ini adalah design contract, bukan instruksi teknis. Nama species dapat tetap, tetapi masing-masing harus mengisi peran yang berbeda.

| Archetype | Bentuk target yang dilatih | Tekanan dan counterplay | Bukti visual/audio yang wajib | Perkenalan M1 |
| --- | --- | --- | --- | --- |
| Calm | Frasa pendek, ritme stabil, spasi jelas | Pressure lambat dan dapat diprediksi; ruang untuk belajar tension | Hover lembut, ripple kecil, reel hum | Pebble Goby / Sunny Guppy |
| Darting | Burst pendek dengan jeda berniat; bukan timer acak | Fish pulls pada idle window yang ditandai; perfect burst menahannya | Dash lateral, wake tajam, line flick | Kelp Darter |
| Armored | Kata lebih panjang atau segmen yang membangun "break" | Progress awal tertahan, tetapi perfect chain membuka armour; jangan hanya menambah health | Plate crack/berat, impact rendah | Shellback Puffer |
| Swarm | Kelompok kata pendek yang memberi pilihan urutan/target sederhana | Tangkap kelompok memberi reward cepat; salah momentum menambah clutter terkontrol | Silhouette terpisah/menyatu, banyak ripple kecil | Tide Skipper |
| Tricky | Pasangan Indonesia yang serupa tetapi tetap terbaca; jangan gunakan font ambigu | Typo menimbulkan feint dan tension; recovery melalui kata bersih berikutnya | Feint direction, coral flash, muted snap | Coral Fry / Moonfin Snapper |
| Darting rare / Eel | Phrase cadence dengan perubahan panjang, dilatih dari Darting | Idle pressure lebih kuat, tetapi telegraphed dan punya window recovery | Wave-body panjang, shimmer, distant hiss | Glass Eel |
| Predator | Burst medium saat fish charge; judgement kapan menahan skill | Charge jelas selama pause/critical; defensive skill mengubah window, bukan menghapus encounter | Advance toward boat, water displacement, low warning | Reef Shark |
| Boss phase 1 | Recall rhythm yang telah dipelajari | Stabil tetapi menuntut konsistensi | Entrance dan crown wake | Crown Leviathan |
| Boss phase 2 | Kombinasi armour/darting atau fish pressure | Memaksa recovery/skill timing yang sebelumnya aman diuji | Environment berubah dan line geometry bereaksi | Crown Leviathan |
| Boss phase 3 | Final pull yang memberi pemain satu pilihan berisiko | Payout/escape condition jelas, tanpa spike tersembunyi | Signature vortex/surge dan musik layer | Crown Leviathan |

### Aturan keadilan untuk typing

- Tantangan boleh menaikkan **pola**, **informasi**, atau **timing keputusan**, bukan hanya mengurangi toleransi typo dan memperpanjang teks.
- Text profile selalu menampilkan kata yang sah dalam bahasa Indonesia dan dapat dibaca pada glance; kesulitan tidak boleh berasal dari font, clipping, atau tekstur.
- Satu typo harus terlihat konsekuensinya seketika; satu kata bersih/perfect harus memberi tanda recovery/progress yang sebanding.
- Pemain akurat tetapi lebih lambat perlu mempunyai jalur survival melalui rute/skill/recovery. Pemain cepat tetapi ceroboh perlu kehilangan sesuatu yang dapat dipahami.
- Jangan mengubah deadline ketika pemain harus membuat pilihan yang membutuhkan membaca panjang. Rute dan skill information harus jelas sebelum pressure live.

## Rencana perbaikan berurutan

### Slice 0 — Menghapus kebohongan sistemik sebelum menambah polish

**Tujuan:** setiap label dan card yang ada di preparation/HUD sudah memiliki konsekuensi gameplay yang benar.

1. Putuskan model checkpoint (arcade-safe atau expedition-risk) dan ubah copy/status agar sama dengan model tersebut.
2. Jadikan route selection persistent sampai choice berikutnya; sambungkan fish pool, risk, dan reward ke pilihan yang sama.
3. Hapus atau ubah copy data yang belum bisa diwujudkan: Perfect Bait rare odds, Sonar fish reveal, "branching", "one active/one passive", equipment/bait, dan inventory values.
4. Kurangi main menu M1 ke CTA yang playable dan roadmap yang jujur.
5. Tambahkan debug/readout internal sementara untuk membuktikan seed, rute, encounter table, risk modifier, dan skill effect; hilangkan dari player UI setelah rules terbukti.

**Definition of done:** untuk satu run seeded, desain dapat menunjukkan route yang dipilih → fish table/pressure/reward yang keluar → catch/escape → checkpoint/reward secara kausal tanpa exception tersembunyi.

### Slice 1 — Membuktikan signature duel dengan dua ikan

**Tujuan:** prove bahwa core terasa seperti fishing duel bahkan dengan sedikit konten.

Bangun dan test hanya:

- satu Calm common sebagai tutorial pressure/recovery;
- satu Predator/Darting sebagai kontras yang menuntut cadence dan skill timing;
- satu route safe dan satu route risk yang benar-benar mengubah kedua encounter;
- dua active + satu passive yang masing-masing memiliki momen keputusan yang tak tumpang tindih;
- satu catch dan satu escape result yang menjelaskan penyebabnya.

**Definition of done:** tanpa reward meta, playtester tetap ingin memainkan kedua encounter lagi untuk membandingkan route/skill; mereka menyebut perbedaan bermainnya dengan bahasa mereka sendiri.

### Slice 2 — Mengubah seluruh roster menjadi content yang benar-benar berbeda

**Tujuan:** scale rules yang telah terbukti ke 9 regular fish tanpa mengubah semuanya menjadi special case.

1. Tetapkan profile passage/cadence tiap archetype dan content bank Indonesia yang sesuai.
2. Tetapkan pressure curve, recovery cue, reward reason, dan minimal satu animation state yang mengekspresikan archetype untuk tiap species.
3. Pastikan safe/moderate/risk routes memiliki expected return yang berbeda dan informasi yang cukup bagi pemain untuk memilih.
4. Tambahkan satu non-typing beat per zone (fork, rest, skill choice, atau opt-in elite) untuk menciptakan rhythm, bukan menu tambahan.
5. Kunci boss tiga fase setelah semua demand-nya telah diajarkan oleh roster.

**Definition of done:** pemain dapat menceritakan run sebagai serangkaian encounter dan keputusan, bukan daftar passage yang selesai diketik.

### Slice 3 — Memperbesar rasa fisik dan kualitas ikan

**Tujuan:** membuat action yang sudah bermakna terasa mahal, hidup, dan mudah dibaca.

1. Buat quality-bar trio asset: satu common, satu rare, satu boss. Approve di resolusi gameplay desktop dan mobile sebelum menghasilkan seluruh roster.
2. Terapkan silhouette, texture density, pivot, outline, coloration, dan state contract dari art bible secara konsisten.
3. Ubah layout duel menjadi hirarki state; fish/line mendapatkan stage pada hook, pull, typo, phase, dan catch.
4. Terapkan grammar VFX bertingkat dan kurangi effect generik; besar kecilnya effect harus sebanding dengan konsekuensi rules.
5. Ganti palette audio sintetis dengan material water/line/reel/fish cues dan loop yang tidak cepat terbaca pengulangannya.
6. Buat result reveal yang memberi fish, ukuran, quality reason, dan discovery panggung lebih besar daripada toast angka.

**Definition of done:** screenshot/video tanpa UI text masih menyampaikan apakah pemain sedang hook, sukses menarik, berada dalam danger, memakai skill, atau menang/kalah.

### Slice 4 — Progression, accessibility, dan repeat gate

**Tujuan:** memastikan replay yang diminta M1 lahir dari tujuan dan pilihan, bukan dari hoarding/obligation.

1. Kecilkan collection ke catchable roster aktif; pisahkan concept gallery dari completion.
2. Berikan setiap currency sebuah sink M1 yang mengubah pilihan tanpa power creep universal, atau jangan tampilkan currency tersebut dulu.
3. Jadikan first-run teaching experiential dan gunakan route/skill decision sebagai ujian pemahaman pertama.
4. Audit reduced effects, target scale/wrap, contrast, input remap, dan alternate cue agar tidak menghapus informasi penting.
5. Instrumentasi lokal untuk funnel (choice, skill timing, escape cause, retry), dengan persetujuan/privacy copy bila kelak data keluar perangkat.

**Definition of done:** pemain mengerti langkah koleksi berikutnya, bisa menyesuaikan permainan ke kebutuhan input/persepsi mereka, dan memilih replay karena target/build/route yang berbeda.

## Rencana visual, aset, dan audio

### A. Asset ikan: quality bar sebelum volume

Asset sekarang memiliki state filenames dan atlas yang tepat, tetapi asset pipeline perlu naik dari "frame berbeda" menjadi "karakter hidup".

Untuk setiap ikan final, buat lembar review yang memuat:

- silhouette hitam pada ukuran target (common 84–132 px, rare 120–170 px, boss 220–320 px);
- species hook: satu ciri yang bisa disebut pemain — misalnya dorsal coral, tail crescent, armour plate, eel ribbon, atau crown ridge;
- dua band value + highlight yang menjaga fish terbaca terhadap laut;
- pose/pivot yang membuat bite, struggle, stunned, caught, dan escape mempunyai arah berbeda;
- material cue (shell, glass, coral, fin, scales) yang tampak walau tanpa rare glow;
- daftar state yang tidak sekadar rotated/blurred copy;
- screenshot in-game pada normal, danger, dan reduced-effects mode.

Urutan produksi yang hemat risiko:

```text
Approved common actor
  -> approved rare actor
  -> approved boss actor
  -> one in-game animation/readability test
  -> parameter/kit style guide
  -> roster production
```

Jangan menjadikan card collection sebagai satu-satunya tempat fish terlihat bagus. Actor di stage harus menjadi representasi utama; card hanya memperpanjang momen setelah player sudah merasakan kehadiran fish dalam duel.

### B. VFX: dari dekorasi menuju informasi fisik

| Event | Respons utama | Batas agar tidak melelahkan |
| --- | --- | --- |
| Karakter benar | pulse tipis sepanjang line/lure dan micro tug | tanpa shake/flash; throttle audio |
| Kata bersih | fish bergeser menuju boat + ripple yang meninggalkan jejak | satu effect material, bukan banyak label |
| Perfect word | tarikan lebih berat, armour crack/stagger bila relevan | accent hangat singkat |
| Typo | fish melawan ke arah jelas, tension naik dan line berubah | text target tetap tidak tertutup |
| Tension critical | line vibrasi/warna, telegraph fish pull, cue rendah | repeat dengan cooldown, tidak pakai flash penuh |
| Active skill | bentuk dan ruang yang unik per skill | harus terlihat mengubah state yang diklaim |
| Rare hook | silhouette reveal lalu colour/ambient shift | satu sting, bukan efek berulang |
| Catch/escape | sequence 0.8–1.5 s yang memberi fish priority | satu-satunya owner freeze/shake besar selain boss |

### C. Layout: ruang bertarung sebelum chrome

Target frame duel desktop:

```text
[minimal player/status]       [zone + risk state]

boat / rod ----------- line ----------- FISH ACTOR
                                   ^ ruang VFX dan pull

        [target typing yang stabil dan lebar]
        [tension | reel | skill ready — hanya yang relevan]
```

Fish info/detail harus muncul pada hook dan result/reveal, bukan membebani seluruh duel. Logo, collection rail, shop, dan stat sekunder tidak boleh mengalahkan line/fish/target. Pada mobile, informasi yang disederhanakan harus masih menyatakan: current target, danger source, active skill readiness, dan response terakhir.

### D. Audio: bahan suara, bukan frekuensi nama event

- Bed ambience: water/wind/bird/bubble layers dengan variasi jarang, bukan satu tone pendek yang berulang.
- Typing: gunakan feedback lembut per cadence/word; hindari click tonal identik pada setiap karakter.
- Fishing: line tightening, spool/reel friction, fish splash, dan fish movement memberi material yang berbeda.
- State: rare/boss mengambil ruang frekuensi/musik secara bertahap; line-critical harus terdengar berbeda dari typo.
- Controls: music/environment/gameplay/typing tetap terpisah; reduced effects mengurangi transient/camera tetapi tidak menghapus critical cue.

## Eksperimen dan gates sebelum scale-up

Tidak ada angka di bawah ini yang merupakan fakta saat ini. Ini adalah threshold keputusan untuk playtest pertama.

### Eksperimen 1 — Apakah loop inti sendiri menarik?

- **Build:** Calm vs Predator/Darting, safe vs risk route, tiga skill nyata, tanpa collection/currency sebagai insentif.
- **Peserta:** 5–8 pemain yang biasa memakai keyboard Indonesia, rentang kemampuan ketik yang beragam.
- **Metode:** tanpa coaching. Minta mereka melakukan dua encounter dan memilih ulang route/build.
- **Sinyal:** pemahaman sebab escape, pilihan rute, timing skill, desire replay, dan moment yang mereka ceritakan.
- **Gate lanjut:** minimal 70% dapat menjelaskan choice → consequence dan menyatakan satu eksperimen run berikutnya; jika tidak, perbaiki rule clarity/decision terlebih dahulu, bukan menambah asset.

### Eksperimen 2 — Apakah fish archetype terbaca?

- **Build:** empat archetype dengan difficulty output yang setara semampunya.
- **Metode:** sesudah setiap encounter, minta peserta memprediksi tekanan ikan berikutnya hanya dari visual/telegraph dan pengalaman sebelumnya.
- **Sinyal:** prediction accuracy, reason yang digunakan, typo recovery, dan apakah mereka menyebut text/timeout sebagai satu-satunya perbedaan.
- **Gate lanjut:** peserta membedakan setidaknya tiga behaviour tanpa tooltip dan tidak menilai salah satu sebagai "timer lebih cepat" semata.

### Eksperimen 3 — Apakah feedback membantu atau mengganggu?

- **Build:** A/B grammar feedback minimal vs current/elevated; juga reduced-effects.
- **Metode:** rekam completion, typo recovery, subjective fatigue, dan ability mengenali state tanpa floating label.
- **Sinyal:** waktu untuk merespons critical, missed signals, effect yang menghalangi text, audio fatigue.
- **Gate lanjut:** variant terpilih memperbaiki attribution tanpa menambah miss/fatigue; jika tidak, kurangi efek daripada menambah layer.

### Eksperimen 4 — Apakah 12–15 menit punya arc?

- **Build:** run tiga zona dengan satu choice/recovery beat per zona dan boss yang menggunakan pelajaran sebelumnya.
- **Metode:** plot timeline demand perhatian, interest, failure, menu time, dan retell setelah run.
- **Sinyal:** peak/release, apakah checkpoint terasa berarti, dan apakah retell berisi keputusan pribadi.
- **Gate lanjut:** ada contrast jelas antar zona; pemain bisa menceritakan minimal dua keputusan personal dan bersedia mencoba build/route lain.

## Matriks acceptance dan pengujian

| Area | Test yang wajib sebelum handoff slice | Bukti lulus |
| --- | --- | --- |
| Determinisme | Seed yang sama menghasilkan rute, fish, passage profile, risk/reward, draft, dan result range yang sama | property/unit test + tabel seed snapshot |
| Rute | Rute yang dipilih tetap berlaku sampai boundary; fish table/risk/reward mengikuti choice | unit/integration + playthrough screenshot/log |
| Archetype | Semua `typingProfile` punya target/pressure/cue distinct; tidak ada profile data yatim | content contract test + review checklist |
| Skill | Tooltip, precondition, effect, feedback, dan outcome bersesuaian | scenario tests untuk tiap skill + UX copy review |
| Catch/failure | Win/escape/cash-out/checkpoint result dapat dijelaskan dari UI sebelum resolve | scenario tests + first-time player observation |
| Boss | Tiap phase mengubah rule demand dan memiliki telegraph | phase scenario test + video review |
| Visual | Fish/target/critical status terbaca desktop dan mobile; effect tidak menutup teks | screenshot visual regression + manual contrast review |
| Audio | Cues throttled/varied; loop tidak mengganggu 10 menit | manual listening matrix + event-rate check |
| Accessibility | Reduced effects, text scale/wrap, remap/input alternative tidak menghapus required info/action | accessibility scenario matrix |
| Performance | 60 FPS target / graceful reduced-effects on integrated target | profiling session; particle/audio memory budget recorded |
| E2E | Menu → prep → route → real encounter variation → skill → checkpoint → boss → result works | browser journey; bukan hanya canvas nonblank |

## Prioritas backlog

| Urutan | ID | Outcome | Ketergantungan | Severity |
| ---: | --- | --- | --- | --- |
| 1 | G-01 | Route, risk, fish pool, reward, Sonar, dan copy menjadi kausal | keputusan model run | Kritis |
| 2 | G-02 | Passage profile, reel progress, dan encounter outcome membentuk duel yang nyata | G-01 | Kritis |
| 3 | G-03 | Skill loadout/effect/copy konsisten dan memiliki opportunity cost | G-02 | Kritis |
| 4 | G-04 | Boss tiga fase merupakan culmination mekanis | G-02, G-03 | Kritis |
| 5 | G-05 | Checkpoint/failure/cash-out memakai satu model risiko yang jujur | G-01 | Mayor |
| 6 | G-06 | Arc tiga zona punya decision/recovery beat dan pacing yang bervariasi | G-01–05 | Mayor |
| 7 | P-01 | Quality-bar common/rare/boss siap pada gameplay scale | G-02 | Mayor |
| 8 | P-02 | Layout duel memberi fish/line/target prioritas sesuai state | P-01 | Mayor |
| 9 | P-03 | VFX/audio grammar memperjelas sebab-akibat dan tidak fatigue | G-02, P-02 | Mayor |
| 10 | M-01 | Collection/economy hanya menampilkan tujuan dan sink M1 yang nyata | G-05, G-06 | Mayor |
| 11 | U-01 | First-run learning dan accessibility equivalence selesai | G-02, P-02 | Mayor |
| 12 | V-01 | Telemetry lokal, scenario tests, visual/audio/performance gates | seluruh slice sebelumnya | Mayor |

## Trade-off yang harus diterima dengan sadar

- **Lebih sedikit "feature card", lebih banyak consequence:** beberapa menu/preview dapat perlu disembunyikan sampai aktif. Ini mengurangi kesan breadth sementara, tetapi meningkatkan kepercayaan pada core loop.
- **Lebih sedikit effect besar, lebih banyak feedback yang dibaca:** screenshot mungkin tampak kurang meledak-ledak tiap detik, tetapi moment catch/boss menjadi lebih bernilai dan typing tetap nyaman.
- **Lebih sedikit fish dipoles di awal, lebih tinggi standar trio:** produksi roster tertunda sebentar, tetapi mencegah sepuluh asset yang konsisten secara filename namun tidak meyakinkan sebagai lawan.
- **Risk harus nyata atau dihapus:** risk yang nyata dapat membuat sebagian pemain kehilangan reward; karena itu recovery/cash-out perlu transparan. Jika M1 ingin arcade santai, gunakan model aman dan jangan memasang bahasa roguelite-loss.
- **Variasi profile menambah content authoring:** content Indonesia akan lebih banyak daripada satu passage list. Ini layak hanya setelah dua-archetype proof menunjukkan pemain benar-benar merasakan perbedaannya.

## Hal yang secara sengaja tidak ditambahkan

- Tidak ada ranked, multiplayer, server, shop penuh, marketplace, daily mission, atau ocean baru.
- Tidak ada power creep equipment untuk menutup masalah difficulty/feedback.
- Tidak ada penambahan puluhan species ke encounter roster sebelum sembilan ikan M1 memiliki peran berbeda.
- Tidak ada pengejaran full skeletal rig untuk semua ikan; kualitas motion dapat datang dari sprite/part kit yang konsisten, timing, pose, dan hubungan terhadap line/air.
- Tidak ada premium currency atau mekanisme retention yang memaksa replay sebelum core duel terbukti enjoyable tanpa hadiah meta.

## Urutan keputusan pemilik produk

Sebelum implementasi slice berikutnya dimulai, pemilik produk perlu mengesahkan empat keputusan ini dalam satu halaman:

1. **Model run:** arcade-safe atau expedition-risk pada checkpoint.
2. **Janji route:** apakah rute menentukan fish pool + pressure + reward, dan seberapa banyak informasi yang terlihat tanpa Sonar.
3. **Kontrak win:** hubungan tepat antara target passage, reel progress, skill, dan final catch.
4. **Art quality bar:** screenshot target common/rare/boss yang dianggap setara dengan menu sebagai produk yang sama.

Keempat keputusan ini lebih penting daripada menambah asset atau menu lain, karena mereka menentukan apakah seluruh polish berikutnya memperkuat gameplay atau hanya menyamarkan loop yang sama.

## Kriteria keberhasilan M1 yang direvisi

M1 layak dianggap siap untuk dilanjutkan bila bukti playtest menunjukkan:

- pemain baru dapat memahami dan menjelaskan duel fishing tanpa coaching;
- pemain akurat dan pemain cepat sama-sama mempunyai keputusan bermakna, dengan kelebihan/kekurangan yang terlihat;
- rute dan skill menghasilkan setidaknya dua pendekatan run yang layak dan mudah diceritakan;
- tiap ikan/behaviour mempunyai identitas bermain yang terbaca, bukan hanya sprite/angka berbeda;
- boss menguji komposisi pelajaran, bukan kesabaran pada timer panjang;
- catch yang rare atau berkualitas tinggi menjadi moment yang ingin pemain lihat ulang/ceritakan;
- pemain memilih replay untuk mencoba rute, build, atau fish target berbeda bahkan bila currency/collection sementara dimatikan;
- reduced-effects dan layout responsif tetap mempertahankan informasi/action penting;
- semua klaim UI/deskripsi bisa ditelusuri ke outcome rules yang nyata.

Jika salah satu kriteria tersebut belum terpenuhi, gunakan hasil eksperimen untuk memperbaiki *satu loop* yang terbukti lemah. Jangan menambah surface area terlebih dahulu.
