const punctuations = [".", ",", "?", "!", ";", ":", '"', "-", "(", ")"];

export const wordsEN = [
    "about", "above", "across", "act", "active", "activity", "add", "afraid", "after", "again", "age", "ago", "agree", "air", "all", "alone", "along", "already", "always", "am", "amount", "an", "and", "angry", "another", "answer", "any", "anyone", "anything", "anytime", "appear", "apple", "are", "area", "arm", "army", "around", "arrive", "art", "as", "ask", "at", "attack", "aunt", "autumn", "away", "baby", "back", "bad", "bag", "ball", "bank", "base", "basket", "bath", "be", "bear", "beautiful", "because", "become", "bed", "bedroom", "beer", "before", "begin", "behind", "bell", "below", "beside", "best", "better", "between", "big", "bird", "birth", "birthday", "bit", "bite", "black", "bleed", "block", "blood", "blow", "blue", "board", "boat", "body", "boil", "bone", "book", "border", "born", "borrow", "both", "bottle", "bottom", "bowl", "box", "boy", "branch", "brave", "bread", "break", "breakfast", "breathe", "bridge", "bright", "bring", "brother", "brown", "brush", "build", "burn", "business", "bus", "busy", "but", "buy", "by", "call", "camp", "can", "cap", "car", "card", "care", "carry", "case", "cat", "catch", "cause", "center", "certain", "chair", "chance", "change", "character", "charge", "cheap", "cheese", "chicken", "child", "children", "choose", "church", "circle", "city", "class", "clean", "clear", "clock", "close", "cloth", "cloud", "coast", "coat", "coin", "cold", "color", "column", "come", "comfortable", "common", "compare", "complete", "computer", "condition", "continue", "control", "cook", "cool", "copper", "corn", "corner", "correct", "cost", "cotton", "could", "course", "cover", "cow", "create", "crime", "cross", "cry", "cup", "cut", "dance", "danger", "dark", "daughter", "day", "dead", "deal", "dear", "death", "decide", "deep", "deer", "degree", "depend", "depth", "describe", "design", "desk", "destroy", "detail", "develop", "dictionary", "die", "difference", "different", "difficult", "dinner", "direction", "dirty", "discover", "discuss", "disease", "dish", "distance", "divide", "do", "doctor", "dog", "door", "double", "down", "draw", "dream", "dress", "drink", "drive", "drop", "dry", "duck", "dust", "duty", "each", "ear", "early", "earn", "earth", "east", "easy", "eat", "edge", "education", "effect", "egg", "eight", "either", "electric", "elephant", "else", "empty", "end", "enemy", "enjoy", "enough", "enter", "equal", "entrance", "escape", "even", "evening", "event", "ever", "every", "everyone", "exact", "everybody", "examination", "example", "except", "excited", "exercise", "expect", "expensive", "explain", "extremely", "eye", "face", "fact", "fail", "fall", "false", "family", "famous", "far", "farm", "father", "fault", "fear", "feed", "feel", "female", "fever", "few", "fight", "fill", "film", "find", "fine", "finger", "finish", "fire", "first", "fish", "fit", "five", "fix", "flag", "flat", "float", "floor", "flour", "flower", "fly", "fold", "food", "fool", "foot", "for", "force", "forest", "forget", "forgive", "fork", "form", "fox", "four", "free", "freedom", "freeze", "fresh", "friend", "friendly", "from", "front", "fruit", "full", "fun", "funny", "furniture", "further", "future", "game", "garden", "gate", "general", "gentleman", "get", "gift", "give", "glad", "glass", "go", "goat", "god", "gold", "good", "goodbye", "grandfather", "grandmother", "grass", "great", "green", "grey", "ground", "group", "grow", "gun", "hair", "half", "hall", "hammer", "hand", "happen", "happy", "hard", "hat", "hate", "have", "he", "head", "healthy", "hear", "heavy", "heart", "heaven", "height", "hello", "help", "hen", "her", "here", "hers", "hide", "high", "hill", "him", "his", "hit", "hobby", "hold", "hole", "holiday", "home", "hope", "horse", "hospital", "hot", "hotel", "hour", "house", "how", "hundred", "hungry", "hurry", "husband", "hurt", "I", "ice", "idea", "if", "important", "in", "increase", "inside", "into", "introduce", "invent", "iron", "invite", "is", "island", "it", "its", "jelly", "job", "join", "juice", "jump", "just", "keep", "key", "kill", "kind", "king", "kitchen", "knee", "knife", "knock", "know", "ladder", "lady", "lamp", "land", "large", "last", "late", "lately", "laugh", "lazy", "lead", "leaf", "learn", "leave", "leg", "left", "lend", "length", "less", "lesson", "let", "letter", "library", "lie", "life", "light", "like", "lion", "lip", "list", "listen", "little", "live", "lock", "lonely", "long", "look", "lose", "lot", "love", "low", "lower", "luck", "machine", "main", "make", "male", "man", "many", "map", "mark", "market", "marry", "matter", "may", "me", "meal", "mean", "measure", "meat", "medicine", "meet", "member", "mention", "method", "middle", "milk", "million", "mind", "minute", "miss", "mistake", "mix", "model", "modern", "moment", "money", "monkey", "month", "moon", "more", "morning", "most", "mother", "mountain", "mouth", "move", "much", "music", "must", "my", "name", "nation", "nature", "near", "nearly", "neck", "need", "needle", "nerve", "net", "never", "new", "news", "next", "nice", "night", "nine", "no", "noble", "noise", "none", "nor", "north", "nose", "not", "nothing", "notice", "now", "number", "obey", "object", "ocean", "of", "off", "offer", "office", "often", "oil", "old", "on", "one", "only", "open", "opposite", "or", "orange", "order", "other", "our", "out", "outside", "over", "own", "page", "pain", "paint", "pair", "pan", "paper", "parent", "park", "part", "partner", "party", "pass", "past", "path", "pay", "peace", "pen", "pencil", "people", "pepper", "per", "perfect", "period", "person", "pet", "picture", "piece", "pig", "pin", "pink", "place", "plane", "plant", "plastic", "plate", "play", "please", "plenty", "pocket", "point", "poison", "police", "polite", "pool", "poor", "popular", "position", "possible", "potato", "pour", "power", "present", "press", "pretty", "prevent", "price", "prince", "prison", "private", "prize", "probably", "problem", "produce", "promise", "proper", "protect", "provide", "public", "pull", "punish", "pupil", "push", "put", "queen", "question", "quick", "quiet", "quite", "radio", "rain", "rainy", "raise", "reach", "read", "ready", "real", "really", "receive", "record", "red", "remember", "remind", "remove", "rent", "repair", "reply", "report", "rest", "restaurant", "result", "return", "rice", "rich", "ride", "right", "ring", "rise", "road", "rob", "rock", "room", "round", "rubber", "rude", "rule", "ruler", "run", "rush", "sad", "safe", "sail", "salt", "same", "sand", "save", "say", "school", "science", "scissors", "search", "seat", "second", "see", "seem", "sell", "send", "sentence", "serve", "seven", "several", "sex", "shade", "shadow", "shake", "shape", "share", "sharp", "she", "sheep", "sheet", "shelf", "shine", "ship", "shirt", "shoe", "shoot", "shop", "short", "should", "shoulder", "shout", "show", "sick", "side", "signal", "silence", "silly", "silver", "similar", "simple", "single", "sing", "sink", "sister", "sit", "six", "size", "skill", "skin", "skirt", "sky", "sleep", "slip", "slow", "small", "smell", "smile", "smoke", "snow", "so", "soap", "sock", "soft", "some", "someone", "something", "sometimes", "son", "soon", "sorry", "sound", "soup", "south", "space", "speak", "special", "speed", "spell", "spend", "spoon", "sport", "spread", "spring", "square", "stamp", "stand", "star", "start", "station", "stay", "steal", "steam", "step", "still", "stomach", "stone", "stop", "store", "storm", "story", "strange", "street", "strong", "structure", "student", "study", "stupid", "subject", "substance", "successful", "such", "sudden", "sugar", "suitable", "summer", "sun", "sunny", "support", "sure", "surprise", "sweet", "swim", "sword", "table", "take", "talk", "tall", "taste", "taxi", "tea", "teach", "team", "tear", "telephone", "television", "tell", "ten", "tennis", "terrible", "test", "than", "that", "the", "their", "then", "there", "therefore", "these", "thick", "thin", "thing", "think", "third", "this", "though", "threat", "three", "tidy", "tie", "title", "to", "today", "toe", "together", "tomorrow", "tonight", "too", "tool", "tooth", "top", "total", "touch", "town", "train", "tram", "travel", "tree", "trouble", "true", "trust", "twice", "try", "turn", "type", "ugly", "uncle", "under", "understand", "unit", "until", "up", "use", "useful", "usual", "usually", "valley", "value", "various", "very", "victim", "victory", "video", "view", "village", "voice", "vote", "wait", "wake", "walk", "wall", "want", "war", "warm", "wash", "waste", "watch", "water", "wave", "way", "we", "weak", "wear", "weather", "wedding", "week", "weight", "welcome", "well", "west", "wet", "what", "wheel", "when", "where", "which", "while", "white", "who", "why", "wide", "wife", "wild", "will", "win", "wind", "window", "wine", "winter", "wire", "wise", "wish", "with", "without", "woman", "wonder", "word", "work", "world", "worry", "worst", "write", "wrong", "year", "yes", "yesterday", "yet", "you", "young", "your", "zero", "zoo"
];

export const wordsID = [
    "abadi", "abai", "abdi", "abu", "acara", "ada", "adalah", "adang", "adat", "adik", "adil", "administrasi", "adu", "aduk", "agak", "agama", "agar", "agen", "agung", "ahad", "ahli", "air", "ajaib", "ajak", "ajar", "akan", "akar", "akhir", "akibat", "aku", "akun", "akurat", "alam", "alang", "alas", "alat", "alih", "alir", "alis", "alkohol", "alpa", "alur", "ama", "aman", "amat", "ambang", "ambil", "amin", "ampun", "anak", "analisis", "ancam", "anda", "andai", "aneh", "angan", "anggap", "angka", "angkasa", "angkat", "angkut", "angsa", "anjing", "anjur", "antar", "antara", "anti", "antre", "apa", "api", "aplikasi", "apotek", "arah", "arang", "arti", "arung", "arus", "asa", "asam", "asap", "asar", "asas", "asli", "aso", "aspal", "asri", "astaga", "asuh", "atap", "atas", "atau", "awas", "awet", "ayah", "ayam", "ayo", "ayun", "baca", "badai", "badan", "bagaimana", "bagi", "bagus", "bahagia", "bahan", "bahari", "bahasa", "bahaya", "bahu", "baik", "baja", "bakal", "bakar", "bakat", "bakau", "bakteri", "baku", "balas", "balik", "balok", "balut", "bambu", "ban", "bandar", "banding", "bangkit", "bangsa", "bangun", "bank", "bantu", "banyak", "bapak", "barang", "barat", "baring", "baris", "baru", "basa", "basah", "basi", "batal", "batas", "batu", "bau", "bawa", "bawah", "bawang", "bayang", "bayar", "bayi", "bebas", "bebek", "beda", "bedah", "begitu", "bekas", "bekerja", "beku", "bela", "belah", "belakang", "belalang", "belas", "beli", "beliau", "belum", "benang", "benar", "bencana", "benci", "benda", "bengkel", "benih", "bening", "berani", "berarti", "beras", "berat", "berbagai", "berbeda", "berhenti", "beri", "berita", "berjalan", "bermain", "bersama", "bersih", "besar", "besi", "besok", "bestari", "betul", "biar", "biasa", "biaya", "bibir", "bicara", "bidadari", "bidang", "bijak", "bikin", "bila", "bilang", "bimbang", "binatang", "bintang", "bisa", "bising", "bisnis", "bisu", "biologi", "biru", "bocor", "bodoh", "bohong", "bola", "boleh", "bom", "boneka", "boring", "borong", "bosan", "botol", "buah", "buang", "buat", "budaya", "budi", "buka", "bukan", "bukit", "bukti", "buku", "bulan", "bulat", "bulu", "bumbu", "bumi", "bundar", "bunga", "bunuh", "bunyi", "buruk", "burung", "bus", "busana", "buta", "butuh", "cabang", "cabut", "cacat", "cacing", "cadang", "cahaya", "cair", "cakap", "cakar", "campur", "canda", "canggih", "cantik", "capai", "cara", "cari", "catat", "catur", "cegah", "cek", "celaka", "celana", "cemas", "cemburu", "cenderung", "cepat", "cerdas", "cerah", "cerita", "cermin", "cerna", "cetak", "cipta", "ciri", "cita", "cium", "coba", "cocok", "codot", "cokelat", "contoh", "corak", "cuaca", "cuci", "cucu", "cukup", "cuma", "curi", "cuti", "dada", "daerah", "daftar", "daging", "dagu", "dahulu", "dalam", "damai", "dan", "dana", "danau", "dapat", "dapur", "darah", "darat", "dari", "dasar", "data", "datang", "datar", "daun", "daya", "debat", "debu", "deg", "dekat", "delapan", "demam", "demi", "demikian", "denda", "dengan", "dengar", "denyut", "depan", "deras", "derita", "desa", "desain", "detail", "detik", "dewasa", "di", "dia", "diam", "didik", "diet", "digital", "dinding", "dingin", "diri", "disiplin", "diskon", "doa", "doang", "dokter", "dokumen", "dolar", "domba", "dompet", "dorong", "dosa", "dosen", "dua", "duduk", "duga", "duka", "dukung", "dulu", "dunia", "dusta", "duta", "duyung", "eboni", "edisi", "edukasi", "efek", "ego", "ekonomi", "ekor", "eksperimen", "ekspor", "elak", "elang", "emas", "empat", "empuk", "enak", "enam", "energi", "enggak", "entah", "epidemi", "era", "erat", "es", "esok", "evaluasi", "event", "evolusi", "faham", "fajar", "fakta", "faktor", "famili", "fanatik", "fardhu", "fase", "fasih", "fasilitas", "fatal", "fikir", "film", "filosofi", "final", "fisik", "fokus", "formal", "format", "foto", "frekuensi", "fungsi", "gabung", "gadis", "gado", "gagal", "gagasan", "gajah", "gaji", "galaksi", "gali", "gambar", "gampang", "ganas", "ganda", "gandum", "ganggu", "ganjil", "ganteng", "ganti", "gantung", "garam", "garis", "gas", "gatal", "gaul", "gaun", "gawang", "gaya", "gegar", "gejala", "gelap", "gelar", "gelas", "gelembung", "geli", "gelombang", "gemar", "gembira", "gempa", "gemuk", "genap", "genggam", "genit", "genting", "gerak", "gerbang", "gereja", "gigi", "gigit", "gila", "global", "godaan", "gores", "gosong", "goyang", "gua", "gugur", "gula", "gulai", "guna", "gunting", "gunung", "guru", "habis", "hadap", "hadiah", "hadir", "hafal", "hal", "halaman", "halang", "halus", "hama", "hamba", "hampir", "hancur", "hangat", "hanya", "hapus", "harap", "harga", "hari", "harta", "harum", "harus", "hasil", "hati", "haus", "hebat", "helm", "henti", "heran", "hewan", "hias", "hibur", "hidung", "hidup", "hijau", "hilang", "hina", "hindar", "hingga", "hitam", "hitung", "hiburan", "hormat", "hubung", "hujan", "hukum", "hulu", "hutan", "hutang", "ia", "ibu", "ide", "ijin", "ikan", "ikat", "iklan", "iklim", "ikut", "ilmu", "imam", "iman", "imbang", "indah", "indeks", "indra", "industri", "infeksi", "info", "informasi", "ingat", "ingin", "ini", "injak", "inti", "intip", "ipar", "irama", "iri", "iris", "isap", "isi", "islam", "istana", "istilah", "istri", "istirahat", "itu", "izin", "jabat", "jadwal", "jaga", "jagat", "jago", "jahat", "jahit", "jajak", "jajan", "jalan", "jalur", "jam", "jaman", "jamin", "jamur", "janda", "jangan", "jangka", "janji", "jantan", "jarak", "jari", "jaring", "jarum", "jasa", "jati", "jatuh", "jauh", "jawab", "jelas", "jelek", "jelita", "jemput", "jendela", "jenderal", "jengkel", "jenis", "jepit", "jeruk", "jiwa", "jodoh", "jual", "juang", "judi", "judul", "juga", "jujur", "juluk", "jumat", "jumlah", "jumpa", "jurnal", "jurus", "justru", "kabar", "kabel", "kabupaten", "kaca", "kacamata", "kacang", "kacau", "kadang", "kadar", "kader", "kaget", "kain", "kaji", "kakak", "kakek", "kaki", "kalah", "kalau", "kaldu", "kali", "kalian", "kamera", "kami", "kampanye", "kampung", "kampus", "kamu", "kanan", "kandang", "kandung", "kangen", "kantong", "kantor", "kaos", "kapal", "kapan", "kapital", "karakter", "karang", "karena", "karet", "karir", "karya", "karyawan", "kasar", "kasih", "kasur", "kata", "katak", "kawan", "kawasan", "kawat", "kawin", "kaya", "kayu", "ke", "keadaan", "kebakaran", "kebiasaan", "kecelakaan", "kecil", "kecuali", "kedua", "kejam", "kejar", "kejut", "kekal", "kelas", "keluarga", "keluar", "keliling", "kelompok", "kembali", "kemarin", "kembang", "kembar", "kemeja", "kucing", "kuda", "kue", "kulit", "kurang", "kursi", "lagi", "lahir", "lain", "laki", "laku", "lalu", "lama", "lambat", "lampu", "langit", "langsung", "lanjut", "lantai", "lapangan", "lapar", "lari", "laut", "layar", "lebih", "leher", "lelah", "lemah", "lemak", "lepas", "lewat", "libur", "lihat", "lima", "lokal", "luar", "luas", "luka", "lupa", "lurus", "maaf", "macam", "madu", "mahal", "main", "maju", "makan", "maksud", "malam", "malas", "malu", "mampu", "mana", "mandi", "manis", "manusia", "marah", "mari", "masa", "masak", "masalah", "masih", "masuk", "mata", "mati", "mau", "mawar", "mayat", "mega", "meja", "melalui", "melihat", "memang", "membaca", "membantu", "membuat", "meminta", "memilih", "menang", "menarik", "mencari", "mendapat", "mengapa", "mengerti", "menjadi", "menulis", "menurut", "menyanyi", "merah", "meraka", "mereka", "mesin", "mesti", "milik", "mimpi", "minum", "minyak", "misal", "miskin", "modal", "modern", "moga", "mohon", "momen", "motor", "muda", "mudah", "muka", "mulai", "mulut", "mungkin", "murah", "murid", "musim", "musik", "musuh", "nafas", "naga", "naik", "nama", "namun", "nanti", "napas", "nari", "nasi", "nasib", "nasional", "negara", "nenek", "neraka", "ngeri", "niat", "nilai", "nol", "nomor", "normal", "nyala", "nyaman", "nyanyi", "nyata", "obat", "objek", "olah", "olahraga", "oleh", "omong", "operasi", "opini", "optimis", "orang", "otak", "otot", "pabrik", "pacar", "padi", "pagi", "paha", "paham", "pajak", "pakai", "pakaian", "paksa", "paku", "paling", "palsu", "paman", "pamer", "panah", "panas", "panci", "pandang", "panen", "panggil", "panjang", "pantai", "pantas", "parah", "paras", "paru", "pasar", "pasir", "pasti", "pasukan", "patah", "patung", "payung", "pecah", "pedas", "peduli", "pegang", "pegunungan", "pelajar", "peluang", "pemain", "pemerintah", "pemilu", "pemuda", "penasaran", "pendek", "pengalaman", "pengaruh", "pening", "penjara", "penting", "penuh", "penyakit", "perahu", "perang", "perasaan", "percaya", "perempuan", "pergi", "perhatian", "periksa", "perintah", "perjalanan", "perlu", "pernah", "persen", "pertama", "perut", "pesan", "pesawat", "pesta", "petani", "petir", "pikir", "pilih", "pintu", "pipa", "pipi", "pisah", "pisau", "pohon", "polisi", "politik", "pria", "pribadi", "program", "proses", "publik", "pucat", "pukul", "pulang", "pulau", "puluh", "puncak", "punya", "pusat", "putih", "putra", "putri", "putus", "raba", "racun", "radio", "ragu", "rahasia", "raja", "rajin", "rakyat", "ramai", "rambut", "ranjang", "rapat", "rasa", "rata", "ratu", "ratus", "raya", "reaksi", "realitas", "rencana", "rendah", "resmi", "ribu", "ringan", "rokok", "roda", "romantis", "rotan", "roti", "ruang", "rugi", "rumah", "rumput", "rupa", "rusak", "saat", "sabar", "sadar", "saham", "sahabat", "sakit", "salah", "salam", "salju", "sama", "sambil", "sampah", "sampai", "sana", "sandal", "sangat", "sanggup", "santai", "sapa", "sapi", "saraf", "saran", "sarapan", "saudara", "sawah", "sebab", "sebagai", "sebelum", "sebentar", "sebuah", "sedang", "sedap", "sedih", "sedikit", "segera", "sehat", "sehingga", "sejak", "sejarah", "sekali", "sekarang", "sekitar", "sekolah", "selalu", "selama", "selamat", "selatan", "selesai", "seluruh", "semangat", "semacam", "semasa", "sempurna", "semua", "sendiri", "senang", "senjata", "sensus", "senyum", "sepak", "seperti", "sepi", "sepeda", "seram", "serentak", "sering", "serius", "serta", "server", "sesal", "sesuai", "sesuatu", "setan", "setelah", "setiap", "setuju", "sewa", "siang", "siap", "siapa", "sibuk", "sifat", "signifikan", "sikap", "siksa", "silakan", "simpan", "sinar", "singa", "singkat", "sini", "sisa", "sistem", "siswa", "situ", "situasi", "soal", "solid", "sombong", "sopan", "sore", "sosial", "suami", "suap", "suara", "suasana", "suatu", "subuh", "sudah", "sudut", "suhu", "suka", "sukses", "sulit", "sumber", "sumpah", "sunyi", "supaya", "suram", "surat", "surga", "susah", "susu", "syarat", "syukur", "tabel", "tabung", "tahan", "tahu", "tahun", "taja", "tajam", "tak", "tali", "tambah", "tampak", "tamu", "tanah", "tanam", "tanda", "tangan", "tangga", "tanggung", "tangis", "tanpa", "tanya", "tapi", "tari", "tarif", "tarik", "tas", "tata", "tatap", "tawa", "tawar", "tayang", "tebal", "teduh", "tegas", "teguh", "teh", "teknik", "teknologi", "teks", "telan", "telinga", "telur", "teman", "tempat", "temu", "tenaga", "tenang", "tengah", "tengok", "tentang", "tentara", "tentu", "tepat", "tepi", "terang", "terbang", "terhadap", "teriak", "terima", "terjadi", "terlalu", "termos", "terus", "tetap", "tetapi", "tewas", "tiang", "tiba", "tidak", "tidur", "tiga", "tikus", "timbang", "timbul", "timur", "tindak", "tinggal", "tinggi", "tinju", "tinta", "tipis", "tiup", "toko", "tokoh", "tolak", "tolong", "tombak", "tong", "topi", "total", "tradisi", "tua", "tuan", "tubuh", "tugas", "tuhan", "tujuan", "tulis", "tumbuh", "tunggu", "tunggal", "tunjuk", "turun", "turut", "tutup", "uang", "ubah", "udara", "ujian", "ujung", "ukur", "ular", "ulit", "umum", "umur", "undang", "unggul", "ungu", "unik", "unit", "unsur", "unta", "untuk", "untung", "upaya", "urus", "usaha", "usia", "usul", "utama", "utara", "utuh", "vaksin", "valid", "vampir", "variasi", "video", "villa", "virus", "visi", "visual", "vodka", "voli", "volume", "vonis", "vulgar", "wabah", "wajah", "wajib", "waktu", "walau", "walikota", "wanita", "warga", "warna", "warung", "waspada", "watak", "wawancara", "wilayah", "wujud", "yakin", "yakni", "yang", "yatim", "yodium", "yuyu", "zaman", "zona"
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

    "The best of people are those who benefit others.",
    "Speak good or remain silent.",
    "Patience is the companion of wisdom.",
    "Every soul will taste death.",
    "Trust in God, but tie your camel.",
    "He who knows himself knows his Lord.",
    "The wound is the place where light enters you.",
    "Out beyond ideas of wrongdoing, there is a field. I will meet you there.",
    "I have lived on the lip of insanity, wanting to know reasons.",
    "Let the beauty of what you love be what you do.",

    "What is broken can be reforged.",
    "Rise. Again. Until lambs become lions.",
    "The oak fought the wind and broke. The reed bent and survived.",
    "Not how hard you hit, but how hard you can get hit and keep moving.",
    "Fall seven times, stand up eight.",
    "Smooth seas do not make skillful sailors.",
    "The comeback is always stronger than the setback.",
    "Stars can't shine without darkness.",
    "You are stronger than you think.",
    "Turn your wounds into wisdom.",
    "It does not matter how slowly you go, as long as you do not stop.",
    "When nothing goes right, go left.",
    "Endurance is one of the most difficult disciplines, but it is to the one who endures that the final victory comes.",

    "Where there is love, there is life.",
    "To be loved but not known is comforting. To be known and not loved is terrifying. To be known and loved is everything.",
    "Love all, trust a few, do wrong to none.",
    "We accept the love we think we deserve.",
    "Love recognizes no barriers.",
    "The best thing to hold onto in life is each other.",
    "A life lived in love will never be dull.",
    "To love and be loved is to feel the sun from both sides.",
    "Connection is why we're here; it is what gives purpose and meaning to our lives.",
    "Empathy is seeing with the eyes of another, listening with the ears of another, and feeling with the heart of another.",
    "Have enough courage to trust love one more time and always one more time.",
    "Love is not love which alters when it alteration finds.",


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

    "Verily, with hardship comes ease. Do not despair when the road narrows, for the opening always follows the struggle.",
    "The heart that breaks open can contain the whole universe. It is not weakness to grieve — it is proof you loved fully.",
    "Do not lose hope, nor be sad. You will surely be victorious if you are true in faith and patient in trial.",
    "I want to sing like the birds sing, not worrying about who hears or what they think. That is the Sufi way.",
    "Your task is not to seek for love, but merely to seek and find all the barriers within yourself that you have built against it.",
    "Sell your cleverness and buy bewilderment. Cleverness is mere opinion, bewilderment is intuition — and intuition touches God.",
    "The wound you carry is not a flaw. It is the opening through which grace was always trying to reach you, if you would only stop running.",
    "What God intended for you goes far beyond anything you can imagine. Stop limiting the divine by the smallness of your expectations.",
    "She is a wildfire. She burns not to destroy but to make way for what is new, what is real, what can finally grow.",
    "Romance is not about grand gestures in a single moment, but about showing up imperfectly and consistently every single day.",

    "The world breaks everyone, and afterward, many are strong at the broken places. Let yours heal into something unbreakable.",
    "You may have to fight a battle more than once to win it. Persistence is not a single act, but a habit of the soul.",
    "The human spirit is to fly, even when the wings are bruised. It is not about never falling, but about rising with feathers ruffled but intact.",
    "Courage is not having the strength to go on; it is going on when you don't have the strength. You find it in the next step.",
    "Rock bottom became the solid foundation on which I rebuilt my life. Sometimes you must hit bottom to find a new footing.",
    "Do not judge me by my success, judge me by how many times I fell down and got back up again. That is the true measure of a life.",
    "You never know how strong you are until being strong is the only choice you have. That is when the miracle happens.",
    "There is no passion to be found playing small—in settling for a life that is less than the one you are capable of living. Especially after hardship.",

    "Love is composed of a single soul inhabiting two bodies. It is the recognition that your story and my story are, in the end, the same story, told in different voices.",
    "The meeting of two personalities is like the contact of two chemical substances: if there is any reaction, both are transformed. Love is the catalyst for becoming who you were meant to be.",
    "There is no remedy for love but to love more. It is the only fire that doesn't consume, but rather purifies, leaving you with a heart that is larger than it was before.",
    "The most important thing in life is to learn how to give out love, and to let it come in. We must be porous, not just strong. To let the world in is an act of profound courage.",
    "A great relationship doesn't happen because of the love you found. It happens because of the work you put in. It's not about finding the perfect person, but about seeing an imperfect person perfectly.",
    "Love is not about how much you say 'I love you,' but how much you can prove that it's true. It lives in the small, unglamorous, consistent acts of showing up for someone when it would be easier not to.",
    "We need to make books and films and songs that show people how to be vulnerable and kind, how to love in a way that is not possessive, how to be alone without being lonely.",
    "The most basic and powerful way to connect to another person is to listen. Just listen. Perhaps the most important thing we ever give each other is our attention.",

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

    "Verily, God does not change the condition of a people until they change what is in themselves. The transformation you seek begins not outside but in the quiet decisions no one else sees you make.",
    "The most beautiful thing we can experience is the mysterious. It is the source of all true art, all true science, and all true love — to know that what is impenetrable to us really exists.",
    "I looked in temples, churches, and mosques, but I found the divine within my own heart. The search that exhausted me for decades ended the moment I stopped looking outward and went still.",
    "You were born with wings. Why prefer to crawl through life? The cage you live inside is woven from the fears you inherited, not the truth of who you are or what you were made to become.",
    "To fall in love is easy, even to remain in it is not difficult; our human loneliness is cause enough. But it is a hard quest worth making to find a comrade through whose steady presence one becomes steadily the person one desires to be.",

    "Life will not always be easy, but you are not here to break. You are here to bend in the storm, to absorb the shock, and to stand tall when the skies clear, knowing that the roots you've grown in the dark hold you firm.",
    "Let me tell you this: if you meet a loner, no matter what they tell you, it's not because they enjoy solitude. It's because they have tried to blend into the world before, and the world continues to reject them. Find your people. Build your own world.",
    "Kintsugi is the Japanese art of repairing broken pottery with gold. The cracks become part of the history and beauty of the object. You, too, are not damaged goods. Your cracks are where the gold of your experience seeps in.",
    "The most authentic thing about us is our capacity to create, to overcome, to endure, to transform, to love, and to be greater than our suffering. That is the summit of the human experience, and it is earned in the valleys.",
    "Nelson Mandela once said, 'The greatest glory in living lies not in never falling, but in rising every time we fall.' He spent 27 years in prison and rose to lead a nation. Your prison may be invisible, but your rising can be just as mighty.",

    "For one human being to love another: that is perhaps the most difficult of all our tasks, the ultimate, the last test and proof, the work for which all other work is but preparation. It is a high inducement to the individual to ripen, to become something in himself, to become a world in himself for the sake of another.",
    "We loved with a love that was more than love—it was the quiet understanding, the final proof that truth is what you stay with, not what you run from. It was the anchor in the drift of days.",
    "The real test of love is not how you feel at the peak of passion, but how you treat each other in the quiet valleys when the excitement fades and all that remains is the decision to keep choosing one another, day after day, year after year.",
    "I am nothing special, just a common man with common thoughts. I've led a common life. There are no monuments dedicated to me. But I have loved another with all my heart and soul, and to me, this has always been enough. That is the most beautiful monument one can build.",
    "Love does not begin and end the way we seem to think it does. Love is a battle, love is a war; love is a growing up. It is a continuous act of creation, a story you write together, word by word, even when you are tired, even when you think you cannot find the next sentence.",
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

    "Sebaik-baik manusia adalah yang paling bermanfaat bagi orang lain.",
    "Bicaralah yang baik atau diam.",
    "Kesabaran adalah kunci segala kebaikan.",
    "Setiap jiwa pasti akan merasakan kematian.",
    "Bertawakal kepada Allah, tapi ikat dulu untamu.",
    "Luka adalah tempat cahaya masuk ke dalam dirimu.",
    "Di luar batas benar dan salah ada sebuah ladang. Aku akan menemuimu di sana.",
    "Biarkan keindahan yang kamu cintai menjadi apa yang kamu lakukan.",
    "Dia yang mengenal dirinya akan mengenal Tuhannya.",
    "Cinta sejati tidak pernah membuatmu merasa kecil.",

    "Yang patah akan tumbuh, yang hilang akan berganti.",
    "Bangun. Lagi. Sampai domba jadi singa.",
    "Ombak yang besar tidak akan pernah menenggelamkan pelaut yang tangguh.",
    "Bukan seberapa keras kau jatuh, tapi seberapa besar kau mau bangkit lagi.",
    "Jatuh tujuh kali, bangkit delapan kali.",
    "Laut yang tenang tidak akan melahirkan pelaut yang handal.",
    "Kemenangan terbesar adalah bangkit kembali setelah dikalahkan.",
    "Bintang tidak akan bersinar tanpa kegelapan.",
    "Kamu lebih kuat dari yang kamu kira.",
    "Jadikan luka sebagai kekuatan.",
    "Pelan-pelan asal selamat, lebih baik daripada terburu-buru lalu jatuh.",
    "Tuhan tidak akan menguji hamba-Nya di luar batas kemampuannya.",
    "Allah bersama orang-orang yang sabar.",

    "Rasakan takutnya, lakukan juga.",
    "Maju selangkah, pintu rezeki akan terbuka.",
    "Keberanian adalah awal dari kemenangan.",
    "Di balik gunung, ada lautan.",
    "Siapa yang berani, dia yang menang.",
    "Orang takut gagal, orang berani belajar.",
    "Jangan takut melangkah, takutlah jika diam.",
    "Keberanian bukan berarti tidak takut, tapi berani bertindak meski takut.",
    "Lakukan saja dulu, sempurnakan sambil jalan.",
    "Siapa berani bertanggung jawab atas mimpinya, dialah pemenang sejati.",
    "Tak kenal maka tak sayang, tak coba maka tak bisa.",
    "Allah tidak membebani seseorang melainkan sesuai kesanggupannya.",

    "Cinta itu indah, jika saling menjaga.",
    "Rumah bukan tempat, tapi perasaan.",
    "Saling memaafkan itu kunci.",
    "Cinta tidak buta, ia melihat dengan hati.",
    "Kasih sayang ibu sepanjang masa.",
    "Bersyukur atas hadiah cinta hari ini.",
    "Kehangatan keluarga tak ternilai.",
    "Ada cinta di setiap doa tulus.",
    "Senja itu indah, apalagi bersamamu.",
    "Cinta sejati tak pernah lelah menanti.",
    "Menerima kekurangan adalah bukti cinta.",
    "Hidup jadi indah karena cinta dan ketulusan.",

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

    "Sesungguhnya bersama kesulitan ada kemudahan. Jangan berputus asa ketika jalan menyempit, karena pembukaan selalu mengikuti perjuangan yang tulus.",
    "Jangan kamu bersedih, sesungguhnya Tuhan bersama kita. Kalimat itu bukan sekadar penghiburan — itu adalah fakta yang meneguhkan setiap langkah.",
    "Tugasmu bukan mencari cinta, melainkan mencari dan menemukan semua penghalang yang telah kamu bangun di dalam dirimu sendiri terhadapnya.",
    "Jual kepintaranmu dan beli rasa takjub. Kepintaran hanyalah opini, tapi rasa takjub adalah intuisi yang menyentuh Yang Maha Besar.",
    "Hati yang hancur terbuka mampu menampung seluruh semesta. Berduka bukan kelemahan — itu adalah bukti bahwa kamu pernah mencintai dengan sungguh.",
    "Luka yang kamu bawa bukan cacat. Itu adalah celah yang melaluinya kasih sayang selalu berusaha menjangkaumu, jika kamu mau berhenti melarikan diri.",
    "Apa yang Tuhan siapkan untukmu melampaui jauh apapun yang bisa kamu bayangkan. Berhentilah membatasi Yang Maha Kuasa dengan sempitnya harapanmu.",
    "Romansa bukan soal isyarat besar dalam satu momen dramatis, tapi tentang hadir secara tidak sempurna namun konsisten setiap harinya tanpa pamrih.",
    "Dia adalah api liar. Dia tidak membakar untuk menghancurkan, tapi untuk memberi jalan bagi yang baru, yang nyata, yang akhirnya bisa tumbuh.",
    "Aku mencari di masjid, gereja, dan kuil, tapi aku menemukan Yang Ilahi di dalam hatiku sendiri. Pencarian itu berakhir saat aku berhenti melihat ke luar.",

    "Dunia ini menghancurkan semua orang, dan setelah itu, banyak yang menjadi kuat di tempat-tempat yang hancur itu. Biarkan luka-lukamu sembuh menjadi sesuatu yang tak terkalahkan.",
    "Kamu mungkin harus memenangkan pertempuran yang sama lebih dari sekali. Ketekunan bukan tindakan sekali jalan, tapi kebiasaan jiwa yang dipupuk setiap hari.",
    "Kekuatan tidak datang dari kemampuan fisik, tapi dari kemauan yang tak terkalahkan. Ia adalah bisikan lembut yang berkata, 'Aku akan mencoba sekali lagi,' saat semuanya terasa mustahil.",
    "Kamu tidak akan tahu seberapa kuat dirimu sampai 'kuat' adalah satu-satunya pilihan yang tersisa. Saat itulah keajaiban terjadi, saat kau memilih untuk bertahan.",
    "Dasar laut yang paling dalam sekalipun, suatu saat akan naik ke permukaan menjadi daratan. Begitu pula dengan kesulitan, ia akan mengantarmu pada kemudahan, jika kau sabar.",
    "Sesungguhnya bersama kesulitan ada kemudahan. Maka ketika engkau telah selesai (dari satu urusan), tetaplah bekerja keras (untuk urusan yang lain). Jangan pernah berhenti.",
    "Luka yang kau bawa bukanlah cacat. Ia adalah celah yang dilalui cahaya untuk masuk, tempat rahmat selalu berusaha menjangkau, jika kau berhenti berlari darinya.",
    "Bukan kesulitan yang membuat kita menyerah, tapi ketidakmampuan kita melihat cahaya di ujung terowongan. Percayalah, terowongan itu selalu punya ujung.",

    "Keberanian bukan ketiadaan rasa takut, tapi merasakan ketakutan itu dan memutuskan bahwa ada hal lain yang lebih penting. Biarkan hal itu adalah masa depanmu yang lebih baik.",
    "Keberanian sejati adalah ketika kau tetap berlutut berdoa di tengah badai, saat semua suara bisikkan kegagalan terdengar paling keras, dan kau tetap percaya bahwa ombak ini akan reda.",
    "Kita membutuhkan lebih banyak pemberani yang memilih jujur pada kata hati, daripada pemenang yang mengkhianati dirinya sendiri. Karena kemenangan sejati adalah keutuhan jiwa.",
    "Bukan kurangnya rasa takut yang membuatmu hebat, tapi keberanian untuk melangkah meski lutut gemetar. Itulah bukti bahwa jiwamu lebih besar dari tubuhmu.",
    "Orang yang pindah gunung memulainya dengan memindahkan batu-batu kecil. Keberanian untuk memulai, sekecil apapun, yang pada akhirnya akan membentuk kembali lanskap kehidupanmu.",
    "Keberanian adalah apa yang diperlukan untuk berdiri dan bicara; keberanian juga apa yang diperlukan untuk duduk dan diam. Kekuatan sejati terletak pada mengetahui kapan saatnya untuk salah satu dari itu.",
    "Jika kau tidak pernah melompat, kau tidak akan pernah tahu apakah sayapmu bisa terbang. Jangan habiskan hidup dengan hanya meraba-raba di pinggir tebing, sementara langit menantimu.",
    "Jangan takut pada kesalahan. Kebijaksanaan lahir dari kesalahan, bukan dari kesempurnaan. Maka beranilah mengambil langkah, karena dari sanalah kamu akan benar-benar hidup.",

    "Cinta sejati tidak pernah membuatmu merasa sendiri. Ia hadir dalam setiap degup jantung yang berdoa, dalam setiap hela nafas yang merindukan kebaikan untuk orang yang dicinta.",
    "Cinta bukan tentang bagaimana kita jatuh, tapi tentang bagaimana kita saling menguatkan untuk bangkit. Ia bukan pelarian, melainkan pijakan kokoh untuk melangkah lebih jauh.",
    "Orang yang tepat bukan yang membuatmu merasa sempurna, tapi yang membuatmu merasa berharga meski dengan segala kekuranganmu. Ia adalah rumah yang tak pernah kau cari, tapi selalu kau rindukan.",
    "Rumah bukanlah tempat, melainkan orang-orang di dalamnya yang membuatmu merasa aman. Ia adalah senyum anak yang menyambut, tawa pasangan yang mengisi, dan doa orang tua yang mengiringi.",
    "Cinta adalah ketika dua insan saling melihat ke arah yang sama, dengan mimpi yang mungkin berbeda, tapi komitmen untuk berjalan bersama tetap menjadi tujuan utama.",
    "Kebahagiaan terbesar adalah saat kita bisa membahagiakan orang tua. Melihat mereka tersenyum, itu adalah cinta yang tak terkatakan, yang membayar semua lelah dan letih.",
    "Keluarga bukan hanya soal darah, tapi juga tentang hati yang saling terhubung, tentang jiwa-jiwa yang memilih untuk saling menjaga dan mencintai tanpa syarat.",
    "Cinta tidak selalu tentang kebersamaan fisik, tapi tentang bagaimana hati tetap terhubung meski jarak memisahkan. Ia adalah keyakinan bahwa kalian saling mendoakan, di mana pun berada.",

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

    "Sesungguhnya Tuhan tidak akan mengubah keadaan suatu kaum sampai mereka mengubah keadaan diri mereka sendiri. Transformasi yang kamu cari dimulai bukan di luar, tapi dalam keputusan-keputusan sunyi yang tidak ada orang lain yang melihatmu membuat.",
    "Kamu dilahirkan bersayap. Mengapa memilih untuk merangkak seumur hidup? Sangkar tempat kamu tinggal ditenun dari ketakutan yang kamu warisi, bukan dari kebenaran tentang siapa kamu dan untuk apa kamu diciptakan.",
    "Jatuh cinta itu mudah, bertahan di dalamnya pun tidak terlalu sulit karena kesepian manusia sudah cukup jadi alasan. Tapi pencarian yang berat dan layak dilakukan adalah menemukan seseorang yang dengan kehadirannya yang teguh, kamu perlahan menjadi dirimu yang terbaik.",
    "Hal terindah yang bisa kita alami adalah misteri. Itu adalah sumber dari semua seni sejati, semua ilmu sejati, dan semua cinta sejati — mengetahui bahwa ada sesuatu yang tidak bisa kita tembus namun sungguh-sungguh ada di luar sana.",
    "Ujian keimanan yang sesungguhnya bukan ketika hidupmu mudah dan doamu cepat terkabul, tapi ketika langit terasa tertutup, doa terasa memantul, dan kamu tetap memilih untuk berlutut dan percaya bahwa Allah lebih tahu dari yang kamu minta.",

    "Kehidupan takkan selalu mudah, tapi kau di sini bukan untuk hancur. Kau di sini untuk melentur dalam badai, menyerap guncangan, dan berdiri tegak saat langit cerah, dengan keyakinan bahwa akar yang kau tanam di masa gelap telah membuatmu kokoh.",
    "Jangan kau bersedih, sesungguhnya Allah bersama kita. Kalimat itu bukan sekadar penghibuan—itu adalah fakta yang meneguhkan bahwa di setiap tetes air mata, ada tangan-tangan kasih yang tak terlihat sedang merajut kembali kekuatanmu, sehelai demi sehelai.",
    "Kintsugi adalah seni Jepang memperbaiki keramik retak dengan emas. Retakannya menjadi bagian dari sejarah dan keindahan benda itu. Kau juga begitu, bukan barang rusak. Retakanmu adalah tempat emas pengalamanmu menyusup, menjadikanmu lebih berharga.",
    "Hal paling otentik dalam diri manusia adalah kapasitas untuk mencipta, bertahan, mengatasi, bertransformasi, mencintai, dan menjadi lebih besar dari penderitaannya. Itulah puncak pengalaman manusia, dan ia diraih di lembah-lembah kehidupan.",
    "Ketahuilah, kemenangan itu bersama kesabaran, jalan keluar itu bersama kesulitan, dan bersama kesulitan itu ada kemudahan. Ini bukan mantra, ini adalah janji. Maka berpegangteguhlah pada janji itu, bahkan saat matamu sendiri tak melihat jalannya.",

    "Ketakutan terdalam kita bukanlah karena kita tidak mampu; ketakutan terdalam kita adalah karena kita sangat kuat. Cahaya kitalah yang paling menakutkan, bukan kegelapan kita. Kau bertanya, 'Siapa aku untuk menjadi luar biasa?' Sebaliknya, bertanyalah, 'Siapa aku untuk tidak menjadi luar biasa?'",
    "Bukan kritikus yang penting; bukan mereka yang menunjukkan bagaimana orang kuat tersandung. Penghargaan adalah milik mereka yang benar-benar berada di arena, yang wajahnya kotor oleh debu dan keringat; yang berjuang dengan gagah berani; yang bisa gagal, tapi setidaknya pernah mencoba.",
    "Berani adalah kehilangan pijakan sejenak. Tidak berani adalah kehilangan diri sendiri. Ketidaknyamanan sesaat dari sebuah keberanian adalah harga kecil untuk penyesalan permanen dari kehidupan yang tidak dijalani, cinta yang tidak diungkapkan.",
    "Gua yang paling kau takuti untuk dimasuki, menyimpan harta yang paling kau cari. Hal yang paling kau hindari—percakapan sulit, risiko besar, jalan tak dikenal—adalah pintu menuju semua yang selama ini kau impikan.",
    "Di tengah malam yang paling gelap sekalipun, keberanian adalah suara sunyi di penghujung hari yang berkata, 'Aku akan mencoba lagi besok.' Ia adalah ketangguhan hati manusia yang membuatnya terus berdetak sepanjang malam, menanti fajar.",

    "Untuk seorang manusia mencintai manusia lain: itu mungkin tugas paling sulit dari semua tugas kita, ujian terakhir, bukti terbesar, pekerjaan yang menjadi persiapan untuk semua pekerjaan lain. Ia adalah dorongan bagi individu untuk menjadi dewasa, menjadi sesuatu dalam dirinya, menjadi dunianya sendiri demi orang lain.",
    "Kita mencintai dengan cinta yang lebih dari sekadar cinta—ia adalah pengertian diam, bukti akhir bahwa kebenaran adalah apa yang kau tetaplah bersama, bukan yang kau lari darinya. Ia adalah jangkar di tengah arus hari-hari yang terus mengalir.",
    "Ujian cinta yang sesungguhnya bukanlah bagaimana perasaanmu di puncak gairah, tapi bagaimana kalian memperlakukan satu sama lain di lembah yang sunyi, ketika kegembiraan telah pudar dan yang tersisa hanyalah keputusan untuk terus saling memilih setiap hari, tahun demi tahun.",
    "Aku bukan siapa-siapa, hanya orang biasa dengan pikiran biasa. Hidupku biasa saja. Tak ada monumen yang dibangun untukku. Tapi aku telah mencintai orang lain dengan segenap hati dan jiwa, dan bagiku, itu selalu cukup. Itulah monumen terindah yang bisa kubangun.",
    "Cinta tidak dimulai dan berakhir seperti yang kita kira. Cinta adalah pertempuran, cinta adalah perang; cinta adalah pendewasaan. Ia adalah tindakan penciptaan yang berkelanjutan, kisah yang kau tulis bersama, kata demi kata, bahkan saat kau lelah, bahkan saat kau merasa tak bisa menemukan kata berikutnya.",
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
        filtered = list.filter(q => q.length > 60 && q.length <= 120);
    } else if (difficulty === "Hard") {
        filtered = list.filter(q => q.length > 120);
    }

    // Fallback to full list if no quotes match the difficulty bracket
    if (filtered.length === 0) filtered = list;

    return filtered[Math.floor(random() * filtered.length)];
}
