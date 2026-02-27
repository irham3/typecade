const punctuations = [".", ",", "?", "!", ";", ":", '"', "-", "(", ")"];

export const wordsEN = [
    "about", "above", "across", "act", "active", "activity", "add", "afraid", "after", "again", "age", "ago", "agree", "air", "all", "alone", "along", "already", "always", "am", "amount", "an", "and", "angry", "another", "answer", "any", "anyone", "anything", "anytime", "appear", "apple", "are", "area", "arm", "army", "around", "arrive", "art", "as", "ask", "at", "attack", "aunt", "autumn", "away", "baby", "back", "bad", "bag", "ball", "bank", "base", "basket", "bath", "be", "bear", "beautiful", "because", "become", "bed", "bedroom", "beer", "before", "begin", "behind", "bell", "below", "beside", "best", "better", "between", "big", "bird", "birth", "birthday", "bit", "bite", "black", "bleed", "block", "blood", "blow", "blue", "board", "boat", "body", "boil", "bone", "book", "border", "born", "borrow", "both", "bottle", "bottom", "bowl", "box", "boy", "branch", "brave", "bread", "break", "breakfast", "breathe", "bridge", "bright", "bring", "brother", "brown", "brush", "build", "burn", "business", "bus", "busy", "but", "buy", "by", "call", "camp", "can", "cap", "car", "card", "care", "carry", "case", "cat", "catch", "cause", "center", "certain", "chair", "chance", "change", "character", "charge", "cheap", "cheese", "chicken", "child", "children", "choose", "church", "circle", "city", "class", "clean", "clear", "clock", "close", "cloth", "cloud", "coast", "coat", "coin", "cold", "color", "column", "come", "comfortable", "common", "compare", "complete", "computer", "condition", "continue", "control", "cook", "cool", "copper", "corn", "corner", "correct", "cost", "cotton", "could", "course", "cover", "cow", "create", "crime", "cross", "cry", "cup", "cut", "dance", "danger", "dark", "daughter", "day", "dead", "deal", "dear", "death", "decide", "deep", "deer", "degree", "depend", "depth", "describe", "design", "desk", "destroy", "detail", "develop", "dictionary", "die", "difference", "different", "difficult", "dinner", "direction", "dirty", "discover", "discuss", "disease", "dish", "distance", "divide", "do", "doctor", "dog", "door", "double", "down", "draw", "dream", "dress", "drink", "drive", "drop", "dry", "duck", "dust", "duty", "each", "ear", "early", "earn", "earth", "east", "easy", "eat", "edge", "education", "effect", "egg", "eight", "either", "electric", "elephant", "else", "empty", "end", "enemy", "enjoy", "enough", "enter", "equal", "entrance", "escape", "even", "evening", "event", "ever", "every", "everyone", "exact", "everybody", "examination", "example", "except", "excited", "exercise", "expect", "expensive", "explain", "extremely", "eye", "face", "fact", "fail", "fall", "false", "family", "famous", "far", "farm", "father", "fault", "fear", "feed", "feel", "female", "fever", "few", "fight", "fill", "film", "find", "fine", "finger", "finish", "fire", "first", "fish", "fit", "five", "fix", "flag", "flat", "float", "floor", "flour", "flower", "fly", "fold", "food", "fool", "foot", "for", "force", "forest", "forget", "forgive", "fork", "form", "fox", "four", "free", "freedom", "freeze", "fresh", "friend", "friendly", "from", "front", "fruit", "full", "fun", "funny", "furniture", "further", "future", "game", "garden", "gate", "general", "gentleman", "get", "gift", "give", "glad", "glass", "go", "goat", "god", "gold", "good", "goodbye", "grandfather", "grandmother", "grass", "great", "green", "grey", "ground", "group", "grow", "gun", "hair", "half", "hall", "hammer", "hand", "happen", "happy", "hard", "hat", "hate", "have", "he", "head", "healthy", "hear", "heavy", "heart", "heaven", "height", "hello", "help", "hen", "her", "here", "hers", "hide", "high", "hill", "him", "his", "hit", "hobby", "hold", "hole", "holiday", "home", "hope", "horse", "hospital", "hot", "hotel", "hour", "house", "how", "hundred", "hungry", "hurry", "husband", "hurt", "I", "ice", "idea", "if", "important", "in", "increase", "inside", "into", "introduce", "invent", "iron", "invite", "is", "island", "it", "its", "jelly", "job", "join", "juice", "jump", "just", "keep", "key", "kill", "kind", "king", "kitchen", "knee", "knife", "knock", "know", "ladder", "lady", "lamp", "land", "large", "last", "late", "lately", "laugh", "lazy", "lead", "leaf", "learn", "leave", "leg", "left", "lend", "length", "less", "lesson", "let", "letter", "library", "lie", "life", "light", "like", "lion", "lip", "list", "listen", "little", "live", "lock", "lonely", "long", "look", "lose", "lot", "love", "low", "lower", "luck", "machine", "main", "make", "male", "man", "many", "map", "mark", "market", "marry", "matter", "may", "me", "meal", "mean", "measure", "meat", "medicine", "meet", "member", "mention", "method", "middle", "milk", "million", "mind", "minute", "miss", "mistake", "mix", "model", "modern", "moment", "money", "monkey", "month", "moon", "more", "morning", "most", "mother", "mountain", "mouth", "move", "much", "music", "must", "my", "name", "nation", "nature", "near", "nearly", "neck", "need", "needle", "nerve", "net", "never", "new", "news", "next", "nice", "night", "nine", "no", "noble", "noise", "none", "nor", "north", "nose", "not", "nothing", "notice", "now", "number", "obey", "object", "ocean", "of", "off", "offer", "office", "often", "oil", "old", "on", "one", "only", "open", "opposite", "or", "orange", "order", "other", "our", "out", "outside", "over", "own", "page", "pain", "paint", "pair", "pan", "paper", "parent", "park", "part", "partner", "party", "pass", "past", "path", "pay", "peace", "pen", "pencil", "people", "pepper", "per", "perfect", "period", "person", "pet", "picture", "piece", "pig", "pin", "pink", "place", "plane", "plant", "plastic", "plate", "play", "please", "plenty", "pocket", "point", "poison", "police", "polite", "pool", "poor", "popular", "position", "possible", "potato", "pour", "power", "present", "press", "pretty", "prevent", "price", "prince", "prison", "private", "prize", "probably", "problem", "produce", "promise", "proper", "protect", "provide", "public", "pull", "punish", "pupil", "push", "put", "queen", "question", "quick", "quiet", "quite", "radio", "rain", "rainy", "raise", "reach", "read", "ready", "real", "really", "receive", "record", "red", "remember", "remind", "remove", "rent", "repair", "reply", "report", "rest", "restaurant", "result", "return", "rice", "rich", "ride", "right", "ring", "rise", "road", "rob", "rock", "room", "round", "rubber", "rude", "rule", "ruler", "run", "rush", "sad", "safe", "sail", "salt", "same", "sand", "save", "say", "school", "science", "scissors", "search", "seat", "second", "see", "seem", "sell", "send", "sentence", "serve", "seven", "several", "sex", "shade", "shadow", "shake", "shape", "share", "sharp", "she", "sheep", "sheet", "shelf", "shine", "ship", "shirt", "shoe", "shoot", "shop", "short", "should", "shoulder", "shout", "show", "sick", "side", "signal", "silence", "silly", "silver", "similar", "simple", "single", "sing", "sink", "sister", "sit", "six", "size", "skill", "skin", "skirt", "sky", "sleep", "slip", "slow", "small", "smell", "smile", "smoke", "snow", "so", "soap", "sock", "soft", "some", "someone", "something", "sometimes", "son", "soon", "sorry", "sound", "soup", "south", "space", "speak", "special", "speed", "spell", "spend", "spoon", "sport", "spread", "spring", "square", "stamp", "stand", "star", "start", "station", "stay", "steal", "steam", "step", "still", "stomach", "stone", "stop", "store", "storm", "story", "strange", "street", "strong", "structure", "student", "study", "stupid", "subject", "substance", "successful", "such", "sudden", "sugar", "suitable", "summer", "sun", "sunny", "support", "sure", "surprise", "sweet", "swim", "sword", "table", "take", "talk", "tall", "taste", "taxi", "tea", "teach", "team", "tear", "telephone", "television", "tell", "ten", "tennis", "terrible", "test", "than", "that", "the", "their", "then", "there", "therefore", "these", "thick", "thin", "thing", "think", "third", "this", "though", "threat", "three", "tidy", "tie", "title", "to", "today", "toe", "together", "tomorrow", "tonight", "too", "tool", "tooth", "top", "total", "touch", "town", "train", "tram", "travel", "tree", "trouble", "true", "trust", "twice", "try", "turn", "type", "ugly", "uncle", "under", "understand", "unit", "until", "up", "use", "useful", "usual", "usually", "valley", "value", "various", "very", "victim", "victory", "video", "view", "village", "voice", "vote", "wait", "wake", "walk", "wall", "want", "war", "warm", "wash", "waste", "watch", "water", "wave", "way", "we", "weak", "wear", "weather", "wedding", "week", "weight", "welcome", "well", "west", "wet", "what", "wheel", "when", "where", "which", "while", "white", "who", "why", "wide", "wife", "wild", "will", "win", "wind", "window", "wine", "winter", "wire", "wise", "wish", "with", "without", "woman", "wonder", "word", "work", "world", "worry", "worst", "write", "wrong", "year", "yes", "yesterday", "yet", "you", "young", "your", "zero", "zoo"
];

export const wordsID = [
    "abadi", "abai", "abdi", "abu", "acara", "ada", "adalah", "adang", "adat", "adik", "adil", "administrasi", "adu", "aduk", "agak", "agama", "agar", "agen", "agung", "ahad", "ahli", "air", "ajaib", "ajak", "ajar", "akan", "akar", "akhir", "akibat", "aku", "akun", "akurat", "alam", "alang", "alas", "alat", "alih", "alir", "alis", "alkohol", "allah", "alpa", "alur", "ama", "aman", "amat", "ambang", "ambil", "amin", "ampun", "anak", "analisis", "ancam", "anda", "andai", "aneh", "angan", "anggap", "angka", "angkasa", "angkat", "angkut", "angsa", "anjing", "anjur", "antar", "antara", "anti", "antre", "apa", "api", "aplikasi", "apotek", "arah", "arang", "arti", "arung", "arus", "asa", "asam", "asap", "asar", "asas", "asli", "aso", "aspal", "asri", "astaga", "asuh", "atap", "atas", "atau", "awas", "awet", "ayah", "ayam", "ayo", "ayun", "baca", "badai", "badan", "bagaimana", "bagi", "bagus", "bahagia", "bahan", "bahari", "bahasa", "bahaya", "bahu", "baik", "baja", "bakal", "bakar", "bakat", "bakau", "bakteri", "baku", "balas", "balik", "balok", "balut", "bambu", "ban", "bandar", "banding", "bangkit", "bangsa", "bangun", "bank", "bantu", "banyak", "bapak", "barang", "barat", "baring", "baris", "baru", "basa", "basah", "basi", "batal", "batas", "batu", "bau", "bawa", "bawah", "bawang", "bayang", "bayar", "bayi", "bebas", "bebek", "beda", "bedah", "begitu", "bekas", "bekerja", "beku", "bela", "belah", "belakang", "belalang", "belas", "beli", "beliau", "belum", "benang", "benar", "bencana", "benci", "benda", "bengkel", "benih", "bening", "berani", "berarti", "beras", "berat", "berbagai", "berbeda", "berhenti", "beri", "berita", "berjalan", "bermain", "bersama", "bersih", "besar", "besi", "besok", "bestari", "betul", "biar", "biasa", "biaya", "bibir", "bicara", "bidadari", "bidang", "bijak", "bikin", "bila", "bilang", "bimbang", "binatang", "bintang", "bisa", "bising", "bisnis", "bisu", "biologi", "biru", "bocor", "bodoh", "bohong", "bola", "boleh", "bom", "boneka", "boring", "borong", "bosan", "botol", "buah", "buang", "buat", "budaya", "budi", "buka", "bukan", "bukit", "bukti", "buku", "bulan", "bulat", "bulu", "bumbu", "bumi", "bundar", "bunga", "bunuh", "bunyi", "buruk", "burung", "bus", "busana", "buta", "butuh", "cabang", "cabut", "cacat", "cacing", "cadang", "cahaya", "cair", "cakap", "cakar", "campur", "canda", "canggih", "cantik", "capai", "cara", "cari", "catat", "catur", "cegah", "cek", "celaka", "celana", "cemas", "cemburu", "cenderung", "cepat", "cerdas", "cerah", "cerita", "cermin", "cerna", "cetak", "cipta", "ciri", "cita", "cium", "coba", "cocok", "codot", "cokelat", "contoh", "corak", "cuaca", "cuci", "cucu", "cukup", "cuma", "curi", "cuti", "dada", "daerah", "daftar", "daging", "dagu", "dahulu", "dalam", "damai", "dan", "dana", "danau", "dapat", "dapur", "darah", "darat", "dari", "dasar", "data", "datang", "datar", "daun", "daya", "debat", "debu", "deg", "dekat", "delapan", "demam", "demi", "demikian", "denda", "dengan", "dengar", "denyut", "depan", "deras", "derita", "desa", "desain", "detail", "detik", "dewasa", "di", "dia", "diam", "didik", "diet", "digital", "dinding", "dingin", "diri", "disiplin", "diskon", "doa", "doang", "dokter", "dokumen", "dolar", "domba", "dompet", "dorong", "dosa", "dosen", "dua", "duduk", "duga", "duka", "dukung", "dulu", "dunia", "dusta", "duta", "duyung", "eboni", "edisi", "edukasi", "efek", "ego", "ekonomi", "ekor", "eksperimen", "ekspor", "elak", "elang", "emas", "empat", "empuk", "enak", "enam", "energi", "enggak", "entah", "epidemi", "era", "erat", "es", "esok", "evaluasi", "event", "evolusi", "faham", "fajar", "fakta", "faktor", "famili", "fanatik", "fardhu", "fase", "fasih", "fasilitas", "fatal", "fikir", "film", "filosofi", "final", "fisik", "fokus", "formal", "format", "foto", "frekuensi", "fungsi", "gabung", "gadis", "gado", "gagal", "gagasan", "gajah", "gaji", "galaksi", "gali", "gambar", "gampang", "ganas", "ganda", "gandum", "ganggu", "ganjil", "ganteng", "ganti", "gantung", "garam", "garis", "gas", "gatal", "gaul", "gaun", "gawang", "gaya", "gegar", "gejala", "gelap", "gelar", "gelas", "gelembung", "geli", "gelombang", "gemar", "gembira", "gempa", "gemuk", "genap", "genggam", "genit", "genting", "gerak", "gerbang", "gereja", "gigi", "gigit", "gila", "global", "godaan", "gores", "gosong", "goyang", "gua", "gugur", "gula", "gulai", "guna", "gunting", "gunung", "guru", "habis", "hadap", "hadiah", "hadir", "hafal", "hal", "halaman", "halang", "halus", "hama", "hamba", "hampir", "hancur", "hangat", "hanya", "hapus", "harap", "harga", "hari", "harta", "harum", "harus", "hasil", "hati", "haus", "hebat", "helm", "henti", "heran", "hewan", "hias", "hibur", "hidung", "hidup", "hijau", "hilang", "hina", "hindar", "hingga", "hitam", "hitung", "hiburan", "hormat", "hubung", "hujan", "hukum", "hulu", "hutan", "hutang", "ia", "ibu", "ide", "ijin", "ikan", "ikat", "iklan", "iklim", "ikut", "ilmu", "imam", "iman", "imbang", "indah", "indeks", "indra", "industri", "infeksi", "info", "informasi", "ingat", "ingin", "ini", "injak", "inti", "intip", "ipar", "irama", "iri", "iris", "isap", "isi", "islam", "istana", "istilah", "istri", "istirahat", "itu", "izin", "jabat", "jadwal", "jaga", "jagat", "jago", "jahat", "jahit", "jajak", "jajan", "jalan", "jalur", "jam", "jaman", "jamin", "jamur", "janda", "jangan", "jangka", "janji", "jantan", "jarak", "jari", "jaring", "jarum", "jasa", "jati", "jatuh", "jauh", "jawab", "jelas", "jelek", "jelita", "jemput", "jendela", "jenderal", "jengkel", "jenis", "jepit", "jeruk", "jiwa", "jodoh", "jual", "juang", "judi", "judul", "juga", "jujur", "juluk", "jumat", "jumlah", "jumpa", "jurnal", "jurus", "justru", "kabar", "kabel", "kabupaten", "kaca", "kacamata", "kacang", "kacau", "kadang", "kadar", "kader", "kaget", "kain", "kaji", "kakak", "kakek", "kaki", "kalah", "kalau", "kaldu", "kali", "kalian", "kamera", "kami", "kampanye", "kampung", "kampus", "kamu", "kanan", "kandang", "kandung", "kangen", "kantong", "kantor", "kaos", "kapal", "kapan", "kapital", "karakter", "karang", "karena", "karet", "karir", "karya", "karyawan", "kasar", "kasih", "kasur", "kata", "katak", "kawan", "kawasan", "kawat", "kawin", "kaya", "kayu", "ke", "keadaan", "kebakaran", "kebiasaan", "kecelakaan", "kecil", "kecuali", "kedua", "kejam", "kejar", "kejut", "kekal", "kelas", "keluarga", "keluar", "keliling", "kelompok", "kembali", "kemarin", "kembang", "kembar", "kemeja", "kucing", "kuda", "kue", "kulit", "kurang", "kursi", "lagi", "lahir", "lain", "laki", "laku", "lalu", "lama", "lambat", "lampu", "langit", "langsung", "lanjut", "lantai", "lapangan", "lapar", "lari", "laut", "layar", "lebih", "leher", "lelah", "lemah", "lemak", "lepas", "lewat", "libur", "lihat", "lima", "lokal", "luar", "luas", "luka", "lupa", "lurus", "maaf", "macam", "madu", "mahal", "main", "maju", "makan", "maksud", "malam", "malas", "malu", "mampu", "mana", "mandi", "manis", "manusia", "marah", "mari", "masa", "masak", "masalah", "masih", "masuk", "mata", "mati", "mau", "mawar", "mayat", "mega", "meja", "melalui", "melihat", "memang", "membaca", "membantu", "membuat", "meminta", "memilih", "menang", "menarik", "mencari", "mendapat", "mengapa", "mengerti", "menjadi", "menulis", "menurut", "menyanyi", "merah", "meraka", "mereka", "mesin", "mesti", "milik", "mimpi", "minum", "minyak", "misal", "miskin", "modal", "modern", "moga", "mohon", "momen", "motor", "muda", "mudah", "muka", "mulai", "mulut", "mungkin", "murah", "murid", "musim", "musik", "musuh", "nafas", "naga", "naik", "nama", "namun", "nanti", "napas", "nari", "nasi", "nasib", "nasional", "negara", "nenek", "neraka", "ngeri", "niat", "nilai", "nol", "nomor", "normal", "nyala", "nyaman", "nyanyi", "nyata", "obat", "objek", "olah", "olahraga", "oleh", "omong", "operasi", "opini", "optimis", "orang", "otak", "otot", "pabrik", "pacar", "padi", "pagi", "paha", "paham", "pajak", "pakai", "pakaian", "paksa", "paku", "paling", "palsu", "paman", "pamer", "panah", "panas", "panci", "pandang", "panen", "panggil", "panjang", "pantai", "pantas", "parah", "paras", "paru", "pasar", "pasir", "pasti", "pasukan", "patah", "patung", "payung", "pecah", "pedas", "peduli", "pegang", "pegunungan", "pelajar", "peluang", "pemain", "pemerintah", "pemilu", "pemuda", "penasaran", "pendek", "pengalaman", "pengaruh", "pening", "penjara", "penting", "penuh", "penyakit", "perahu", "perang", "perasaan", "percaya", "perempuan", "pergi", "perhatian", "periksa", "perintah", "perjalanan", "perlu", "pernah", "persen", "pertama", "perut", "pesan", "pesawat", "pesta", "petani", "petir", "pikir", "pilih", "pintu", "pipa", "pipi", "pisah", "pisau", "pohon", "polisi", "politik", "pria", "pribadi", "program", "proses", "publik", "pucat", "pukul", "pulang", "pulau", "puluh", "puncak", "punya", "pusat", "putih", "putra", "putri", "putus", "raba", "racun", "radio", "ragu", "rahasia", "raja", "rajin", "rakyat", "ramai", "rambut", "ranjang", "rapat", "rasa", "rata", "ratu", "ratus", "raya", "reaksi", "realitas", "rencana", "rendah", "resmi", "ribu", "ringan", "rokok", "roda", "romantis", "rotan", "roti", "ruang", "rugi", "rumah", "rumput", "rupa", "rusak", "saat", "sabar", "sadar", "saham", "sahabat", "sakit", "salah", "salam", "salju", "sama", "sambil", "sampah", "sampai", "sana", "sandal", "sangat", "sanggup", "santai", "sapa", "sapi", "saraf", "saran", "sarapan", "saudara", "sawah", "sebab", "sebagai", "sebelum", "sebentar", "sebuah", "sedang", "sedap", "sedih", "sedikit", "segera", "sehat", "sehingga", "sejak", "sejarah", "sekali", "sekarang", "sekitar", "sekolah", "selalu", "selama", "selamat", "selatan", "selesai", "seluruh", "semangat", "semacam", "semasa", "sempurna", "semua", "sendiri", "senang", "senjata", "sensus", "senyum", "sepak", "seperti", "sepi", "sepeda", "seram", "serentak", "sering", "serius", "serta", "server", "sesal", "sesuai", "sesuatu", "setan", "setelah", "setiap", "setuju", "sewa", "siang", "siap", "siapa", "sibuk", "sifat", "signifikan", "sikap", "siksa", "silakan", "simpan", "sinar", "singa", "singkat", "sini", "sisa", "sistem", "siswa", "situ", "situasi", "soal", "solid", "sombong", "sopan", "sore", "sosial", "suami", "suap", "suara", "suasana", "suatu", "subuh", "sudah", "sudut", "suhu", "suka", "sukses", "sulit", "sumber", "sumpah", "sunyi", "supaya", "suram", "surat", "surga", "susah", "susu", "syarat", "syukur", "tabel", "tabung", "tahan", "tahu", "tahun", "taja", "tajam", "tak", "tali", "tambah", "tampak", "tamu", "tanah", "tanam", "tanda", "tangan", "tangga", "tanggung", "tangis", "tanpa", "tanya", "tapi", "tari", "tarif", "tarik", "tas", "tata", "tatap", "tawa", "tawar", "tayang", "tebal", "teduh", "tegas", "teguh", "teh", "teknik", "teknologi", "teks", "telan", "telinga", "telur", "teman", "tempat", "temu", "tenaga", "tenang", "tengah", "tengok", "tentang", "tentara", "tentu", "tepat", "tepi", "terang", "terbang", "terhadap", "teriak", "terima", "terjadi", "terlalu", "termos", "terus", "tetap", "tetapi", "tewas", "tiang", "tiba", "tidak", "tidur", "tiga", "tikus", "timbang", "timbul", "timur", "tindak", "tinggal", "tinggi", "tinju", "tinta", "tipis", "tiup", "toko", "tokoh", "tolak", "tolong", "tombak", "tong", "topi", "total", "tradisi", "tua", "tuan", "tubuh", "tugas", "tuhan", "tujuan", "tulis", "tumbuh", "tunggu", "tunggal", "tunjuk", "turun", "turut", "tutup", "uang", "ubah", "udara", "ujian", "ujung", "ukur", "ular", "ulit", "umum", "umur", "undang", "unggul", "ungu", "unik", "unit", "unsur", "unta", "untuk", "untung", "upaya", "urus", "usaha", "usia", "usul", "utama", "utara", "utuh", "vaksin", "valid", "vampir", "variasi", "video", "villa", "virus", "visi", "visual", "vodka", "voli", "volume", "vonis", "vulgar", "wabah", "wajah", "wajib", "waktu", "walau", "walikota", "wanita", "warga", "warna", "warung", "waspada", "watak", "wawancara", "wilayah", "wujud", "yakin", "yakni", "yang", "yatim", "yodium", "yuyu", "zaman", "zona"
];

export const quotesEN = [
    // ── Easy (short, under 70 chars) ──
    "Done is better than perfect.",
    "Start before you are ready.",
    "Fall in love with the process.",
    "Revenue solves all problems.",
    "Love is a verb, not a noun.",
    "Ship it, then fix it.",
    "Be so good they can't ignore you.",
    "Stay hungry, stay foolish.",
    "Your vibe attracts your tribe.",
    "Risk more than others think is safe.",
    "The best time to start is now.",
    "Love is attention sustained over time.",
    "Move fast and learn things.",
    "Every expert was once a beginner.",
    "Great things never come from comfort zones.",
    "Doubt kills more dreams than failure ever will.",
    "Build something people actually want.",
    "Love is not finding the perfect person.",
    "Success is rented, never owned.",

    // ── Medium (70–140 chars) ──
    "The biggest risk is not taking any risk. In a world that is changing fast, the only strategy that fails is not taking risks.",
    "A startup is a company designed to grow fast. Nothing else matters if you don't get that right.",
    "Love does not consist of gazing at each other, but in looking outward together in the same direction.",
    "The best founders are not the smartest people in the room. They are the ones who refuse to quit and keep learning.",
    "Your most unhappy customers are your greatest source of learning. Listen to them closely.",
    "Being deeply loved gives you strength, while loving someone deeply gives you courage to face anything.",
    "Price is what you pay. Value is what you get. Never confuse the two when building or buying.",
    "The heart was made to be broken, and love was made to be risked. That is its entire purpose.",
    "People do not buy what you do, they buy why you do it. Start with purpose, not product.",
    "Love is when the other person's happiness matters more than your own, and it does not feel like sacrifice.",
    "You do not need permission to build something great. You need discipline, consistency, and patience.",
    "The graveyard is the richest place on earth, full of ideas that were never pursued and songs never sung.",
    "I have decided to stick with love because hate is too great a burden to carry through life.",
    "The only way to do great work is to love what you do. If you have not found it yet, keep looking.",
    "Romance is the glamour which turns the dust of everyday life into a golden haze of wonder.",
    "Innovation distinguishes between a leader and a follower. Choose to lead, even when it is harder.",
    "The best relationships are built on trust, communication, and a willingness to grow together.",
    "Ideas are easy. Implementation is hard. The difference between a dreamer and a founder is execution.",
    "To love and be loved is to feel the sun from both sides, warming you inside and out.",

    // ── Hard (over 140 chars) ──
    "It is not the critic who counts; not the man who points out how the strong stumble, or where the doer could have done better. The credit belongs to the person who is actually in the arena.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. Keep going even when every part of you wants to stop, because that is where the breakthrough lives.",
    "The most important thing in communication is hearing what is not said. Great leaders listen between the lines, great lovers listen between the silences, and great founders listen between the complaints.",
    "You can fail at what you do not want, so you might as well take a chance on doing what you love. The worst that happens is you end up exactly where you would have been anyway, but with fewer regrets.",
    "The moment you feel like you have to prove your worth to someone is the moment to absolutely and utterly walk away. Love should never require you to shrink yourself to fit inside someone else's comfort zone.",
    "If you want to build a ship, do not drum up the men to gather wood, divide the work, and give orders. Instead, teach them to yearn for the vast and endless sea, and they will build the ship themselves.",
    "We loved with a love that was more than love. It grew between the cracks of our ordinary days and filled every silence with meaning, every glance with belonging, every argument with a reason to stay.",
    "Entrepreneurship is living a few years of your life like most people will not, so that you can spend the rest of your life like most people cannot. The sacrifice is temporary, but the freedom is forever.",
    "Love is not about how much you say I love you, but how much you prove that it is true through the small, consistent, unglamorous acts of showing up for someone when it would be easier not to.",
    "Building a company is like eating glass and staring into the abyss of death. If you are wired for that kind of pain, there is nothing else in the world you would rather do, because the mission matters more than the comfort.",
    "The real test of love is not how you feel at the peak of passion, but how you treat each other in the quiet valleys when the excitement fades and all that remains is the decision to keep choosing one another, day after day.",
];

export const quotesID = [
    // ── Easy (short, under 70 chars) ──
    "Mulai saja dulu, sempurnakan sambil jalan.",
    "Jatuh cinta itu gratis, bangun bisnis tidak.",
    "Gagal itu guru, bukan musuh.",
    "Cinta itu kata kerja, bukan kata benda.",
    "Lakukan yang kamu takuti setiap hari.",
    "Rejeki tidak pernah tertukar.",
    "Kerja keras mengalahkan bakat yang malas.",
    "Cinta tumbuh dari kebiasaan, bukan kebetulan.",
    "Jangan tunggu sempurna, mulai dari cukup.",
    "Risiko terbesar adalah tidak mengambil risiko.",
    "Bangun sesuatu yang orang benar-benar butuhkan.",
    "Hati yang ikhlas menarik rezeki yang baik.",
    "Kesuksesan disewa, tidak pernah dimiliki.",
    "Cinta sejati tidak pernah menuntut kamu berubah.",
    "Fokus pada solusi, bukan masalah.",
    "Yang terbaik belum datang.",
    "Mimpi tanpa eksekusi hanya ilusi.",
    "Jadilah alasan seseorang tersenyum hari ini.",

    // ── Medium (70–140 chars) ──
    "Jangan pernah menyerah pada mimpi hanya karena waktu yang dibutuhkan untuk mencapainya. Waktu akan berlalu bagaimanapun juga.",
    "Kesuksesan bukanlah kunci kebahagiaan. Kebahagiaanlah yang menjadi kunci kesuksesan. Cintai apa yang kamu lakukan.",
    "Cinta tidak terdiri dari saling memandang, tetapi bersama-sama melihat ke arah yang sama dengan penuh harapan.",
    "Seorang pengusaha melihat peluang di mana orang lain melihat hambatan, dan membangun jembatan di mana orang lain melihat jurang.",
    "Harga yang kamu bayar untuk sesuatu dan nilai yang kamu dapat adalah dua hal berbeda. Jangan pernah mencampurkan keduanya.",
    "Dicintai secara mendalam memberimu kekuatan, sementara mencintai secara mendalam memberimu keberanian menghadapi segalanya.",
    "Pelanggan yang paling tidak puas adalah sumber pembelajaran terbesar. Dengarkan keluhan mereka dengan telinga terbuka.",
    "Orang tidak membeli apa yang kamu jual, mereka membeli alasan kamu menjualnya. Mulailah dari tujuan, bukan produk.",
    "Inovasi membedakan pemimpin dari pengikut. Pilihlah untuk memimpin, bahkan ketika jalan itu lebih sulit dari yang dibayangkan.",
    "Cinta adalah ketika kebahagiaan orang lain lebih penting dari kebahagiaanmu sendiri, dan itu tidak terasa seperti pengorbanan.",
    "Hubungan terbaik dibangun dari kepercayaan, komunikasi yang jujur, dan kemauan untuk bertumbuh bersama melewati segala musim.",
    "Kuburan adalah tempat terkaya di bumi, penuh dengan ide yang tidak pernah diwujudkan dan lagu yang tidak pernah dinyanyikan.",
    "Romansa adalah sihir yang mengubah debu kehidupan sehari-hari menjadi kabut emas penuh keajaiban dan rasa syukur.",
    "Ide itu mudah didapat. Eksekusi yang sulit. Perbedaan antara pemimpi dan pendiri adalah keberanian untuk bertindak.",
    "Aku memutuskan untuk tetap memilih cinta, karena kebencian adalah beban yang terlalu berat untuk dibawa sepanjang hidup.",

    // ── Hard (over 140 chars) ──
    "Bukan kritikus yang patut dihargai, bukan mereka yang menunjukkan bagaimana orang kuat tersandung. Penghargaan itu milik mereka yang benar-benar berada di arena, yang wajahnya kotor oleh debu dan keringat perjuangan.",
    "Kesuksesan bukanlah akhir, kegagalan bukanlah hal yang fatal. Yang terpenting adalah keberanian untuk terus melangkah, bahkan ketika seluruh tubuhmu ingin berhenti, karena di situlah terobosan sesungguhnya menunggu.",
    "Hal terpenting dalam komunikasi adalah mendengar apa yang tidak diucapkan. Pemimpin hebat mendengar di antara kata-kata, kekasih hebat mendengar di antara keheningan, dan pendiri hebat mendengar di antara keluhan pelanggan.",
    "Kamu bisa gagal melakukan hal yang tidak kamu sukai, jadi lebih baik ambil kesempatan untuk melakukan hal yang kamu cintai. Yang terburuk yang bisa terjadi adalah kamu kembali ke titik awal, tapi dengan lebih sedikit penyesalan.",
    "Saat kamu merasa harus membuktikan nilaimu kepada seseorang, itulah saat yang tepat untuk pergi. Cinta sejati tidak pernah memintamu untuk mengecilkan dirimu agar muat di dalam zona nyaman orang lain yang tidak mau bertumbuh.",
    "Jika ingin membangun kapal, jangan suruh orang mengumpulkan kayu, membagi tugas, dan memberi perintah. Sebaliknya, ajari mereka merindukan lautan luas yang tak berujung, dan mereka akan membangun kapal itu sendiri dengan penuh semangat.",
    "Menjadi pengusaha berarti menjalani beberapa tahun hidupmu seperti yang kebanyakan orang tidak mau, agar kamu bisa menghabiskan sisa hidupmu seperti yang kebanyakan orang tidak bisa. Pengorbanannya sementara, tapi kebebasannya selamanya.",
    "Cinta bukan soal seberapa sering kamu mengucapkan aku cinta kamu, tapi seberapa besar kamu membuktikannya lewat tindakan kecil, konsisten, dan tanpa glamor, yaitu hadir untuk seseorang ketika akan lebih mudah untuk tidak melakukannya.",
    "Membangun perusahaan itu seperti memakan kaca dan menatap jurang kematian. Jika otakmu memang dirancang untuk rasa sakit seperti itu, tidak ada hal lain di dunia yang lebih ingin kamu lakukan, karena misinya lebih besar dari kenyamananmu.",
    "Ujian cinta yang sesungguhnya bukan bagaimana perasaanmu di puncak gairah, tapi bagaimana kalian memperlakukan satu sama lain di lembah yang sunyi, ketika kegembiraan pudar dan yang tersisa hanyalah keputusan untuk terus saling memilih setiap hari.",
];

const createRandom = (seed?: string) => {
    let seedVal = seed ? Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0) : Math.random() * 0xFFFFFFFF;
    return () => {
        if (!seed) return Math.random();
        let t = seedVal += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
};

export function generateWords(language: "EN" | "ID", count: number, usePunctuation: boolean, useNumbers: boolean, seed?: string): string {
    const wordList = language === "EN" ? wordsEN : wordsID;
    const result: string[] = [];
    const random = createRandom(seed);

    for (let i = 0; i < count; i++) {
        let word = wordList[Math.floor(random() * wordList.length)];

        if (useNumbers && random() > 0.8) {
            word = Math.floor(random() * 100).toString();
        }

        if (usePunctuation && random() > 0.85) {
            const punct = punctuations[Math.floor(random() * punctuations.length)];
            if (punct === '"') {
                word = `"${word}"`;
            } else if (punct === "(") {
                word = `(${word})`;
            } else {
                word = `${word}${punct}`;
            }
        }

        if (usePunctuation && random() > 0.9) {
            word = word.charAt(0).toUpperCase() + word.slice(1);
        }

        result.push(word);
    }

    return result.join(" ");
}

export function generateQuote(language: "EN" | "ID", difficulty?: "Easy" | "Medium" | "Hard", seed?: string): string {
    const list = language === "EN" ? quotesEN : quotesID;
    const random = createRandom(seed);

    let filtered = list;
    if (difficulty === "Easy") {
        filtered = list.filter(q => q.length <= 60);
    } else if (difficulty === "Medium") {
        filtered = list.filter(q => q.length > 60 && q.length <= 150);
    } else if (difficulty === "Hard") {
        filtered = list.filter(q => q.length > 150);
    }

    // Fallback to full list if no quotes match the difficulty bracket
    if (filtered.length === 0) filtered = list;

    return filtered[Math.floor(random() * filtered.length)];
}
