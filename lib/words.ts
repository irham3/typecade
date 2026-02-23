const punctuations = [".", ",", "?", "!", ";", ":", '"', "-", "(", ")"];

export const wordsEN = [
    "about", "above", "across", "act", "active", "activity", "add", "afraid", "after", "again", "age", "ago", "agree", "air", "all", "alone", "along", "already", "always", "am", "amount", "an", "and", "angry", "another", "answer", "any", "anyone", "anything", "anytime", "appear", "apple", "are", "area", "arm", "army", "around", "arrive", "art", "as", "ask", "at", "attack", "aunt", "autumn", "away", "baby", "back", "bad", "bag", "ball", "bank", "base", "basket", "bath", "be", "bear", "beautiful", "because", "become", "bed", "bedroom", "beer", "before", "begin", "behind", "bell", "below", "beside", "best", "better", "between", "big", "bird", "birth", "birthday", "bit", "bite", "black", "bleed", "block", "blood", "blow", "blue", "board", "boat", "body", "boil", "bone", "book", "border", "born", "borrow", "both", "bottle", "bottom", "bowl", "box", "boy", "branch", "brave", "bread", "break", "breakfast", "breathe", "bridge", "bright", "bring", "brother", "brown", "brush", "build", "burn", "business", "bus", "busy", "but", "buy", "by", "call", "camp", "can", "cap", "car", "card", "care", "carry", "case", "cat", "catch", "cause", "center", "certain", "chair", "chance", "change", "character", "charge", "cheap", "cheese", "chicken", "child", "children", "choose", "church", "circle", "city", "class", "clean", "clear", "clock", "close", "cloth", "cloud", "coast", "coat", "coin", "cold", "color", "column", "come", "comfortable", "common", "compare", "complete", "computer", "condition", "continue", "control", "cook", "cool", "copper", "corn", "corner", "correct", "cost", "cotton", "could", "course", "cover", "cow", "create", "crime", "cross", "cry", "cup", "cut", "dance", "danger", "dark", "daughter", "day", "dead", "deal", "dear", "death", "decide", "deep", "deer", "degree", "depend", "depth", "describe", "design", "desk", "destroy", "detail", "develop", "dictionary", "die", "difference", "different", "difficult", "dinner", "direction", "dirty", "discover", "discuss", "disease", "dish", "distance", "divide", "do", "doctor", "dog", "door", "double", "down", "draw", "dream", "dress", "drink", "drive", "drop", "dry", "duck", "dust", "duty", "each", "ear", "early", "earn", "earth", "east", "easy", "eat", "edge", "education", "effect", "egg", "eight", "either", "electric", "elephant", "else", "empty", "end", "enemy", "enjoy", "enough", "enter", "equal", "entrance", "escape", "even", "evening", "event", "ever", "every", "everyone", "exact", "everybody", "examination", "example", "except", "excited", "exercise", "expect", "expensive", "explain", "extremely", "eye", "face", "fact", "fail", "fall", "false", "family", "famous", "far", "farm", "father", "fault", "fear", "feed", "feel", "female", "fever", "few", "fight", "fill", "film", "find", "fine", "finger", "finish", "fire", "first", "fish", "fit", "five", "fix", "flag", "flat", "float", "floor", "flour", "flower", "fly", "fold", "food", "fool", "foot", "for", "force", "forest", "forget", "forgive", "fork", "form", "fox", "four", "free", "freedom", "freeze", "fresh", "friend", "friendly", "from", "front", "fruit", "full", "fun", "funny", "furniture", "further", "future", "game", "garden", "gate", "general", "gentleman", "get", "gift", "give", "glad", "glass", "go", "goat", "god", "gold", "good", "goodbye", "grandfather", "grandmother", "grass", "great", "green", "grey", "ground", "group", "grow", "gun", "hair", "half", "hall", "hammer", "hand", "happen", "happy", "hard", "hat", "hate", "have", "he", "head", "healthy", "hear", "heavy", "heart", "heaven", "height", "hello", "help", "hen", "her", "here", "hers", "hide", "high", "hill", "him", "his", "hit", "hobby", "hold", "hole", "holiday", "home", "hope", "horse", "hospital", "hot", "hotel", "hour", "house", "how", "hundred", "hungry", "hurry", "husband", "hurt", "I", "ice", "idea", "if", "important", "in", "increase", "inside", "into", "introduce", "invent", "iron", "invite", "is", "island", "it", "its", "jelly", "job", "join", "juice", "jump", "just", "keep", "key", "kill", "kind", "king", "kitchen", "knee", "knife", "knock", "know", "ladder", "lady", "lamp", "land", "large", "last", "late", "lately", "laugh", "lazy", "lead", "leaf", "learn", "leave", "leg", "left", "lend", "length", "less", "lesson", "let", "letter", "library", "lie", "life", "light", "like", "lion", "lip", "list", "listen", "little", "live", "lock", "lonely", "long", "look", "lose", "lot", "love", "low", "lower", "luck", "machine", "main", "make", "male", "man", "many", "map", "mark", "market", "marry", "matter", "may", "me", "meal", "mean", "measure", "meat", "medicine", "meet", "member", "mention", "method", "middle", "milk", "million", "mind", "minute", "miss", "mistake", "mix", "model", "modern", "moment", "money", "monkey", "month", "moon", "more", "morning", "most", "mother", "mountain", "mouth", "move", "much", "music", "must", "my", "name", "nation", "nature", "near", "nearly", "neck", "need", "needle", "nerve", "net", "never", "new", "news", "next", "nice", "night", "nine", "no", "noble", "noise", "none", "nor", "north", "nose", "not", "nothing", "notice", "now", "number", "obey", "object", "ocean", "of", "off", "offer", "office", "often", "oil", "old", "on", "one", "only", "open", "opposite", "or", "orange", "order", "other", "our", "out", "outside", "over", "own", "page", "pain", "paint", "pair", "pan", "paper", "parent", "park", "part", "partner", "party", "pass", "past", "path", "pay", "peace", "pen", "pencil", "people", "pepper", "per", "perfect", "period", "person", "pet", "picture", "piece", "pig", "pin", "pink", "place", "plane", "plant", "plastic", "plate", "play", "please", "plenty", "pocket", "point", "poison", "police", "polite", "pool", "poor", "popular", "position", "possible", "potato", "pour", "power", "present", "press", "pretty", "prevent", "price", "prince", "prison", "private", "prize", "probably", "problem", "produce", "promise", "proper", "protect", "provide", "public", "pull", "punish", "pupil", "push", "put", "queen", "question", "quick", "quiet", "quite", "radio", "rain", "rainy", "raise", "reach", "read", "ready", "real", "really", "receive", "record", "red", "remember", "remind", "remove", "rent", "repair", "reply", "report", "rest", "restaurant", "result", "return", "rice", "rich", "ride", "right", "ring", "rise", "road", "rob", "rock", "room", "round", "rubber", "rude", "rule", "ruler", "run", "rush", "sad", "safe", "sail", "salt", "same", "sand", "save", "say", "school", "science", "scissors", "search", "seat", "second", "see", "seem", "sell", "send", "sentence", "serve", "seven", "several", "sex", "shade", "shadow", "shake", "shape", "share", "sharp", "she", "sheep", "sheet", "shelf", "shine", "ship", "shirt", "shoe", "shoot", "shop", "short", "should", "shoulder", "shout", "show", "sick", "side", "signal", "silence", "silly", "silver", "similar", "simple", "single", "sing", "sink", "sister", "sit", "six", "size", "skill", "skin", "skirt", "sky", "sleep", "slip", "slow", "small", "smell", "smile", "smoke", "snow", "so", "soap", "sock", "soft", "some", "someone", "something", "sometimes", "son", "soon", "sorry", "sound", "soup", "south", "space", "speak", "special", "speed", "spell", "spend", "spoon", "sport", "spread", "spring", "square", "stamp", "stand", "star", "start", "station", "stay", "steal", "steam", "step", "still", "stomach", "stone", "stop", "store", "storm", "story", "strange", "street", "strong", "structure", "student", "study", "stupid", "subject", "substance", "successful", "such", "sudden", "sugar", "suitable", "summer", "sun", "sunny", "support", "sure", "surprise", "sweet", "swim", "sword", "table", "take", "talk", "tall", "taste", "taxi", "tea", "teach", "team", "tear", "telephone", "television", "tell", "ten", "tennis", "terrible", "test", "than", "that", "the", "their", "then", "there", "therefore", "these", "thick", "thin", "thing", "think", "third", "this", "though", "threat", "three", "tidy", "tie", "title", "to", "today", "toe", "together", "tomorrow", "tonight", "too", "tool", "tooth", "top", "total", "touch", "town", "train", "tram", "travel", "tree", "trouble", "true", "trust", "twice", "try", "turn", "type", "ugly", "uncle", "under", "understand", "unit", "until", "up", "use", "useful", "usual", "usually", "valley", "value", "various", "very", "victim", "victory", "video", "view", "village", "voice", "vote", "wait", "wake", "walk", "wall", "want", "war", "warm", "wash", "waste", "watch", "water", "wave", "way", "we", "weak", "wear", "weather", "wedding", "week", "weight", "welcome", "well", "west", "wet", "what", "wheel", "when", "where", "which", "while", "white", "who", "why", "wide", "wife", "wild", "will", "win", "wind", "window", "wine", "winter", "wire", "wise", "wish", "with", "without", "woman", "wonder", "word", "work", "world", "worry", "worst", "write", "wrong", "year", "yes", "yesterday", "yet", "you", "young", "your", "zero", "zoo"
];

export const wordsID = [
    "abadi", "abai", "abdi", "abu", "acara", "ada", "adalah", "adang", "adat", "adik", "adil", "administrasi", "adu", "aduk", "agak", "agama", "agar", "agen", "agung", "ahad", "ahli", "air", "ajaib", "ajak", "ajar", "akan", "akar", "akhir", "akibat", "aku", "akun", "akurat", "alam", "alang", "alas", "alat", "alih", "alir", "alis", "alkohol", "allah", "alpa", "alur", "ama", "aman", "amat", "ambang", "ambil", "amin", "ampun", "anak", "analisis", "ancam", "anda", "andai", "aneh", "angan", "anggap", "angka", "angkasa", "angkat", "angkut", "angsa", "anjing", "anjur", "antar", "antara", "anti", "antre", "apa", "api", "aplikasi", "apotek", "arah", "arang", "arti", "arung", "arus", "asa", "asam", "asap", "asar", "asas", "asli", "aso", "aspal", "asri", "astaga", "asuh", "atap", "atas", "atau", "awas", "awet", "ayah", "ayam", "ayo", "ayun", "baca", "badai", "badan", "bagaimana", "bagi", "bagus", "bahagia", "bahan", "bahari", "bahasa", "bahaya", "bahu", "baik", "baja", "bakal", "bakar", "bakat", "bakau", "bakteri", "baku", "balas", "balik", "balok", "balut", "bambu", "ban", "bandar", "banding", "bangkit", "bangsa", "bangun", "bank", "bantu", "banyak", "bapak", "barang", "barat", "baring", "baris", "baru", "basa", "basah", "basi", "batal", "batas", "batu", "bau", "bawa", "bawah", "bawang", "bayang", "bayar", "bayi", "bebas", "bebek", "beda", "bedah", "begitu", "bekas", "bekerja", "beku", "bela", "belah", "belakang", "belalang", "belas", "beli", "beliau", "belum", "benang", "benar", "bencana", "benci", "benda", "bengkel", "benih", "bening", "berani", "berarti", "beras", "berat", "berbagai", "berbeda", "berhenti", "beri", "berita", "berjalan", "bermain", "bersama", "bersih", "besar", "besi", "besok", "bestari", "betul", "biar", "biasa", "biaya", "bibir", "bicara", "bidadari", "bidang", "bijak", "bikin", "bila", "bilang", "bimbang", "binatang", "bintang", "bisa", "bising", "bisnis", "bisu", "biologi", "biru", "bocor", "bodoh", "bohong", "bola", "boleh", "bom", "boneka", "boring", "borong", "bosan", "botol", "buah", "buang", "buat", "budaya", "budi", "buka", "bukan", "bukit", "bukti", "buku", "bulan", "bulat", "bulu", "bumbu", "bumi", "bundar", "bunga", "bunuh", "bunyi", "buruk", "burung", "bus", "busana", "buta", "butuh", "cabang", "cabut", "cacat", "cacing", "cadang", "cahaya", "cair", "cakap", "cakar", "campur", "canda", "canggih", "cantik", "capai", "cara", "cari", "catat", "catur", "cegah", "cek", "celaka", "celana", "cemas", "cemburu", "cenderung", "cepat", "cerdas", "cerah", "cerita", "cermin", "cerna", "cetak", "cipta", "ciri", "cita", "cium", "coba", "cocok", "codot", "cokelat", "contoh", "corak", "cuaca", "cuci", "cucu", "cukup", "cuma", "curi", "cuti", "dada", "daerah", "daftar", "daging", "dagu", "dahulu", "dalam", "damai", "dan", "dana", "danau", "dapat", "dapur", "darah", "darat", "dari", "dasar", "data", "datang", "datar", "daun", "daya", "debat", "debu", "deg", "dekat", "delapan", "demam", "demi", "demikian", "denda", "dengan", "dengar", "denyut", "depan", "deras", "derita", "desa", "desain", "detail", "detik", "dewasa", "di", "dia", "diam", "didik", "diet", "digital", "dinding", "dingin", "diri", "disiplin", "diskon", "doa", "doang", "dokter", "dokumen", "dolar", "domba", "dompet", "dorong", "dosa", "dosen", "dua", "duduk", "duga", "duka", "dukung", "dulu", "dunia", "dusta", "duta", "duyung", "eboni", "edisi", "edukasi", "efek", "ego", "ekonomi", "ekor", "eksperimen", "ekspor", "elak", "elang", "emas", "empat", "empuk", "enak", "enam", "energi", "enggak", "entah", "epidemi", "era", "erat", "es", "esok", "evaluasi", "event", "evolusi", "faham", "fajar", "fakta", "faktor", "famili", "fanatik", "fardhu", "fase", "fasih", "fasilitas", "fatal", "fikir", "film", "filosofi", "final", "fisik", "fokus", "formal", "format", "foto", "frekuensi", "fungsi", "gabung", "gadis", "gado", "gagal", "gagasan", "gajah", "gaji", "galaksi", "gali", "gambar", "gampang", "ganas", "ganda", "gandum", "ganggu", "ganjil", "ganteng", "ganti", "gantung", "garam", "garis", "gas", "gatal", "gaul", "gaun", "gawang", "gaya", "gegar", "gejala", "gelap", "gelar", "gelas", "gelembung", "geli", "gelombang", "gemar", "gembira", "gempa", "gemuk", "genap", "genggam", "genit", "genting", "gerak", "gerbang", "gereja", "gigi", "gigit", "gila", "global", "godaan", "gores", "gosong", "goyang", "gua", "gugur", "gula", "gulai", "guna", "gunting", "gunung", "guru", "habis", "hadap", "hadiah", "hadir", "hafal", "hal", "halaman", "halang", "halus", "hama", "hamba", "hampir", "hancur", "hangat", "hanya", "hapus", "harap", "harga", "hari", "harta", "harum", "harus", "hasil", "hati", "haus", "hebat", "helm", "henti", "heran", "hewan", "hias", "hibur", "hidung", "hidup", "hijau", "hilang", "hina", "hindar", "hingga", "hitam", "hitung", "hiburan", "hormat", "hubung", "hujan", "hukum", "hulu", "hutan", "hutang", "ia", "ibu", "ide", "ijin", "ikan", "ikat", "iklan", "iklim", "ikut", "ilmu", "imam", "iman", "imbang", "indah", "indeks", "indra", "industri", "infeksi", "info", "informasi", "ingat", "ingin", "ini", "injak", "inti", "intip", "ipar", "irama", "iri", "iris", "isap", "isi", "islam", "istana", "istilah", "istri", "istirahat", "itu", "izin", "jabat", "jadwal", "jaga", "jagat", "jago", "jahat", "jahit", "jajak", "jajan", "jalan", "jalur", "jam", "jaman", "jamin", "jamur", "janda", "jangan", "jangka", "janji", "jantan", "jarak", "jari", "jaring", "jarum", "jasa", "jati", "jatuh", "jauh", "jawab", "jelas", "jelek", "jelita", "jemput", "jendela", "jenderal", "jengkel", "jenis", "jepit", "jeruk", "jiwa", "jodoh", "jual", "juang", "judi", "judul", "juga", "jujur", "juluk", "jumat", "jumlah", "jumpa", "jurnal", "jurus", "justru", "kabar", "kabel", "kabupaten", "kaca", "kacamata", "kacang", "kacau", "kadang", "kadar", "kader", "kaget", "kain", "kaji", "kakak", "kakek", "kaki", "kalah", "kalau", "kaldu", "kali", "kalian", "kamera", "kami", "kampanye", "kampung", "kampus", "kamu", "kanan", "kandang", "kandung", "kangen", "kantong", "kantor", "kaos", "kapal", "kapan", "kapital", "karakter", "karang", "karena", "karet", "karir", "karya", "karyawan", "kasar", "kasih", "kasur", "kata", "katak", "kawan", "kawasan", "kawat", "kawin", "kaya", "kayu", "ke", "keadaan", "kebakaran", "kebiasaan", "kecelakaan", "kecil", "kecuali", "kedua", "kejam", "kejar", "kejut", "kekal", "kelas", "keluarga", "keluar", "keliling", "kelompok", "kembali", "kemarin", "kembang", "kembar", "kemeja", "kucing", "kuda", "kue", "kulit", "kurang", "kursi", "lagi", "lahir", "lain", "laki", "laku", "lalu", "lama", "lambat", "lampu", "langit", "langsung", "lanjut", "lantai", "lapangan", "lapar", "lari", "laut", "layar", "lebih", "leher", "lelah", "lemah", "lemak", "lepas", "lewat", "libur", "lihat", "lima", "lokal", "luar", "luas", "luka", "lupa", "lurus", "maaf", "macam", "madu", "mahal", "main", "maju", "makan", "maksud", "malam", "malas", "malu", "mampu", "mana", "mandi", "manis", "manusia", "marah", "mari", "masa", "masak", "masalah", "masih", "masuk", "mata", "mati", "mau", "mawar", "mayat", "mega", "meja", "melalui", "melihat", "memang", "membaca", "membantu", "membuat", "meminta", "memilih", "menang", "menarik", "mencari", "mendapat", "mengapa", "mengerti", "menjadi", "menulis", "menurut", "menyanyi", "merah", "meraka", "mereka", "mesin", "mesti", "milik", "mimpi", "minum", "minyak", "misal", "miskin", "modal", "modern", "moga", "mohon", "momen", "motor", "muda", "mudah", "muka", "mulai", "mulut", "mungkin", "murah", "murid", "musim", "musik", "musuh", "nafas", "naga", "naik", "nama", "namun", "nanti", "napas", "nari", "nasi", "nasib", "nasional", "negara", "nenek", "neraka", "ngeri", "niat", "nilai", "nol", "nomor", "normal", "nyala", "nyaman", "nyanyi", "nyata", "obat", "objek", "olah", "olahraga", "oleh", "omong", "operasi", "opini", "optimis", "orang", "otak", "otot", "pabrik", "pacar", "padi", "pagi", "paha", "paham", "pajak", "pakai", "pakaian", "paksa", "paku", "paling", "palsu", "paman", "pamer", "panah", "panas", "panci", "pandang", "panen", "panggil", "panjang", "pantai", "pantas", "parah", "paras", "paru", "pasar", "pasir", "pasti", "pasukan", "patah", "patung", "payung", "pecah", "pedas", "peduli", "pegang", "pegunungan", "pelajar", "peluang", "pemain", "pemerintah", "pemilu", "pemuda", "penasaran", "pendek", "pengalaman", "pengaruh", "pening", "penjara", "penting", "penuh", "penyakit", "perahu", "perang", "perasaan", "percaya", "perempuan", "pergi", "perhatian", "periksa", "perintah", "perjalanan", "perlu", "pernah", "persen", "pertama", "perut", "pesan", "pesawat", "pesta", "petani", "petir", "pikir", "pilih", "pintu", "pipa", "pipi", "pisah", "pisau", "pohon", "polisi", "politik", "pria", "pribadi", "program", "proses", "publik", "pucat", "pukul", "pulang", "pulau", "puluh", "puncak", "punya", "pusat", "putih", "putra", "putri", "putus", "raba", "racun", "radio", "ragu", "rahasia", "raja", "rajin", "rakyat", "ramai", "rambut", "ranjang", "rapat", "rasa", "rata", "ratu", "ratus", "raya", "reaksi", "realitas", "rencana", "rendah", "resmi", "ribu", "ringan", "rokok", "roda", "romantis", "rotan", "roti", "ruang", "rugi", "rumah", "rumput", "rupa", "rusak", "saat", "sabar", "sadar", "saham", "sahabat", "sakit", "salah", "salam", "salju", "sama", "sambil", "sampah", "sampai", "sana", "sandal", "sangat", "sanggup", "santai", "sapa", "sapi", "saraf", "saran", "sarapan", "saudara", "sawah", "sebab", "sebagai", "sebelum", "sebentar", "sebuah", "sedang", "sedap", "sedih", "sedikit", "segera", "sehat", "sehingga", "sejak", "sejarah", "sekali", "sekarang", "sekitar", "sekolah", "selalu", "selama", "selamat", "selatan", "selesai", "seluruh", "semangat", "semacam", "semasa", "sempurna", "semua", "sendiri", "senang", "senjata", "sensus", "senyum", "sepak", "seperti", "sepi", "sepeda", "seram", "serentak", "sering", "serius", "serta", "server", "sesal", "sesuai", "sesuatu", "setan", "setelah", "setiap", "setuju", "sewa", "siang", "siap", "siapa", "sibuk", "sifat", "signifikan", "sikap", "siksa", "silakan", "simpan", "sinar", "singa", "singkat", "sini", "sisa", "sistem", "siswa", "situ", "situasi", "soal", "solid", "sombong", "sopan", "sore", "sosial", "suami", "suap", "suara", "suasana", "suatu", "subuh", "sudah", "sudut", "suhu", "suka", "sukses", "sulit", "sumber", "sumpah", "sunyi", "supaya", "suram", "surat", "surga", "susah", "susu", "syarat", "syukur", "tabel", "tabung", "tahan", "tahu", "tahun", "taja", "tajam", "tak", "tali", "tambah", "tampak", "tamu", "tanah", "tanam", "tanda", "tangan", "tangga", "tanggung", "tangis", "tanpa", "tanya", "tapi", "tari", "tarif", "tarik", "tas", "tata", "tatap", "tawa", "tawar", "tayang", "tebal", "teduh", "tegas", "teguh", "teh", "teknik", "teknologi", "teks", "telan", "telinga", "telur", "teman", "tempat", "temu", "tenaga", "tenang", "tengah", "tengok", "tentang", "tentara", "tentu", "tepat", "tepi", "terang", "terbang", "terhadap", "teriak", "terima", "terjadi", "terlalu", "termos", "terus", "tetap", "tetapi", "tewas", "tiang", "tiba", "tidak", "tidur", "tiga", "tikus", "timbang", "timbul", "timur", "tindak", "tinggal", "tinggi", "tinju", "tinta", "tipis", "tiup", "toko", "tokoh", "tolak", "tolong", "tombak", "tong", "topi", "total", "tradisi", "tua", "tuan", "tubuh", "tugas", "tuhan", "tujuan", "tulis", "tumbuh", "tunggu", "tunggal", "tunjuk", "turun", "turut", "tutup", "uang", "ubah", "udara", "ujian", "ujung", "ukur", "ular", "ulit", "umum", "umur", "undang", "unggul", "ungu", "unik", "unit", "unsur", "unta", "untuk", "untung", "upaya", "urus", "usaha", "usia", "usul", "utama", "utara", "utuh", "vaksin", "valid", "vampir", "variasi", "video", "villa", "virus", "visi", "visual", "vodka", "voli", "volume", "vonis", "vulgar", "wabah", "wajah", "wajib", "waktu", "walau", "walikota", "wanita", "warga", "warna", "warung", "waspada", "watak", "wawancara", "wilayah", "wujud", "yakin", "yakni", "yang", "yatim", "yodium", "yuyu", "zaman", "zona"
];

export const quotesEN = [
    "Small steps still move the dream forward, and small habits become steady victories over time.",
    "Love grows where patience is practiced, and it deepens when two people keep choosing each other.",
    "A calm mind can hear the quiet win, the kind that arrives when no one is watching.",
    "The best plans start with a brave start, then survive by consistency and honest effort.",
    "Kindness is a language every heart understands, even when words fall short.",
    "Focus is the secret rhythm of progress, keeping the day steady when the world feels loud.",
    "True confidence is gentle, not loud, and it lets others shine without shrinking you.",
    "Romance is built from ordinary moments, repeated with care until they become a home.",
    "A good idea needs a better habit, because inspiration is only the spark, not the engine.",
    "Trust turns distance into closeness, and time into a quiet promise.",
    "The future belongs to those who show up, especially on the days they do not feel like it.",
    "Soft words can carry strong feelings, and gentle honesty can hold a relationship together.",
    "Growth happens where comfort ends, but it lasts when you learn to love the climb.",
    "Love is a daily choice, not a sudden spark, and it survives in the small decisions.",
    "Joy multiplies when it is shared, and it becomes strength when it is remembered.",
    "Be steady when the world is noisy, because calm is a powerful kind of courage.",
    "A thoughtful pause can save a long regret, and a kind reply can change a whole day.",
    "Friendship is the family you choose, and loyalty is the language it speaks.",
    "Simplicity is the art of clarity, and clarity is the doorway to peace.",
    "A curious mind stays young, because it keeps asking better questions.",
    "Great work is patience in motion, and patience is faith in the process.",
    "Honesty is the foundation of every bond, and respect is the structure that holds it.",
    "Stay close to people who make you better, and be that person for someone else.",
    "Hope is a quiet kind of courage, whispering that tomorrow can be kinder than today.",
    "Real love listens before it speaks, and forgives before it forgets.",
    "The heart remembers what the mind forgets, especially the way someone made you feel.",
    "Consistency beats intensity over time, especially when no one is applauding.",
    "The right timing meets the right effort, and together they build the right result.",
    "Respect makes every relationship safer, and safety makes every love stronger.",
    "Dreams need discipline to become real, and discipline needs a reason to stay alive.",
    "Love is not perfect, it is present, and presence is the most beautiful gift.",
    "A good day starts with a clear intention and ends with honest gratitude.",
    "Laughter is the shortest bridge between souls, and it keeps distance from growing.",
    "Your pace is still progress, and progress is still something to be proud of.",
    "Gratitude keeps the heart warm, even when the season feels cold.",
    "The best team is built on trust, and trust is built one promise at a time.",
    "Silence can be a powerful answer, especially when words would do harm.",
    "Affection is attention in small doses, repeated until it becomes security.",
    "Strong relationships are built on gentle honesty, not harsh perfection.",
    "Every ending teaches a better beginning, and every lesson becomes a lantern.",
    "Love thrives in honesty, not perfection, and grows in the room between two truths.",
    "A balanced life is a brave decision, because it refuses to worship extremes.",
    "Courage is a habit you practice, not a moment you wait for.",
    "Care is love with time attached, and time is love made visible.",
    "Shall I compare thee to a summer's day? Thou art more lovely and more temperate.",
    "Two roads diverged in a yellow wood, and I took the one less traveled by.",
    "Hope is the thing with feathers that perches in the soul and sings without words.",
    "It was the best of times, it was the worst of times, yet still we choose how to live.",
    "Let me not to the marriage of true minds admit impediment; love is not love which alters."
];

export const quotesID = [
    "Langkah kecil tetap membawa mimpi maju, apalagi jika dilakukan setiap hari tanpa menyerah.",
    "Cinta tumbuh di tempat yang sabar, dan bertahan karena dua hati mau belajar.",
    "Pikiran tenang menangkap kemenangan sunyi, kemenangan yang tidak butuh sorak.",
    "Rencana terbaik dimulai dari keberanian kecil, lalu dijaga oleh konsistensi.",
    "Kebaikan adalah bahasa yang dipahami hati, bahkan saat lidah tak sanggup bicara.",
    "Fokus adalah irama rahasia dari kemajuan, menjaga langkah tetap lurus di tengah ribut.",
    "Kepercayaan diri yang sehat itu lembut, tidak perlu membesar untuk terlihat kuat.",
    "Romansa dibangun dari momen biasa, lalu dirawat dengan perhatian yang sederhana.",
    "Ide bagus butuh kebiasaan yang tepat, karena yang hebat lahir dari pengulangan.",
    "Kepercayaan mengubah jarak jadi dekat, dan waktu jadi bukti.",
    "Masa depan milik mereka yang hadir, terutama di hari-hari paling sulit.",
    "Kata lembut bisa membawa rasa kuat, dan kejujuran yang halus menguatkan.",
    "Bertumbuh terjadi saat nyaman ditinggal, namun indah saat tujuan tetap diingat.",
    "Cinta adalah pilihan harian, bukan kebetulan, dan ia bertahan karena niat.",
    "Bahagia bertambah saat dibagikan, dan semakin kuat ketika disyukuri.",
    "Tetap tenang saat dunia berisik, karena ketenangan adalah keberanian.",
    "Jeda bijak mencegah penyesalan panjang, dan sabar adalah sahabat keputusan.",
    "Persahabatan adalah keluarga yang dipilih, dan kesetiaan adalah jembatannya.",
    "Sederhana adalah seni yang jelas, dan jelas membuat hati lebih damai.",
    "Rasa ingin tahu menjaga jiwa muda, karena ia terus bertanya dan belajar.",
    "Kerja hebat adalah sabar yang bergerak, bukan buru-buru yang melelahkan.",
    "Kejujuran adalah pondasi semua hubungan, dan rasa hormat adalah atapnya.",
    "Dekatlah dengan orang yang membuatmu lebih baik, dan jadilah orang itu juga.",
    "Harapan adalah keberanian yang hening, menuntun langkah saat jalan gelap.",
    "Cinta sejati mendengar sebelum bicara, dan memeluk sebelum menghakimi.",
    "Hati mengingat yang pikiran lupakan, terutama tentang bagaimana ia disayangi.",
    "Konsisten mengalahkan intensitas sesaat, karena perjalanan panjang butuh napas.",
    "Waktu yang tepat bertemu usaha yang tepat, lalu hasil baik mengikuti.",
    "Rasa hormat membuat hubungan lebih aman, dan aman membuat cinta lebih kuat.",
    "Mimpi butuh disiplin agar nyata, dan disiplin butuh alasan untuk bertahan.",
    "Cinta bukan sempurna, tapi hadir, dan kehadiran adalah hadiah yang tulus.",
    "Hari baik dimulai dari niat jernih, lalu diakhiri dengan syukur yang ringan.",
    "Tawa adalah jembatan terpendek antar jiwa, menghubungkan tanpa syarat.",
    "Laju pelan tetap disebut maju, selama langkahmu tidak berhenti.",
    "Syukur menjaga hati tetap hangat, meski musim terasa dingin.",
    "Tim terbaik dibangun dari kepercayaan, dan kepercayaan dibangun dari janji.",
    "Diam bisa jadi jawaban paling kuat, terutama saat emosi ingin menang.",
    "Kasih sayang adalah perhatian yang kecil, namun terus diulang setiap hari.",
    "Hubungan kuat lahir dari jujur yang lembut, bukan dari benar yang keras.",
    "Setiap akhir mengajar awal yang lebih baik, dan setiap luka menjadi pelajaran.",
    "Cinta sehat tumbuh dari kejujuran, bukan dari kepura-puraan yang manis.",
    "Hidup seimbang adalah keputusan berani, menolak hidup yang tergesa.",
    "Keberanian adalah kebiasaan yang dilatih, bukan menunggu momen yang pas.",
    "Peduli adalah cinta yang diberi waktu, dan waktu adalah bukti kasih.",
    "Pulau pandan jauh ke tengah, gunung Daik bercabang tiga, hancur badan dikandung tanah, budi baik dikenang juga.",
    "Pisang emas dibawa berlayar, masak sebiji di atas peti, hutang emas dapat dibayar, hutang budi dibawa mati.",
    "Kalau ada sumur di ladang, boleh kita menumpang mandi, kalau ada umur yang panjang, boleh kita berjumpa lagi.",
    "Bunga melati di tepi kali, harum semerbak menyejukkan hati, janji tulus tak akan lari, ia tinggal di dada selamanya.",
    "Aku ingin hidup seribu tahun lagi, karena rindu dan mimpi belum selesai."
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

export function generateQuote(language: "EN" | "ID", seed?: string): string {
    const list = language === "EN" ? quotesEN : quotesID;
    const random = createRandom(seed);
    return list[Math.floor(random() * list.length)];
}
