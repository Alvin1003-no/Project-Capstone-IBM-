# NgeCost - Aplikasi Manajemen Keuangan Anak Kos
NgeCost adalah aplikasi web manajemen keuangan modern dan responsif yang dirancang khusus untuk membantu mahasiswa dan anak kos mengelola anggaran bulanan, mengalokasikan tabungan secara otomatis, serta mencatat pengeluaran harian secara efisien dan intuitif.

# Deskripsi Project
Mengatur keuangan pribadi merupakan salah satu tantangan utama bagi mahasiswa dan perantau yang tinggal di kos. Banyak anak kos mengalami kesulitan dalam membagi uang bulanan untuk tabungan dan dana darurat, serta sering kehilangan kontrol atas pengeluaran harian mereka.
NgeCost hadir sebagai solusi berbasis web yang simpel namun bertenaga. Dengan sistem kalkulasi otomatis, pengguna cukup memasukkan nominal uang bulanan, dan sistem akan langsung mengalokasikan porsi dana untuk tabungan dan dana darurat secara transparan, lengkap dengan visualisasi data berupa Pie Chart dan pencatatan transaksi harian.

# Fitur Utama
1. Dashboard Keuangan Interaktif
    - Tampilan sapaan personal pengguna.
    - Card Saldo Utama dengan fitur Toggle Show/Hide nominal untuk privasi.
    - Card Sub-Saldo terpisah untuk Tabungan dan Dana Darurat.
    - Daftar ringkasan histori transaksi terbaru.

2. Tambah Uang Bulanan & Alokasi Otomatis
    - Input nominal uang bulanan.
    - Pemotongan dan pengalokasian dana secara otomatis untuk:
        - Makanan: 35%
        - Tabungan: 21.5%
        - Dana Darurat: 10%
        - Lain-Lain: 10%
        - Gaya Hidup: 10%
        - Tagihan: 7.5%
        - Transportasi: 6%
    - Visualisasi alokasi menggunakan Pie Chart interaktif berbasis warna pastel.
    - Otomatis mencatat alokasi tabungan dan dana darurat ke dalam histori transaksi.

3. Histori Pengeluaran Lengkap
    - Filter pengeluaran berbasis periode: Harian, Mingguan, dan Bulanan.
    - Card informasi total nominal pengeluaran yang diperbarui secara dinamis.
    - Rincian daftar transaksi harian yang transparan.

4. Laporan Pengeluaran Harian (Input Manual)
    - Form input dinamis (Nama Pengeluaran, Nominal, Kategori).
    - Fitur + Tambah Laporan untuk menambahkan baris form baru secara serentak.
    - Workflow Custom Modal Pop-Up dengan indikator loading animasi pesawat kertas dan notifikasi sukses penutupan.

5. UI/UX Modern & Responsif
    - Collapsible Sidebar dengan tombol hamburger kustom di pojok kiri atas.
    - Fluid Full-Width Layout yang memanfaatkan ruang layar secara optimal (tanpa area kosong gantung).
    - Bebas dari emoticon/emoji untuk kesan profesional dan bersih.
    - Bebas dari alert() bawaan browser (seluruh notifikasi menggunakan Custom HTML Modal)
