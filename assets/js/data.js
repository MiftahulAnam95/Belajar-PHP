window.PhpLabData = (() => {
  const starterPrerequisite =
    "Cukup tahu HTML dasar: tag membuat isi halaman, CSS membuat tampilan, dan browser menampilkan hasilnya. Kalau belum hafal, tidak apa-apa. Ikuti contoh pelan-pelan.";

  const defaultTerms = [
    { term: "Server", meaning: "Tempat PHP bekerja. Bayangkan seperti dapur yang memasak halaman sebelum diberikan ke browser." },
    { term: "Request", meaning: "Permintaan dari browser, misalnya membuka halaman atau mengirim form." },
    { term: "Response", meaning: "Jawaban dari server, biasanya HTML yang sudah siap ditampilkan browser." }
  ];

  const lesson = (item) => ({
    icon: "bi-filetype-php",
    duration: "10 menit",
    prerequisite: starterPrerequisite,
    overview: item.goal,
    kidGoal: item.goal,
    tinyProject: "Tambahkan bagian kecil ini ke project latihanmu. Tidak perlu besar; satu file yang berjalan dengan benar sudah cukup.",
    deployNote:
      "Kebiasaan siap deploy: jalankan lewat localhost, pastikan tidak ada error, rapikan nama file, dan jangan menampilkan data pengguna tanpa pengamanan.",
    steps: [
      "Baca tujuan kecilnya. Tanyakan: setelah ini aku bisa membuat apa?",
      "Lihat contoh kode satu bagian saja. Jangan buru-buru ke bawah.",
      "Ketik ulang di file .php lewat server lokal.",
      "Ubah satu nilai kecil, jalankan ulang, lalu lihat bagian mana yang berubah.",
      "Jelaskan ulang dengan bahasa sendiri sebelum menekan selesai."
    ],
    terms: defaultTerms,
    commonMistakes: [
      "Membuka file PHP langsung sebagai file biasa, bukan lewat server lokal.",
      "Lupa tanda titik koma, tanda kutip, atau tanda kurung penutup.",
      "Mencampur HTML dan PHP tanpa memahami bagian yang dijalankan server."
    ],
    checkpoint: "Kamu siap lanjut jika bisa menjelaskan fungsi contoh kode dengan kata-katamu sendiri.",
    filename: "index.php",
    ...item
  });

  const lessons = [
    lesson({
      id: "apa-itu-php",
      title: "Apa itu PHP?",
      icon: "bi-question-circle",
      duration: "8 menit",
      goal: "Memahami PHP sebagai bahasa server-side untuk membuat halaman web dinamis.",
      problem: "HTML, CSS, dan JavaScript dapat membuat halaman menarik, tetapi belum cukup untuk login, form kontak, data produk, dan dashboard yang mengambil data dari server.",
      analogy: "HTML seperti formulir kosong. PHP seperti petugas di belakang meja yang mengisi data, memeriksa form, dan mengirim halaman yang sudah siap ke browser.",
      explanation: "PHP berjalan di server. Browser meminta halaman, server menjalankan kode PHP, lalu hasil akhirnya dikirim sebagai HTML. Karena itu browser tidak melihat kode PHP asli.",
      code: `<?php
$nama = "Nadia";
$materi = "PHP dasar";

echo "<h1>Halo, " . $nama . "</h1>";
echo "<p>Selamat belajar " . $materi . ".</p>";`,
      lineNotes: [
        "<?php menandai awal kode PHP.",
        "$nama dan $materi menyimpan data sementara.",
        "echo mengirim teks atau HTML sebagai output.",
        "Titik dipakai untuk menyambung teks."
      ],
      exercise: "Ganti nama dan materi, lalu jelaskan bagian mana yang akhirnya berubah di browser.",
      recall: "Mengapa PHP disebut server-side, bukan client-side seperti JavaScript di browser?",
      debug: {
        question: "Mengapa kode PHP tidak terlihat di View Source browser?",
        hint: "PHP sudah dijalankan sebelum response sampai ke browser.",
        solution: "Browser hanya menerima hasil akhir berupa HTML, CSS, dan JavaScript. Kode PHP asli tetap berada di server."
      },
      quiz: {
        question: "PHP dijalankan terutama di...",
        options: ["Server", "File CSS", "Database", "DevTools browser"],
        answer: 0,
        explanation: "PHP berjalan di server lalu mengirim HTML sebagai response."
      },
      previewOutput: "Halo, Nadia\nSelamat belajar PHP dasar."
    }),
    lesson({
      id: "persiapan-server-lokal",
      title: "Menyiapkan server lokal",
      icon: "bi-hdd-network",
      duration: "10 menit",
      goal: "Menjalankan file PHP lewat server lokal agar kode benar-benar diproses.",
      problem: "File .php tidak cukup dibuka dengan double click karena browser tidak menjalankan mesin PHP.",
      analogy: "File PHP seperti resep dapur. Browser hanya tamu yang menerima makanan jadi, sedangkan server lokal adalah dapur yang memasak resepnya.",
      explanation: "Gunakan XAMPP, Laragon, MAMP, atau PHP built-in server. Untuk built-in server, buka terminal di folder project lalu jalankan php -S localhost:8000.",
      filename: "terminal",
      code: `php -v
php -S localhost:8000`,
      lineNotes: [
        "php -v mengecek apakah PHP sudah terpasang.",
        "php -S localhost:8000 menjalankan server lokal sederhana.",
        "Buka http://localhost:8000 di browser."
      ],
      exercise: "Buat folder latihan-php, isi dengan index.php, lalu jalankan server lokal dari folder itu.",
      recall: "Mengapa file PHP harus dibuka lewat alamat localhost?",
      debug: {
        question: "Terminal menampilkan php tidak dikenali. Apa artinya?",
        hint: "Sistem belum menemukan program PHP.",
        solution: "Install PHP lewat XAMPP/Laragon atau tambahkan path PHP ke environment variable, lalu buka terminal baru."
      },
      quiz: {
        question: "Alamat umum untuk server lokal adalah...",
        options: ["localhost", "style.css", "document.querySelector", "index.html saja"],
        answer: 0,
        explanation: "localhost mengarah ke komputer sendiri yang menjalankan server lokal."
      },
      previewOutput: "PHP 8.x terdeteksi\nDevelopment Server started at http://localhost:8000"
    }),
    lesson({
      id: "sintaks-echo-komentar",
      title: "Sintaks, echo, dan komentar",
      icon: "bi-code-slash",
      duration: "10 menit",
      goal: "Mengenali aturan dasar penulisan PHP dan cara menampilkan output.",
      problem: "Pemula sering bingung membedakan teks HTML biasa, kode PHP, dan komentar yang tidak dijalankan.",
      analogy: "HTML adalah tulisan di kertas. PHP adalah instruksi di balik layar. Komentar adalah catatan untuk diri sendiri yang tidak dibaca pengunjung.",
      explanation: "Kode PHP biasanya berada di antara <?php dan ?>. Perintah umum diakhiri titik koma. echo dipakai untuk menampilkan teks atau HTML.",
      code: `<?php
// Ini komentar satu baris
echo "Belajar PHP";
echo "<br>";
echo "PHP bisa mencetak HTML";`,
      lineNotes: [
        "// membuat komentar satu baris.",
        "echo mencetak teks ke response.",
        "<br> tetap HTML, tetapi dikirim lewat PHP.",
        "Setiap echo diakhiri titik koma."
      ],
      exercise: "Tulis tiga echo: judul, paragraf, dan tombol sederhana.",
      recall: "Apa perbedaan komentar PHP dan output echo?",
      debug: {
        question: "Mengapa halaman error saat titik koma di akhir echo dihapus?",
        hint: "PHP perlu tahu kapan satu perintah selesai.",
        solution: "Tambahkan titik koma setelah setiap statement, misalnya echo \"Halo\";"
      },
      quiz: {
        question: "Perintah PHP untuk menampilkan teks adalah...",
        options: ["echo", "color", "querySelector", "href"],
        answer: 0,
        explanation: "echo mengirim output dari PHP."
      },
      previewOutput: "Belajar PHP\nPHP bisa mencetak HTML"
    }),
    lesson({
      id: "variabel-tipe-data",
      title: "Variabel dan tipe data",
      icon: "bi-box",
      duration: "11 menit",
      goal: "Menyimpan teks, angka, boolean, dan nilai sederhana di variabel PHP.",
      problem: "Halaman dinamis perlu menyimpan nama pengguna, harga, status login, dan nilai lain sebelum ditampilkan.",
      analogy: "Variabel seperti kotak berlabel. Labelnya nama variabel, isinya bisa teks, angka, atau status benar/salah.",
      explanation: "Variabel PHP diawali tanda $. PHP mengenal string, integer, float, boolean, null, array, dan object. Untuk awal, fokus pada string, angka, boolean, dan array.",
      code: `<?php
$nama = "Rafi";
$umur = 17;
$sudahBelajarHtml = true;

echo $nama;
echo " berumur ";
echo $umur;`,
      lineNotes: [
        "$nama berisi teks atau string.",
        "$umur berisi angka integer.",
        "$sudahBelajarHtml berisi boolean true.",
        "Variabel dapat langsung dipakai oleh echo."
      ],
      exercise: "Buat variabel nama, kota, dan targetBelajar, lalu tampilkan menjadi satu kalimat.",
      recall: "Mengapa nama variabel di PHP selalu diawali tanda $?",
      debug: {
        question: "Mengapa echo nama; tidak menampilkan isi variabel $nama?",
        hint: "Variabel PHP harus ditulis lengkap dengan tanda $.",
        solution: "Gunakan echo $nama; karena nama tanpa $ dianggap konstanta atau teks yang tidak tepat."
      },
      quiz: {
        question: "Penulisan variabel PHP yang benar adalah...",
        options: ["$nama", "let nama", "#nama", "var:nama"],
        answer: 0,
        explanation: "Variabel PHP diawali tanda $."
      },
      previewOutput: "Rafi berumur 17"
    }),
    lesson({
      id: "string-operator",
      title: "String dan operator",
      icon: "bi-plus-slash-minus",
      duration: "12 menit",
      goal: "Menggabungkan teks dan menghitung nilai sederhana dengan operator PHP.",
      problem: "Website sering perlu membuat kalimat dinamis, menghitung total belanja, atau menampilkan status berdasarkan angka.",
      analogy: "Operator seperti alat hitung dan lem. Ada yang menjumlahkan angka, ada yang menyambung teks.",
      explanation: "Gunakan +, -, *, / untuk angka. Gunakan titik untuk menggabungkan string. PHP juga punya operator perbandingan seperti ==, ===, >, dan <.",
      code: `<?php
$produk = "Buku PHP";
$harga = 45000;
$jumlah = 2;
$total = $harga * $jumlah;

echo $produk . " x " . $jumlah;
echo "<br>Total: Rp" . $total;`,
      lineNotes: [
        "$total menyimpan hasil perkalian.",
        "Titik menyambung teks dan nilai variabel.",
        "Operator * dipakai untuk perkalian.",
        "Output dapat dicampur dengan tag HTML sederhana."
      ],
      exercise: "Buat total harga dari tiga barang, lalu tampilkan nama barang dan totalnya.",
      recall: "Kapan memakai titik dan kapan memakai tanda plus di PHP?",
      debug: {
        question: "Mengapa \"Rp\" + $total menghasilkan perilaku membingungkan?",
        hint: "Tanda plus untuk operasi angka, bukan menyambung teks.",
        solution: "Gunakan titik: \"Rp\" . $total."
      },
      quiz: {
        question: "Operator untuk menggabungkan string di PHP adalah...",
        options: [".", "+", "&", ","],
        answer: 0,
        explanation: "PHP memakai titik untuk concatenation."
      },
      previewOutput: "Buku PHP x 2\nTotal: Rp90000"
    }),
    lesson({
      id: "kondisi-if-else",
      title: "Kondisi if else",
      icon: "bi-signpost-2",
      duration: "12 menit",
      goal: "Membuat halaman bereaksi berdasarkan kondisi tertentu.",
      problem: "Aplikasi perlu menampilkan pesan berbeda untuk nilai lulus, stok kosong, atau pengguna yang sudah login.",
      analogy: "Kondisi seperti penjaga pintu. Jika syarat terpenuhi, pintu A dibuka. Jika tidak, pintu B yang dibuka.",
      explanation: "if mengecek syarat. else dijalankan saat syarat tidak terpenuhi. elseif dipakai jika ada lebih dari dua kemungkinan.",
      code: `<?php
$nilai = 82;

if ($nilai >= 75) {
    echo "Lulus";
} else {
    echo "Belum lulus";
}`,
      lineNotes: [
        "$nilai menyimpan angka yang diuji.",
        "$nilai >= 75 adalah syarat.",
        "Blok if berjalan jika syarat benar.",
        "Blok else berjalan jika syarat salah."
      ],
      exercise: "Buat kondisi untuk stok produk: jika stok lebih dari 0 tampilkan Tersedia, jika tidak tampilkan Habis.",
      recall: "Apa yang terjadi pada blok else saat kondisi if bernilai true?",
      debug: {
        question: "Mengapa if ($nilai = 75) selalu terasa benar?",
        hint: "Satu tanda sama dengan bukan operator perbandingan.",
        solution: "Gunakan == atau lebih tegas === untuk membandingkan nilai. Tanda = dipakai untuk mengisi variabel."
      },
      quiz: {
        question: "Operator untuk mengecek lebih besar atau sama dengan adalah...",
        options: [">=", "=>", "=<", "==>"],
        answer: 0,
        explanation: ">= berarti kiri lebih besar atau sama dengan kanan."
      },
      previewOutput: "Lulus"
    }),
    lesson({
      id: "array-dasar",
      title: "Array dasar",
      icon: "bi-list-ul",
      duration: "12 menit",
      goal: "Menyimpan banyak data dalam satu variabel array.",
      problem: "Daftar menu, skill, produk, dan catatan tidak praktis jika disimpan dalam banyak variabel terpisah.",
      analogy: "Array seperti rak. Satu rak punya banyak kotak, setiap kotak menyimpan satu item.",
      explanation: "Array PHP dapat berupa list berurutan atau associative array dengan key. Untuk pemula, mulai dari list biasa lalu lanjut ke key value.",
      code: `<?php
$skills = ["HTML", "CSS", "JavaScript", "PHP"];

echo $skills[0];
echo "<br>";
echo $skills[3];`,
      lineNotes: [
        "Array list dibuat dengan tanda kurung siku.",
        "Index array dimulai dari 0.",
        "$skills[0] mengambil item pertama.",
        "$skills[3] mengambil item keempat."
      ],
      exercise: "Buat array berisi tiga target belajar, lalu tampilkan target pertama dan terakhir.",
      recall: "Mengapa item pertama array list diambil dengan index 0?",
      debug: {
        question: "Mengapa $skills[4] menghasilkan warning undefined array key?",
        hint: "Hitung index dari 0.",
        solution: "Array berisi 4 item memiliki index 0, 1, 2, dan 3. Gunakan index yang tersedia."
      },
      quiz: {
        question: "Index item pertama dalam array list PHP adalah...",
        options: ["0", "1", "-1", "first"],
        answer: 0,
        explanation: "Array list PHP dimulai dari index 0."
      },
      previewOutput: "HTML\nPHP"
    }),
    lesson({
      id: "perulangan-foreach",
      title: "Perulangan foreach",
      icon: "bi-arrow-repeat",
      duration: "13 menit",
      goal: "Menampilkan semua item array tanpa menulis echo berulang-ulang.",
      problem: "Jika daftar produk berisi 50 item, menulis echo satu per satu akan melelahkan dan rawan salah.",
      analogy: "foreach seperti petugas yang mengambil item dari rak satu per satu sampai raknya habis.",
      explanation: "foreach cocok untuk membaca array. Setiap putaran memberi satu item sementara yang bisa ditampilkan atau diproses.",
      code: `<?php
$materi = ["Variabel", "Kondisi", "Array", "Form"];

echo "<ul>";
foreach ($materi as $item) {
    echo "<li>" . $item . "</li>";
}
echo "</ul>";`,
      lineNotes: [
        "$materi berisi beberapa item.",
        "foreach mengambil setiap item ke variabel $item.",
        "Setiap item dicetak sebagai li.",
        "ul dibuka sebelum loop dan ditutup setelah loop."
      ],
      exercise: "Tampilkan array daftar hobi menjadi list HTML.",
      recall: "Apa isi variabel $item pada setiap putaran foreach?",
      debug: {
        question: "Mengapa list kosong saat variabel yang diloop salah nama?",
        hint: "Nama array pada foreach harus sama dengan variabel yang berisi data.",
        solution: "Jika array bernama $materi, tulis foreach ($materi as $item), bukan foreach ($material as $item)."
      },
      quiz: {
        question: "Perulangan yang paling umum untuk membaca array PHP adalah...",
        options: ["foreach", "media query", "onclick", "href"],
        answer: 0,
        explanation: "foreach dirancang untuk mengulang item array."
      },
      previewOutput: "- Variabel\n- Kondisi\n- Array\n- Form"
    }),
    lesson({
      id: "fungsi-dasar",
      title: "Fungsi dasar",
      icon: "bi-braces",
      duration: "13 menit",
      goal: "Membungkus logika agar bisa dipakai ulang.",
      problem: "Kode yang sama sering muncul berulang, misalnya format harga, validasi teks, atau membuat pesan sapaan.",
      analogy: "Fungsi seperti cetakan. Masukkan bahan, cetakan mengembalikan bentuk yang konsisten.",
      explanation: "Fungsi dibuat dengan keyword function. Parameter adalah input fungsi, return adalah hasil yang dikembalikan.",
      code: `<?php
function formatRupiah($angka) {
    return "Rp" . number_format($angka, 0, ",", ".");
}

echo formatRupiah(125000);`,
      lineNotes: [
        "function formatRupiah membuat fungsi baru.",
        "$angka adalah parameter input.",
        "return mengembalikan hasil.",
        "number_format membantu merapikan angka."
      ],
      exercise: "Buat fungsi sapa($nama) yang mengembalikan Halo, nama.",
      recall: "Apa perbedaan echo di dalam fungsi dan return dari fungsi?",
      debug: {
        question: "Mengapa hasil fungsi tidak tampil saat hanya memanggil formatRupiah(10000);?",
        hint: "return hanya mengembalikan nilai, belum mencetaknya.",
        solution: "Gunakan echo formatRupiah(10000); jika ingin menampilkan hasilnya."
      },
      quiz: {
        question: "Keyword untuk mengembalikan hasil dari fungsi adalah...",
        options: ["return", "repeat", "send", "print-css"],
        answer: 0,
        explanation: "return mengirim hasil keluar dari fungsi."
      },
      previewOutput: "Rp125.000"
    }),
    lesson({
      id: "form-get-post",
      title: "Membaca form GET dan POST",
      icon: "bi-ui-checks",
      duration: "14 menit",
      goal: "Mengambil data yang dikirim dari form HTML ke PHP.",
      problem: "Website perlu menerima nama, email, pencarian, komentar, dan data lain dari pengguna.",
      analogy: "Form seperti amplop. GET menulis sebagian data di alamat, POST mengirim data di dalam amplop.",
      explanation: "PHP menyediakan $_GET dan $_POST. Attribute name pada input menjadi key yang dibaca PHP.",
      code: `<!-- index.php -->
<form method="POST">
  <input name="nama" placeholder="Nama">
  <button>Kirim</button>
</form>

<?php
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    echo "Halo, " . $_POST["nama"];
}`,
      lineNotes: [
        "method POST membuat data dikirim lewat request body.",
        "name=\"nama\" menjadi key $_POST[\"nama\"].",
        "REQUEST_METHOD membantu mengecek form sudah dikirim.",
        "Data pengguna perlu divalidasi sebelum dipakai serius."
      ],
      exercise: "Buat form berisi nama dan kota, lalu tampilkan kalimat perkenalan.",
      recall: "Apa hubungan attribute name pada input dengan $_POST di PHP?",
      debug: {
        question: "Mengapa $_POST[\"nama\"] kosong padahal input sudah diisi?",
        hint: "Periksa method form dan attribute name.",
        solution: "Pastikan form memakai method=\"POST\" dan input memiliki name=\"nama\"."
      },
      quiz: {
        question: "Data dari form method POST dibaca lewat...",
        options: ["$_POST", "$_GET", "$_STYLE", "$_HTML"],
        answer: 0,
        explanation: "$_POST berisi data yang dikirim dengan method POST."
      },
      previewOutput: "Form dikirim dengan nama Nadia -> Halo, Nadia"
    }),
    lesson({
      id: "validasi-input",
      title: "Validasi dan sanitasi input",
      icon: "bi-shield-check",
      duration: "15 menit",
      goal: "Memeriksa data pengguna sebelum ditampilkan atau diproses.",
      problem: "Input kosong, email salah, atau teks berisi HTML bisa membuat aplikasi membingungkan dan tidak aman.",
      analogy: "Validasi seperti petugas loket yang mengecek formulir. Sanitasi seperti membersihkan teks sebelum ditempel ke papan pengumuman.",
      explanation: "Gunakan trim untuk merapikan spasi, empty untuk cek kosong, filter_var untuk email, dan htmlspecialchars saat menampilkan input pengguna ke HTML.",
      code: `<?php
$nama = trim($_POST["nama"] ?? "");

if ($nama === "") {
    echo "Nama wajib diisi";
} else {
    echo "Halo, " . htmlspecialchars($nama);
}`,
      lineNotes: [
        "?? memberi nilai default jika key belum ada.",
        "trim menghapus spasi di awal dan akhir.",
        "Kondisi mengecek nama kosong.",
        "htmlspecialchars membuat output lebih aman untuk HTML."
      ],
      exercise: "Validasi email: wajib diisi dan harus lolos filter_var dengan FILTER_VALIDATE_EMAIL.",
      recall: "Mengapa data dari pengguna perlu di-escape sebelum ditampilkan?",
      debug: {
        question: "Mengapa teks <b>Admin</b> tidak boleh langsung di-echo dari input pengguna?",
        hint: "Browser dapat menganggap input itu sebagai HTML aktif.",
        solution: "Tampilkan input pengguna dengan htmlspecialchars agar karakter HTML menjadi teks biasa."
      },
      quiz: {
        question: "Fungsi yang umum dipakai untuk mengamankan output HTML adalah...",
        options: ["htmlspecialchars", "foreach", "include", "localhost"],
        answer: 0,
        explanation: "htmlspecialchars mengubah karakter khusus HTML menjadi entity."
      },
      previewOutput: "Input kosong -> Nama wajib diisi\nInput Nadia -> Halo, Nadia"
    }),
    lesson({
      id: "include-template",
      title: "Include dan template sederhana",
      icon: "bi-window-stack",
      duration: "13 menit",
      goal: "Memecah halaman menjadi bagian header, navbar, konten, dan footer.",
      problem: "Navbar dan footer akan berulang di banyak halaman jika ditulis ulang terus.",
      analogy: "include seperti mengambil potongan LEGO yang sama untuk dipasang di banyak halaman.",
      explanation: "include memasukkan file PHP lain ke posisi tertentu. Ini membantu membuat struktur halaman lebih rapi sebelum belajar framework seperti Laravel.",
      code: `<!-- index.php -->
<?php include "partials/header.php"; ?>

<main>
  <h1>Beranda</h1>
  <p>Selamat datang di website PHP.</p>
</main>

<?php include "partials/footer.php"; ?>`,
      lineNotes: [
        "include header menaruh bagian atas halaman.",
        "Konten utama tetap ditulis di index.php.",
        "include footer menaruh bagian bawah halaman.",
        "Path file harus sesuai struktur folder."
      ],
      exercise: "Buat partial header.php dan footer.php, lalu pakai di dua halaman berbeda.",
      recall: "Apa keuntungan include dibanding menyalin navbar ke semua file?",
      debug: {
        question: "Mengapa muncul failed to open stream saat include?",
        hint: "PHP tidak menemukan file yang diminta.",
        solution: "Periksa nama folder, nama file, huruf besar kecil, dan posisi file relatif terhadap file yang menjalankan include."
      },
      quiz: {
        question: "Fungsi include membantu kita untuk...",
        options: ["Memakai ulang potongan file", "Mengubah warna CSS otomatis", "Menjalankan database tanpa server", "Menghapus HTML"],
        answer: 0,
        explanation: "include memasukkan isi file lain ke file saat ini."
      },
      previewOutput: "Header tampil\nBeranda\nFooter tampil"
    }),
    lesson({
      id: "session-cookie",
      title: "Session dan cookie",
      icon: "bi-person-badge",
      duration: "14 menit",
      goal: "Menyimpan data sementara pengguna di sisi server atau browser.",
      problem: "Aplikasi perlu mengingat pengguna sudah login, pesan flash, atau preferensi sederhana.",
      analogy: "Session seperti loker di server dengan nomor tiket di browser. Cookie seperti catatan kecil yang disimpan di browser.",
      explanation: "Session dimulai dengan session_start lalu data disimpan di $_SESSION. Cookie dibuat dengan setcookie dan dikirim ke browser.",
      code: `<?php
session_start();

$_SESSION["nama"] = "Nadia";

echo "Halo, " . $_SESSION["nama"];`,
      lineNotes: [
        "session_start harus dipanggil sebelum output HTML.",
        "$_SESSION menyimpan data selama sesi pengguna.",
        "Data session berada di server.",
        "Browser menyimpan id session agar server mengenali sesi."
      ],
      exercise: "Simpan tema gelap/terang di session lalu tampilkan statusnya.",
      recall: "Mengapa session_start harus dipanggil sebelum echo atau HTML?",
      debug: {
        question: "Mengapa muncul warning headers already sent saat memakai session_start?",
        hint: "Session perlu mengirim header sebelum output.",
        solution: "Panggil session_start di baris paling atas sebelum spasi, HTML, atau echo apa pun."
      },
      quiz: {
        question: "Array superglobal untuk data session adalah...",
        options: ["$_SESSION", "$_POST", "$_FILES", "$_COOKIE_ONLY"],
        answer: 0,
        explanation: "$_SESSION menyimpan data sesi pengguna."
      },
      previewOutput: "Halo, Nadia"
    }),
    lesson({
      id: "file-json",
      title: "Menyimpan data ke file JSON",
      icon: "bi-filetype-json",
      duration: "15 menit",
      goal: "Mengenal penyimpanan data sederhana sebelum masuk database.",
      problem: "Untuk latihan kecil, kita kadang perlu menyimpan daftar catatan tanpa langsung memakai MySQL.",
      analogy: "File JSON seperti buku catatan kecil. PHP bisa membaca buku itu, menambah isi, lalu menyimpannya lagi.",
      explanation: "Gunakan file_get_contents untuk membaca file, json_decode untuk mengubah JSON menjadi array, json_encode untuk mengubah array menjadi JSON, dan file_put_contents untuk menyimpan.",
      code: `<?php
$file = "data/catatan.json";
$json = file_get_contents($file);
$catatan = json_decode($json, true);

$catatan[] = ["judul" => "Belajar PHP"];

file_put_contents($file, json_encode($catatan, JSON_PRETTY_PRINT));`,
      lineNotes: [
        "$file menyimpan lokasi file JSON.",
        "file_get_contents membaca isi file.",
        "json_decode dengan true menghasilkan array.",
        "file_put_contents menulis data baru ke file."
      ],
      exercise: "Buat file data/tugas.json berisi array kosong, lalu tambahkan satu tugas baru.",
      recall: "Mengapa json_decode sering diberi parameter true?",
      debug: {
        question: "Mengapa json_decode menghasilkan null?",
        hint: "Isi file mungkin bukan JSON valid.",
        solution: "Periksa koma berlebih, tanda kutip, kurung siku, dan gunakan json_last_error_msg untuk melihat pesan error."
      },
      quiz: {
        question: "Fungsi untuk mengubah JSON menjadi array PHP adalah...",
        options: ["json_decode", "json_encode", "file_put_contents", "foreach"],
        answer: 0,
        explanation: "json_decode membaca string JSON menjadi data PHP."
      },
      previewOutput: "catatan.json berisi item baru: Belajar PHP"
    }),
    lesson({
      id: "dasar-mysql-pdo",
      title: "Dasar MySQL dengan PDO",
      icon: "bi-database",
      duration: "16 menit",
      goal: "Menghubungkan PHP ke database MySQL dengan cara yang lebih aman.",
      problem: "Data penting seperti produk, pengguna, dan pesanan perlu disimpan di database, bukan hanya file.",
      analogy: "Database seperti lemari arsip. PDO adalah petugas yang mengambil data dengan prosedur yang lebih rapi.",
      explanation: "PDO adalah cara modern di PHP untuk terhubung ke database. Gunakan prepared statement agar input pengguna tidak langsung ditempel ke query SQL.",
      filename: "database.php",
      code: `<?php
$pdo = new PDO(
    "mysql:host=localhost;dbname=belajar_php",
    "root",
    ""
);

$stmt = $pdo->prepare("SELECT * FROM produk WHERE kategori = ?");
$stmt->execute(["buku"]);
$produk = $stmt->fetchAll(PDO::FETCH_ASSOC);`,
      lineNotes: [
        "new PDO membuat koneksi database.",
        "dbname harus sesuai database yang ada.",
        "prepare membuat query dengan placeholder.",
        "execute mengirim nilai placeholder secara aman."
      ],
      exercise: "Buat koneksi ke database latihan lalu ambil semua data dari tabel catatan.",
      recall: "Mengapa prepared statement lebih aman daripada menyambung input langsung ke SQL?",
      debug: {
        question: "Mengapa koneksi menampilkan Unknown database?",
        hint: "Nama database di DSN belum ada atau salah eja.",
        solution: "Buat database terlebih dahulu atau samakan dbname dengan nama database yang benar."
      },
      quiz: {
        question: "PDO dipakai untuk...",
        options: ["Mengakses database", "Mengatur warna tombol", "Membuat file CSS", "Mengganti HTML"],
        answer: 0,
        explanation: "PDO adalah antarmuka PHP untuk bekerja dengan database."
      },
      previewOutput: "Query siap mengambil produk kategori buku dari database."
    }),
    lesson({
      id: "crud-sederhana",
      title: "CRUD sederhana",
      icon: "bi-pencil-square",
      duration: "16 menit",
      goal: "Memahami alur Create, Read, Update, Delete pada aplikasi PHP.",
      problem: "Aplikasi nyata sering membutuhkan tambah, lihat, edit, dan hapus data.",
      analogy: "CRUD seperti mengelola daftar belanja: menambah item, membaca daftar, mengubah item, dan menghapus yang tidak perlu.",
      explanation: "CRUD biasanya terdiri dari halaman daftar, form tambah, form edit, proses simpan, proses update, dan proses hapus. Untuk database, gunakan query prepared.",
      filename: "simpan.php",
      code: `<?php
require "database.php";

$judul = trim($_POST["judul"] ?? "");

if ($judul !== "") {
    $stmt = $pdo->prepare("INSERT INTO catatan (judul) VALUES (?)");
    $stmt->execute([$judul]);
}

header("Location: index.php");
exit;`,
      lineNotes: [
        "require memasukkan koneksi database.",
        "Input judul dirapikan dan diberi default.",
        "INSERT menambah data baru.",
        "header mengarahkan kembali ke daftar."
      ],
      exercise: "Buat proses hapus data berdasarkan id memakai DELETE dan prepared statement.",
      recall: "Sebutkan arti Create, Read, Update, dan Delete.",
      debug: {
        question: "Mengapa header Location tidak bekerja setelah echo?",
        hint: "Redirect memakai header HTTP.",
        solution: "Jangan kirim output sebelum header. Letakkan proses redirect sebelum echo/HTML, lalu panggil exit."
      },
      quiz: {
        question: "Operasi CRUD untuk menambah data adalah...",
        options: ["Create", "Read", "Update", "Delete"],
        answer: 0,
        explanation: "Create berarti membuat atau menambah data baru."
      },
      previewOutput: "POST judul valid -> data masuk -> kembali ke index.php"
    }),
    lesson({
      id: "upload-file",
      title: "Upload file",
      icon: "bi-upload",
      duration: "15 menit",
      goal: "Menerima file dari form dan menyimpannya ke folder project.",
      problem: "Website profil, katalog, atau artikel sering membutuhkan upload gambar.",
      analogy: "Upload seperti menitipkan berkas ke loket. Form membawa file, PHP memeriksa, lalu memindahkannya ke rak yang benar.",
      explanation: "Form upload wajib memakai enctype multipart/form-data. PHP membaca file lewat $_FILES lalu memindahkan file sementara dengan move_uploaded_file.",
      filename: "upload.php",
      code: `<?php
if (isset($_FILES["foto"])) {
    $namaFile = basename($_FILES["foto"]["name"]);
    $tujuan = "uploads/" . $namaFile;

    move_uploaded_file($_FILES["foto"]["tmp_name"], $tujuan);
    echo "Upload berhasil";
}`,
      lineNotes: [
        "$_FILES berisi informasi file upload.",
        "basename membantu mengambil nama file.",
        "tmp_name adalah lokasi file sementara.",
        "move_uploaded_file memindahkan file ke folder tujuan."
      ],
      exercise: "Tambahkan validasi agar hanya file jpg atau png yang diterima.",
      recall: "Attribute form apa yang wajib ada agar file terkirim?",
      debug: {
        question: "Mengapa $_FILES kosong saat submit form?",
        hint: "Input file saja belum cukup.",
        solution: "Tambahkan enctype=\"multipart/form-data\" pada form dan pastikan method=\"POST\"."
      },
      quiz: {
        question: "Superglobal untuk membaca upload file adalah...",
        options: ["$_FILES", "$_POST", "$_UPLOADS", "$_IMAGE"],
        answer: 0,
        explanation: "$_FILES berisi data file yang diupload."
      },
      previewOutput: "File foto.jpg dipindahkan ke uploads/foto.jpg"
    }),
    lesson({
      id: "error-debugging",
      title: "Membaca error dan debugging",
      icon: "bi-bug",
      duration: "14 menit",
      goal: "Melatih cara membaca pesan error PHP tanpa panik.",
      problem: "Pemula sering hanya melihat halaman blank atau fatal error tanpa tahu bagian mana yang harus diperbaiki.",
      analogy: "Error seperti rambu jalan. Ia memberi tahu lokasi masalah, bukan sekadar menghalangi perjalanan.",
      explanation: "Baca jenis error, nama file, dan nomor baris. Aktifkan display_errors saat development, cek log server, dan perbaiki dari error paling atas.",
      code: `<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);

$nama = "Nadia";
echo $nama;`,
      lineNotes: [
        "display_errors menampilkan error di browser saat development.",
        "E_ALL meminta PHP melaporkan semua error penting.",
        "Nama file dan nomor baris membantu menemukan sumber masalah.",
        "Matikan tampilan error detail di production."
      ],
      exercise: "Buat kesalahan titik koma, baca nomor barisnya, lalu perbaiki.",
      recall: "Bagian pesan error apa yang biasanya paling cepat membantu menemukan masalah?",
      debug: {
        question: "Mengapa halaman blank saat ada error fatal?",
        hint: "Server mungkin menyembunyikan detail error.",
        solution: "Aktifkan display_errors di development atau baca file log server untuk melihat pesan error sebenarnya."
      },
      quiz: {
        question: "Saat debugging, informasi yang paling penting dari error biasanya...",
        options: ["Jenis error, file, dan baris", "Warna tombol", "Ukuran gambar", "Nama browser saja"],
        answer: 0,
        explanation: "Jenis error, file, dan baris membantu menemukan sumber masalah."
      },
      previewOutput: "Error terlihat jelas saat development, lalu diperbaiki dari baris yang disebutkan."
    }),
    lesson({
      id: "keamanan-dasar",
      title: "Keamanan dasar PHP",
      icon: "bi-lock",
      duration: "15 menit",
      goal: "Mengenal kebiasaan aman sebelum membuat aplikasi yang menerima input pengguna.",
      problem: "Aplikasi yang menerima input, login, upload, dan database rentan jika data pengguna dipercaya begitu saja.",
      analogy: "Keamanan seperti pagar, kunci, dan petugas cek. Setiap pintu masuk data harus diperiksa.",
      explanation: "Dasar yang perlu dibiasakan: validasi input, escape output, prepared statement, password_hash, password_verify, dan pembatasan upload file.",
      filename: "register.php",
      code: `<?php
$password = $_POST["password"] ?? "";
$hash = password_hash($password, PASSWORD_DEFAULT);

// Simpan $hash ke database, bukan password asli.
echo "Password siap disimpan dengan aman";`,
      lineNotes: [
        "Password asli tidak boleh disimpan langsung.",
        "password_hash membuat hash yang aman.",
        "PASSWORD_DEFAULT mengikuti rekomendasi PHP.",
        "Untuk login, cocokkan dengan password_verify."
      ],
      exercise: "Tulis ulang checklist keamanan untuk form login sederhana.",
      recall: "Mengapa password asli tidak boleh disimpan di database?",
      debug: {
        question: "Mengapa prepared statement tetap diperlukan meski input sudah divalidasi?",
        hint: "Validasi dan proteksi query menyelesaikan masalah berbeda.",
        solution: "Validasi memeriksa bentuk data. Prepared statement mencegah input menjadi bagian mentah dari perintah SQL."
      },
      quiz: {
        question: "Fungsi PHP untuk membuat hash password adalah...",
        options: ["password_hash", "md5 wajib", "echo_password", "hash_css"],
        answer: 0,
        explanation: "password_hash adalah pilihan bawaan PHP untuk hash password modern."
      },
      previewOutput: "Password siap disimpan dengan aman"
    }),
    lesson({
      id: "mini-project-php",
      title: "Mini project: buku tamu",
      icon: "bi-rocket-takeoff",
      duration: "18 menit",
      goal: "Merakit konsep variabel, form, validasi, JSON, include, tampilan, dan checklist deploy menjadi project kecil.",
      kidGoal: "Membuat buku tamu: teman menulis nama dan pesan, PHP menyimpan pesannya, lalu halaman menampilkan daftar pesan dengan aman.",
      tinyProject: "Bangun folder buku-tamu sampai bisa dibuka di localhost, menerima pesan, menyimpan ke JSON, menampilkan daftar, lalu cek daftar siap deploy.",
      deployNote:
        "Sebelum upload ke hosting, pastikan file data bisa ditulis, output memakai htmlspecialchars, tidak ada error detail terbuka, dan folder upload/data tidak berisi file berbahaya.",
      problem: "Setelah belajar potongan konsep, kamu perlu menyatukannya agar paham alur aplikasi PHP sederhana yang bisa dipindahkan ke hosting.",
      analogy: "Mini project seperti menyusun meja belajar: setiap bagian kecil akhirnya dipakai untuk membuat alat yang benar-benar berguna.",
      explanation: "Buku tamu menerima nama dan pesan, memvalidasi input, menyimpan data ke JSON, lalu menampilkan daftar pesan. Project ini belum butuh database sehingga cocok untuk penutup PHP dasar.",
      code: `<?php
$file = "data/pesan.json";
$pesan = json_decode(file_get_contents($file), true) ?? [];

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $nama = trim($_POST["nama"] ?? "");
    $isi = trim($_POST["pesan"] ?? "");

    if ($nama !== "" && $isi !== "") {
        $pesan[] = ["nama" => $nama, "pesan" => $isi];
        file_put_contents($file, json_encode($pesan, JSON_PRETTY_PRINT));
        header("Location: index.php");
        exit;
    }
}`,
      lineNotes: [
        "Data lama dibaca dari file JSON.",
        "POST diproses hanya saat form dikirim.",
        "Input kosong tidak disimpan.",
        "Setelah menyimpan, halaman diarahkan ulang agar submit tidak dobel."
      ],
      tutorialSections: [
        {
          title: "Buat struktur folder",
          description: "Mulai dari struktur yang kecil dan mudah dicari.",
          steps: ["Buat folder buku-tamu", "Buat folder data", "Buat file index.php dan style.css", "Buat data/pesan.json berisi []"],
          checklist: ["index.php berada di root project", "data/pesan.json dapat ditulis server lokal"]
        },
        {
          title: "Tulis form dan proses simpan",
          description: "Satu file cukup untuk latihan pertama.",
          files: [
            {
              filename: "index.php",
              note: "Bagian proses diletakkan sebelum HTML.",
              code: `<?php
$file = "data/pesan.json";
$pesan = json_decode(file_get_contents($file), true) ?? [];

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $nama = trim($_POST["nama"] ?? "");
    $isi = trim($_POST["pesan"] ?? "");

    if ($nama !== "" && $isi !== "") {
        $pesan[] = ["nama" => $nama, "pesan" => $isi];
        file_put_contents($file, json_encode($pesan, JSON_PRETTY_PRINT));
        header("Location: index.php");
        exit;
    }
}
?>

<form method="POST">
  <input name="nama" placeholder="Nama">
  <textarea name="pesan" placeholder="Pesan"></textarea>
  <button>Kirim</button>
</form>`
            }
          ],
          checklist: ["Form memakai method POST", "Input punya attribute name", "Redirect dilakukan setelah simpan"]
        },
        {
          title: "Tampilkan daftar pesan",
          description: "Gunakan foreach dan escape output.",
          files: [
            {
              filename: "daftar-pesan.php",
              note: "Potongan ini bisa ditempel setelah form.",
              code: `<ul>
  <?php foreach ($pesan as $item) : ?>
    <li>
      <strong><?= htmlspecialchars($item["nama"]) ?></strong>
      <p><?= htmlspecialchars($item["pesan"]) ?></p>
    </li>
  <?php endforeach; ?>
</ul>`
            }
          ],
          checklist: ["foreach membaca semua pesan", "htmlspecialchars dipakai untuk output pengguna"]
        },
        {
          title: "Cek sebelum deploy",
          description: "Ini bukan langkah upload penuh, tetapi kebiasaan akhir agar project PHP pertama lebih rapi saat pindah hosting.",
          steps: [
            "Jalankan php -S localhost:8000 dan coba kirim beberapa pesan.",
            "Kosongkan form lalu pastikan data kosong tidak tersimpan.",
            "Coba isi nama dengan <b>Admin</b> dan pastikan tampil sebagai teks biasa.",
            "Pastikan data/pesan.json berisi [] atau array JSON yang valid.",
            "Rapikan folder: index.php, style.css, folder data, dan file README kecil.",
            "Saat di hosting, matikan display_errors dan simpan catatan lokasi file data."
          ],
          files: [
            {
              filename: "README-project.txt",
              note: "Catatan kecil yang ikut di folder project.",
              code: `Nama project: Buku Tamu PHP
Cara menjalankan lokal:
php -S localhost:8000

File penting:
- index.php: form, proses simpan, dan daftar pesan
- data/pesan.json: tempat pesan disimpan
- style.css: tampilan halaman

Checklist deploy:
- Form sudah divalidasi
- Output memakai htmlspecialchars
- Tidak ada error detail untuk pengunjung
- Folder data bisa ditulis oleh server`
            }
          ],
          checklist: ["Project berjalan di localhost", "Input buruk tidak merusak tampilan", "Ada catatan cara menjalankan project"]
        }
      ],
      exercise: "Tambahkan tanggal pesan dan tombol hapus sederhana berdasarkan index array.",
      recall: "Konsep apa saja yang dipakai dalam project buku tamu ini?",
      debug: {
        question: "Mengapa pesan tersimpan dobel saat refresh setelah submit?",
        hint: "Browser mengulang request POST saat refresh.",
        solution: "Gunakan pola redirect setelah POST: simpan data, header Location ke halaman daftar, lalu exit."
      },
      quiz: {
        question: "Mengapa setelah menyimpan data sebaiknya redirect?",
        options: ["Agar submit POST tidak terulang saat refresh", "Agar CSS hilang", "Agar JSON berubah jadi HTML", "Agar PHP berjalan di browser"],
        answer: 0,
        explanation: "Redirect setelah POST mencegah data tersimpan dobel saat pengguna refresh."
      },
      previewOutput: "Form buku tamu menerima pesan, menyimpannya ke JSON, lalu menampilkan daftar pesan."
    })
  ];

  const quizQuestions = [
    {
      question: "PHP terutama berjalan di...",
      options: ["Server", "File CSS", "LocalStorage browser", "Tag img"],
      answer: 0,
      explanation: "PHP berjalan di server dan mengirim hasil akhir ke browser."
    },
    {
      question: "Variabel PHP ditulis dengan awalan...",
      options: ["$", "#", ".", "@"],
      answer: 0,
      explanation: "Semua variabel PHP diawali tanda $."
    },
    {
      question: "Operator untuk menyambung string di PHP adalah...",
      options: [".", "+", "&&", "=>"],
      answer: 0,
      explanation: "Titik dipakai untuk concatenation string."
    },
    {
      question: "Data form POST dibaca lewat...",
      options: ["$_POST", "$_GET", "$_FILES", "$_SERVER_ONLY"],
      answer: 0,
      explanation: "$_POST berisi data dari form method POST."
    },
    {
      question: "Fungsi untuk mengamankan output HTML dari input pengguna adalah...",
      options: ["htmlspecialchars", "include", "foreach", "number_format"],
      answer: 0,
      explanation: "htmlspecialchars mengubah karakter HTML khusus menjadi teks aman."
    },
    {
      question: "Perulangan yang nyaman untuk array adalah...",
      options: ["foreach", "include", "header", "setcookie"],
      answer: 0,
      explanation: "foreach membaca item array satu per satu."
    },
    {
      question: "Session harus dimulai dengan...",
      options: ["session_start()", "start_css()", "new Session HTML", "echo session"],
      answer: 0,
      explanation: "session_start membuka atau melanjutkan session PHP."
    },
    {
      question: "Prepared statement membantu mencegah...",
      options: ["SQL injection", "Gambar terlalu besar saja", "CSS conflict", "Typo heading"],
      answer: 0,
      explanation: "Prepared statement memisahkan query dan data input."
    },
    {
      question: "Form upload file wajib memakai...",
      options: ["enctype=\"multipart/form-data\"", "target=\"_blank\"", "display:flex", "defer"],
      answer: 0,
      explanation: "enctype multipart/form-data membuat file benar-benar dikirim."
    },
    {
      question: "Setelah header(\"Location: ...\"), sebaiknya panggil...",
      options: ["exit", "foreach", "include", "number_format"],
      answer: 0,
      explanation: "exit menghentikan proses agar kode setelah redirect tidak tetap berjalan."
    }
  ];

  const recallChallenges = [
    {
      id: "recall-server-side",
      type: "Alur web",
      title: "PHP dan browser",
      prompt: "Jelaskan alur saat browser membuka index.php di localhost.",
      answer: "Browser mengirim request ke server lokal, server menjalankan kode PHP, lalu hasil akhirnya dikirim sebagai HTML ke browser."
    },
    {
      id: "recall-form",
      type: "Form",
      title: "Name dan POST",
      prompt: "Apa hubungan attribute name di input dengan $_POST?",
      answer: "Nilai attribute name menjadi key di $_POST. Input name=\"email\" dibaca dengan $_POST[\"email\"]."
    },
    {
      id: "recall-array-loop",
      type: "Array",
      title: "Array dan foreach",
      prompt: "Mengapa foreach berguna saat menampilkan daftar data?",
      answer: "foreach mengambil setiap item array satu per satu sehingga kita tidak perlu menulis output manual untuk setiap item."
    },
    {
      id: "recall-security",
      type: "Keamanan",
      title: "Escape output",
      prompt: "Mengapa input pengguna tidak boleh langsung di-echo sebagai HTML?",
      answer: "Input dapat berisi HTML atau script. Output harus di-escape dengan htmlspecialchars agar tampil sebagai teks aman."
    },
    {
      id: "recall-database",
      type: "Database",
      title: "Prepared statement",
      prompt: "Apa manfaat prepared statement saat query memakai input pengguna?",
      answer: "Prepared statement memisahkan perintah SQL dari data input sehingga input tidak mudah mengubah struktur query."
    },
    {
      id: "recall-project",
      type: "Project",
      title: "Buku tamu",
      prompt: "Sebutkan alur sederhana project buku tamu PHP.",
      answer: "Baca JSON, tampilkan form, validasi POST, simpan pesan baru ke JSON, redirect, lalu tampilkan daftar pesan dengan foreach."
    }
  ];

  const debugChallenges = [
    {
      id: "debug-semicolon",
      title: "Titik koma hilang",
      symptom: "Halaman menampilkan Parse error dekat baris echo.",
      code: `<?php
$nama = "Nadia"
echo "Halo, " . $nama;`,
      question: "Bagian mana yang kurang?",
      hint: "Perintah assignment juga perlu diakhiri.",
      explanation: [
        "Baris $nama = \"Nadia\" belum selesai.",
        "PHP menunggu titik koma sebelum lanjut ke echo.",
        "Parse error sering terjadi karena tanda baca hilang.",
        "Tambahkan titik koma di akhir assignment.",
        "Jalankan ulang halaman."
      ],
      solution: `<?php
$nama = "Nadia";
echo "Halo, " . $nama;`
    },
    {
      id: "debug-variable-name",
      title: "Nama variabel tidak sama",
      symptom: "Muncul warning Undefined variable $user.",
      code: `<?php
$nama = "Rafi";
echo "Halo, " . $user;`,
      question: "Mengapa $user tidak dikenal?",
      hint: "Bandingkan nama variabel yang dibuat dan yang dipakai.",
      explanation: [
        "Variabel yang dibuat bernama $nama.",
        "Output memakai $user.",
        "PHP menganggap keduanya variabel berbeda.",
        "Samakan nama variabel.",
        "Biasakan nama variabel konsisten."
      ],
      solution: `<?php
$nama = "Rafi";
echo "Halo, " . $nama;`
    },
    {
      id: "debug-post-name",
      title: "POST kosong",
      symptom: "$_POST[\"nama\"] tidak berisi data.",
      code: `<form method="POST">
  <input id="nama" placeholder="Nama">
  <button>Kirim</button>
</form>

<?php echo $_POST["nama"]; ?>`,
      question: "Attribute apa yang kurang pada input?",
      hint: "id bukan key untuk $_POST.",
      explanation: [
        "Form mengirim input berdasarkan attribute name.",
        "Input hanya punya id, belum punya name.",
        "$_POST[\"nama\"] mencari field name=\"nama\".",
        "Tambahkan name pada input.",
        "Gunakan ?? untuk default saat form belum dikirim."
      ],
      solution: `<form method="POST">
  <input id="nama" name="nama" placeholder="Nama">
  <button>Kirim</button>
</form>

<?php echo $_POST["nama"] ?? ""; ?>`
    },
    {
      id: "debug-htmlspecialchars",
      title: "Output belum aman",
      symptom: "Input <b>Nadia</b> tampil sebagai HTML tebal.",
      code: `<?php
$nama = $_POST["nama"] ?? "";
echo "Halo, " . $nama;`,
      question: "Fungsi apa yang sebaiknya dipakai saat menampilkan input?",
      hint: "Ubah karakter HTML menjadi entity.",
      explanation: [
        "Data pengguna tidak boleh dipercaya langsung.",
        "Jika di-echo mentah, browser bisa menganggapnya HTML.",
        "htmlspecialchars mengubah karakter khusus menjadi teks aman.",
        "Escape dilakukan saat output.",
        "Validasi tetap dilakukan sebelum proses."
      ],
      solution: `<?php
$nama = $_POST["nama"] ?? "";
echo "Halo, " . htmlspecialchars($nama);`
    },
    {
      id: "debug-include-path",
      title: "File include tidak ditemukan",
      symptom: "Warning failed to open stream pada partial header.",
      code: `<?php include "header.php"; ?>`,
      question: "Apa yang perlu dicek?",
      hint: "Path relatif harus sesuai lokasi file.",
      explanation: [
        "PHP mencari header.php relatif dari file yang berjalan.",
        "Jika file berada di partials/header.php, path harus ditulis lengkap.",
        "Huruf besar kecil nama file juga penting di server tertentu.",
        "Gunakan struktur folder yang konsisten.",
        "Perbaiki path include."
      ],
      solution: `<?php include "partials/header.php"; ?>`
    },
    {
      id: "debug-session-start",
      title: "Session terlambat",
      symptom: "Warning session_start(): Session cannot be started after headers have already been sent.",
      code: `<h1>Dashboard</h1>
<?php
session_start();
$_SESSION["login"] = true;`,
      question: "Mengapa session_start harus dipindah?",
      hint: "Session perlu mengirim header sebelum output.",
      explanation: [
        "HTML <h1> sudah menjadi output.",
        "session_start perlu mengatur header HTTP.",
        "Header harus dikirim sebelum output.",
        "Letakkan session_start di baris paling atas.",
        "Pastikan tidak ada spasi sebelum <?php."
      ],
      solution: `<?php
session_start();
$_SESSION["login"] = true;
?>
<h1>Dashboard</h1>`
    },
    {
      id: "debug-json-null",
      title: "JSON terbaca null",
      symptom: "foreach gagal karena data JSON bukan array.",
      code: `<?php
$data = json_decode(file_get_contents("data.json"), true);
foreach ($data as $item) {
    echo $item["judul"];
}`,
      question: "Apa langkah aman sebelum foreach?",
      hint: "Beri fallback array kosong.",
      explanation: [
        "json_decode dapat menghasilkan null saat file kosong atau JSON rusak.",
        "foreach membutuhkan array atau object.",
        "Gunakan fallback ?? [] agar halaman tidak langsung gagal.",
        "Tetap cek isi file JSON saat development.",
        "Tambahkan penanganan error jika perlu."
      ],
      solution: `<?php
$data = json_decode(file_get_contents("data.json"), true) ?? [];
foreach ($data as $item) {
    echo $item["judul"];
}`
    },
    {
      id: "debug-pdo-prepare",
      title: "Query raw dari input",
      symptom: "Pencarian produk menyambung input langsung ke SQL.",
      code: `<?php
$q = $_GET["q"];
$stmt = $pdo->query("SELECT * FROM produk WHERE nama = '$q'");`,
      question: "Bagaimana membuat query ini lebih aman?",
      hint: "Pisahkan SQL dan nilai input.",
      explanation: [
        "Input $q ditempel langsung ke SQL.",
        "Ini membuka risiko SQL injection.",
        "Gunakan prepare dengan placeholder.",
        "Kirim nilai lewat execute.",
        "Hasil query tetap sama, tetapi lebih aman."
      ],
      solution: `<?php
$q = $_GET["q"] ?? "";
$stmt = $pdo->prepare("SELECT * FROM produk WHERE nama = ?");
$stmt->execute([$q]);`
    },
    {
      id: "debug-upload-enctype",
      title: "File upload kosong",
      symptom: "$_FILES[\"foto\"] tidak ada setelah submit.",
      code: `<form method="POST" action="upload.php">
  <input type="file" name="foto">
  <button>Upload</button>
</form>`,
      question: "Attribute form apa yang hilang?",
      hint: "File perlu encoding khusus.",
      explanation: [
        "Form file harus memakai method POST.",
        "Selain itu perlu enctype multipart/form-data.",
        "Tanpa enctype, file tidak dikirim sebagai upload.",
        "Tambahkan attribute di form.",
        "Baru cek $_FILES di PHP."
      ],
      solution: `<form method="POST" action="upload.php" enctype="multipart/form-data">
  <input type="file" name="foto">
  <button>Upload</button>
</form>`
    },
    {
      id: "debug-redirect-output",
      title: "Redirect gagal",
      symptom: "Muncul warning Cannot modify header information.",
      code: `<?php
echo "Data berhasil disimpan";
header("Location: index.php");`,
      question: "Mengapa header Location gagal?",
      hint: "Header harus dikirim sebelum output.",
      explanation: [
        "echo sudah mengirim output ke response.",
        "header mencoba mengubah header setelah output terkirim.",
        "Pindahkan header sebelum output.",
        "Setelah redirect, panggil exit.",
        "Tampilkan pesan lewat session flash jika perlu."
      ],
      solution: `<?php
header("Location: index.php");
exit;`
    }
  ];

  const projects = [
    {
      title: "Form kontak PHP",
      level: "Pemula",
      goal: "Membuat form kontak yang memvalidasi nama, email, pesan, menampilkan feedback, dan siap dipasang di website kecil.",
      example: {
        type: "form",
        title: "Kontak mentor",
        fields: ["Nama", "Email", "Pesan"],
        button: "Kirim pesan"
      },
      features: ["POST", "validasi", "htmlspecialchars", "pesan error", "redirect"],
      steps: ["Buat form HTML", "Baca $_POST", "Validasi field kosong", "Escape output", "Tampilkan feedback", "Cek ulang sebelum deploy"],
      hint: "Mulai dari validasi nama sebelum menambah email dan pesan.",
      extra: "Simpan pesan ke file JSON."
    },
    {
      title: "Buku tamu JSON",
      level: "Pemula +",
      goal: "Menerima pesan pengunjung, menyimpannya ke JSON, menampilkan daftar pesan, dan mengecek file data sebelum deploy.",
      example: {
        type: "article",
        brand: "BukuTamu",
        nav: ["Form", "Pesan"],
        title: "Halo dari teman belajar",
        description: "Pesan tersimpan dan ditampilkan kembali dengan aman.",
        related: "JSON + foreach"
      },
      features: ["file JSON", "json_decode", "json_encode", "foreach", "escape output"],
      steps: ["Buat data/pesan.json", "Buat form POST", "Validasi input", "Simpan array baru", "Render daftar", "Pastikan file JSON valid"],
      hint: "Pastikan file JSON pertama berisi [] agar mudah dibaca.",
      extra: "Tambahkan tanggal otomatis."
    },
    {
      title: "Katalog produk array",
      level: "Pemula",
      goal: "Menampilkan produk dari array PHP ke card HTML yang rapi dan mudah dikembangkan menjadi katalog sederhana.",
      example: {
        type: "gallery",
        title: "Katalog PHP",
        description: "Data produk berasal dari array dan dirender dengan foreach.",
        items: [
          { title: "Buku", label: "Rp45.000" },
          { title: "Kelas", label: "Rp99.000" },
          { title: "Template", label: "Gratis" },
          { title: "Mentoring", label: "Terbatas" }
        ]
      },
      features: ["array associative", "foreach", "format harga", "card HTML", "CSS grid"],
      steps: ["Buat array produk", "Loop dengan foreach", "Tampilkan nama dan harga", "Tambahkan CSS card", "Cek tampilan mobile"],
      hint: "Gunakan number_format untuk harga.",
      extra: "Tambahkan filter kategori sederhana dari $_GET."
    },
    {
      title: "Todo session",
      level: "Pemula +",
      goal: "Membuat todo sederhana yang tersimpan selama session browser aktif dan aman dari input kosong.",
      example: {
        type: "checklist",
        title: "Todo belajar",
        description: "Daftar tugas sementara dengan session.",
        items: ["Baca materi", "Ketik ulang kode", "Debug error"],
        cta: "Tambah tugas"
      },
      features: ["session_start", "$_SESSION", "POST", "array", "hapus item"],
      steps: ["Mulai session", "Simpan todo di $_SESSION", "Tambah dari form", "Render dengan foreach", "Buat tombol hapus", "Cek session_start di baris atas"],
      hint: "Inisialisasi $_SESSION['todos'] dengan array kosong jika belum ada.",
      extra: "Tambahkan status selesai."
    },
    {
      title: "CRUD catatan MySQL",
      level: "Menengah awal",
      goal: "Membuat tambah, lihat, edit, dan hapus catatan memakai PDO dengan query yang siap dipakai di hosting.",
      example: {
        type: "dashboard",
        title: "Catatan PHP",
        subtitle: "PDO CRUD",
        progress: 68,
        stats: [
          { value: "12", label: "catatan" },
          { value: "4", label: "draft" },
          { value: "8", label: "selesai" }
        ],
        tasks: ["Koneksi PDO", "Prepared statement", "Redirect"]
      },
      features: ["PDO", "prepared statement", "INSERT", "UPDATE", "DELETE", "redirect"],
      steps: ["Buat tabel catatan", "Buat koneksi PDO", "Tampilkan data", "Buat proses tambah", "Tambah edit dan hapus", "Pisahkan config database"],
      hint: "Selesaikan Read dan Create sebelum masuk Update dan Delete.",
      extra: "Tambahkan pencarian judul."
    },
    {
      title: "Dashboard progress belajar",
      level: "Menengah awal",
      goal: "Membaca data JSON lalu menampilkan ringkasan progress belajar yang rapi sebagai dashboard kecil.",
      example: {
        type: "dashboard",
        title: "Progress PHP",
        subtitle: "JSON dashboard",
        progress: 82,
        stats: [
          { value: "20", label: "materi" },
          { value: "10", label: "debug" },
          { value: "6", label: "project" }
        ],
        tasks: ["Baca JSON", "Hitung persen", "Render kartu"]
      },
      features: ["JSON", "fungsi", "foreach", "perhitungan", "komponen HTML"],
      steps: ["Siapkan data progress", "Buat fungsi hitung persen", "Render stat card", "Warnai progress bar", "Cek data kosong"],
      hint: "Pisahkan fungsi hitungProgress agar mudah diuji.",
      extra: "Tambahkan badge berdasarkan persentase."
    }
  ];

  const badges = [
    { id: "php-starter", title: "PHP Starter", icon: "bi-compass-fill", check: (state) => state.completedLessons.length >= 1 },
    { id: "syntax-reader", title: "Syntax Reader", icon: "bi-filetype-php", check: (state) => ["sintaks-echo-komentar", "variabel-tipe-data", "string-operator"].every((id) => state.completedLessons.includes(id)) },
    { id: "flow-builder", title: "Flow Builder", icon: "bi-signpost-split", check: (state) => ["kondisi-if-else", "array-dasar", "perulangan-foreach"].every((id) => state.completedLessons.includes(id)) },
    { id: "form-guardian", title: "Form Guardian", icon: "bi-shield-check", check: (state) => ["form-get-post", "validasi-input"].every((id) => state.completedLessons.includes(id)) },
    { id: "data-handler", title: "Data Handler", icon: "bi-database-check", check: (state) => ["file-json", "dasar-mysql-pdo", "crud-sederhana"].every((id) => state.completedLessons.includes(id)) },
    { id: "project-maker", title: "Project Maker", icon: "bi-rocket-takeoff-fill", check: (state) => state.completedLessons.includes("mini-project-php") },
    { id: "php-debugger", title: "PHP Debugger", icon: "bi-bug-fill", check: (state) => state.completedDebug.length >= 5 }
  ];

  const editorDefaults = {
    index: `<?php
include "data.php";

$pageTitle = "Dashboard Belajar PHP";
$target = "Membuat halaman dinamis pertama";
$aktif = true;
?>`,
    data: `<?php
$nama = "Nadia";
$level = "Pemula PHP";
$skills = ["HTML", "CSS", "JavaScript", "PHP"];
$progress = 45;
?>`,
    template: `<section class="profile-card">
  <p class="eyebrow">Belajar PHP</p>
  <h1><?= $pageTitle ?></h1>
  <p>Halo, <?= $nama ?>. Level kamu: <?= $level ?>.</p>

  <?php if ($aktif) : ?>
    <strong><?= $target ?></strong>
  <?php endif; ?>

  <ul>
    <?php foreach ($skills as $skill) : ?>
      <li><?= $skill ?></li>
    <?php endforeach; ?>
  </ul>
</section>`,
    css: `body {
  font-family: Arial, sans-serif;
  background: #f6f0ff;
  color: #1f1b2d;
  padding: 24px;
}

.profile-card {
  background: white;
  border: 1px solid #e7ddff;
  border-radius: 14px;
  max-width: 560px;
  padding: 24px;
}

.eyebrow {
  color: #7c3aed;
  font-weight: 700;
  text-transform: uppercase;
}`
  };

  return {
    lessons,
    quizQuestions,
    recallChallenges,
    debugChallenges,
    projects,
    badges,
    editorDefaults
  };
})();
