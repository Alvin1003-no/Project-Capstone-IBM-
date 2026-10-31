/**
 * NgeCost – script.js
 * Seluruh logika aplikasi: state management, SPA routing,
 * alokasi otomatis, pie chart SVG, toggle saldo, histori,
 * dynamic form laporan, modal workflow, sidebar collapse.
 *
 * Tidak ada penggunaan alert() / confirm() / prompt() —
 * seluruh notifikasi menggunakan custom modal HTML.
 */

'use strict';

/* ============================================================
   1. STATE MANAGEMENT
   Semua data aplikasi tersimpan di satu objek `state`.
   Perubahan state selalu diikuti pemanggilan render/update UI.
   ============================================================ */
const state = {
  // Saldo
  saldoUtama:    1_250_000,
  saldoTabungan:   430_000,
  saldoDarurat:    200_000,

  // Visibility toggle: false = tersembunyi (default)
  showSaldoUtama:    false,
  showSaldoTabungan: false,
  showSaldoDarurat:  false,

  // Halaman SPA yang aktif saat ini
  activePage: 'dashboard',

  // Filter histori yang aktif
  activeFilter: 'harian',

  // State sidebar desktop: true = expanded, false = collapsed
  sidebarExpanded: true,

  // Semua transaksi: { id, judul, kategori, nominal, tanggal, tipe }
  // tipe: 'pengeluaran' | 'alokasi-tabungan' | 'alokasi-darurat'
  transaksi: [
    {
      id: 1,
      judul: 'Alokasi Tabungan Bulanan',
      kategori: 'tabungan',
      nominal: 322_500,
      tanggal: new Date(2026, 9, 1),
      tipe: 'alokasi-tabungan',
    },
    {
      id: 2,
      judul: 'Alokasi Dana Darurat Bulanan',
      kategori: 'darurat',
      nominal: 150_000,
      tanggal: new Date(2026, 9, 1),
      tipe: 'alokasi-darurat',
    },
    {
      id: 3,
      judul: 'Makan Siang Warteg',
      kategori: 'makanan',
      nominal: 18_000,
      tanggal: new Date(2026, 9, 28),
      tipe: 'pengeluaran',
    },
    {
      id: 4,
      judul: 'Grab ke Kampus',
      kategori: 'transportasi',
      nominal: 12_000,
      tanggal: new Date(2026, 9, 28),
      tipe: 'pengeluaran',
    },
    {
      id: 5,
      judul: 'Langganan Streaming Musik',
      kategori: 'gaya-hidup',
      nominal: 29_900,
      tanggal: new Date(2026, 9, 27),
      tipe: 'pengeluaran',
    },
    {
      id: 6,
      judul: 'Bayar Listrik Kos',
      kategori: 'tagihan',
      nominal: 85_000,
      tanggal: new Date(2026, 9, 25),
      tipe: 'pengeluaran',
    },
    {
      id: 7,
      judul: 'Beli Perlengkapan Mandi',
      kategori: 'lain-lain',
      nominal: 35_000,
      tanggal: new Date(2026, 9, 24),
      tipe: 'pengeluaran',
    },
  ],

  // ID counter untuk transaksi baru
  nextId: 8,
};

/* ============================================================
   2. HELPERS
   ============================================================ */

/** Format angka ke format Rupiah: "Rp 1.500.000" */
function formatRupiah(angka) {
  return 'Rp ' + Math.abs(angka).toLocaleString('id-ID');
}

/** Kembalikan tanggal hari ini tanpa jam */
function hariIni() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Kembalikan tanggal awal minggu ini (Senin) */
function awalMingguIni() {
  const d = hariIni();
  const day = d.getDay(); // 0=Minggu
  const diff = (day === 0) ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Kembalikan tanggal 1 bulan ini */
function awalBulanIni() {
  const d = hariIni();
  d.setDate(1);
  return d;
}

/**
 * Filter transaksi berdasarkan periode.
 * @param {'harian'|'mingguan'|'bulanan'} periode
 */
function filterTransaksiByPeriode(periode) {
  const now = hariIni();
  return state.transaksi.filter(t => {
    const tgl = new Date(t.tanggal);
    tgl.setHours(0, 0, 0, 0);
    if (periode === 'harian') {
      return tgl.toDateString() === now.toDateString();
    } else if (periode === 'mingguan') {
      return tgl >= awalMingguIni() && tgl <= now;
    } else {
      return tgl >= awalBulanIni() && tgl <= now;
    }
  });
}

/** Total nominal dari array transaksi */
function totalNominal(list) {
  return list.reduce((acc, t) => acc + t.nominal, 0);
}

/** Nama kategori → label ramah */
const KATEGORI_LABEL = {
  'makanan':      'Makanan',
  'tabungan':     'Tabungan',
  'darurat':      'Dana Darurat',
  'gaya-hidup':   'Gaya Hidup',
  'tagihan':      'Tagihan',
  'transportasi': 'Transportasi',
  'lain-lain':    'Lain-Lain',
};

/** Peta judul halaman untuk top bar */
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  tambah:    'Uang Bulanan',
  histori:   'Histori Pengeluaran',
  laporan:   'Laporan Harian',
};

/** Format tanggal ke "28 Okt 2026" */
function formatTanggal(d) {
  const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const dt = new Date(d);
  return `${dt.getDate()} ${bulan[dt.getMonth()]} ${dt.getFullYear()}`;
}

/* ============================================================
   3. PIE CHART (SVG)
   Menggambar pie chart donut sederhana dari 7 kategori alokasi.
   ============================================================ */

/**
 * Konfigurasi 7 kategori alokasi: persentase & warna
 */
const ALOKASI_CONFIG = [
  { key: 'makanan',      label: 'Makanan',      persen: 35,   warna: '#8CBF26' },
  { key: 'tabungan',     label: 'Tabungan',      persen: 21.5, warna: '#3B7A57' },
  { key: 'darurat',      label: 'Dana Darurat',  persen: 10,   warna: '#FFA042' },
  { key: 'lain-lain',    label: 'Lain-Lain',     persen: 10,   warna: '#6B8E23' },
  { key: 'gaya-hidup',   label: 'Gaya Hidup',    persen: 10,   warna: '#A3E635' },
  { key: 'tagihan',      label: 'Tagihan',       persen: 7.5,  warna: '#F3A760' },
  { key: 'transportasi', label: 'Transportasi',  persen: 6,    warna: '#FDE047' },
];

/**
 * Menggambar pie chart ke elemen SVG #pieChart
 * @param {number} totalBulanan – total uang bulanan yang diinput
 */
function gambarPieChart(totalBulanan) {
  const svg    = document.getElementById('pieChart');
  const legend = document.getElementById('pieLegend');
  svg.innerHTML    = '';
  legend.innerHTML = '';

  const cx = 110, cy = 110, r = 90;
  let startAngle = -Math.PI / 2; // mulai dari atas (12 o'clock)

  ALOKASI_CONFIG.forEach(item => {
    const fraksi   = item.persen / 100;
    const endAngle = startAngle + fraksi * 2 * Math.PI;
    const nominal  = Math.round(totalBulanan * fraksi);

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d',
      `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
    );
    path.setAttribute('fill', item.warna);
    path.setAttribute('stroke', '#fff');
    path.setAttribute('stroke-width', '2');
    path.style.cursor = 'pointer';

    // Hover: highlight segmen
    path.addEventListener('mouseenter', function (e) {
      this.style.filter = 'brightness(1.12)';
      showPieTooltip(e, `${item.label} – ${item.persen}%`, formatRupiah(nominal));
    });
    path.addEventListener('mousemove', movePieTooltip);
    path.addEventListener('mouseleave', function () {
      this.style.filter = '';
      hidePieTooltip();
    });

    svg.appendChild(path);
    startAngle = endAngle;

    // Legend item
    const legendItem = document.createElement('div');
    legendItem.className = 'flex items-center gap-2';
    legendItem.innerHTML = `
      <span class="alokasi-dot" style="background:${item.warna}"></span>
      <span class="text-[#0A2C1B] font-semibold">${item.label}</span>
      <span class="text-gray-400 ml-auto">${formatRupiah(nominal)}</span>
    `;
    legend.appendChild(legendItem);
  });

  // Lubang tengah (donut)
  const hole = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  hole.setAttribute('cx', cx);
  hole.setAttribute('cy', cy);
  hole.setAttribute('r', 40);
  hole.setAttribute('fill', '#fff');
  svg.appendChild(hole);

  // Teks total di tengah
  const teksLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  teksLabel.setAttribute('x', cx);
  teksLabel.setAttribute('y', cy - 5);
  teksLabel.setAttribute('text-anchor', 'middle');
  teksLabel.setAttribute('font-size', '9');
  teksLabel.setAttribute('fill', '#57606a');
  teksLabel.textContent = 'Total';
  svg.appendChild(teksLabel);

  const teksNominal = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  teksNominal.setAttribute('x', cx);
  teksNominal.setAttribute('y', cy + 10);
  teksNominal.setAttribute('text-anchor', 'middle');
  teksNominal.setAttribute('font-size', '9');
  teksNominal.setAttribute('font-weight', '700');
  teksNominal.setAttribute('fill', '#0A2C1B');
  teksNominal.textContent = formatRupiah(totalBulanan);
  svg.appendChild(teksNominal);
}

/** Tooltip elemen untuk pie chart */
let tooltipEl = null;

function getOrCreateTooltip() {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'pieTooltip';
    document.body.appendChild(tooltipEl);
  }
  return tooltipEl;
}

function showPieTooltip(e, line1, line2) {
  const el = getOrCreateTooltip();
  el.innerHTML = `<span>${line1}</span><br><span>${line2}</span>`;
  el.classList.add('visible');
  movePieTooltip(e);
}

function movePieTooltip(e) {
  const el = getOrCreateTooltip();
  el.style.left = (e.clientX + 14) + 'px';
  el.style.top  = (e.clientY - 12) + 'px';
}

function hidePieTooltip() {
  getOrCreateTooltip().classList.remove('visible');
}

/* ============================================================
   4. CUSTOM MODAL SYSTEM (pengganti alert/confirm browser)

   Dua jenis modal:
   a) infoModal  – untuk pesan error/info (input tidak valid, saldo kurang)
   b) alokasiModal – sukses konfirmasi alokasi uang bulanan
   ============================================================ */

/**
 * Tampilkan info/error modal kustom.
 * @param {'error'|'info'} tipe
 * @param {string} judul
 * @param {string} pesan
 * @param {Function|null} onClose – callback opsional saat modal ditutup
 */
function tampilInfoModal(tipe, judul, pesan, onClose = null) {
  const overlay  = document.getElementById('infoModalOverlay');
  const iconEl   = document.getElementById('infoModalIcon');
  const titleEl  = document.getElementById('infoModalTitle');
  const bodyEl   = document.getElementById('infoModalBody');
  const okBtn    = document.getElementById('infoModalOkBtn');
  const closeBtn = document.getElementById('infoModalCloseBtn');

  // Ikon: error = segitiga seru, info = lingkaran i
  if (tipe === 'error') {
    iconEl.className = 'w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4';
    iconEl.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>`;
  } else {
    iconEl.className = 'w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4';
    iconEl.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>`;
  }

  titleEl.textContent = judul;
  bodyEl.textContent  = pesan;

  // Rebuild callback untuk OK & close
  const handler = () => {
    overlay.classList.add('hidden');
    if (typeof onClose === 'function') onClose();
  };

  // Clone tombol untuk menghapus listener lama
  const newOkBtn    = okBtn.cloneNode(true);
  const newCloseBtn = closeBtn.cloneNode(true);
  okBtn.replaceWith(newOkBtn);
  closeBtn.replaceWith(newCloseBtn);

  document.getElementById('infoModalOkBtn').addEventListener('click', handler);
  document.getElementById('infoModalCloseBtn').addEventListener('click', handler);

  overlay.classList.remove('hidden');
}

/**
 * Tampilkan modal konfirmasi sukses alokasi uang bulanan.
 * @param {number} nominal     – total uang masuk
 * @param {number} tabungan    – alokasi tabungan
 * @param {number} darurat     – alokasi darurat
 * @param {number} sisaPakai   – sisa yang masuk ke saldo pakai
 * @param {Function} onClose   – callback saat tombol diklik
 */
function tampilAlokasiModal(nominal, tabungan, darurat, sisaPakai, onClose) {
  const overlay   = document.getElementById('alokasiModalOverlay');
  const detailEl  = document.getElementById('alokasiModalDetail');
  const okBtn     = document.getElementById('alokasiModalOkBtn');

  detailEl.innerHTML = `
    <div class="flex justify-between">
      <span class="text-gray-500">Uang masuk</span>
      <span class="font-semibold text-[#0A2C1B]">${formatRupiah(nominal)}</span>
    </div>
    <div class="flex justify-between">
      <span class="text-gray-500">Tabungan (21.5%)</span>
      <span class="font-semibold text-[#3B7A57]">${formatRupiah(tabungan)}</span>
    </div>
    <div class="flex justify-between">
      <span class="text-gray-500">Dana Darurat (10%)</span>
      <span class="font-semibold text-[#FFA042]">${formatRupiah(darurat)}</span>
    </div>
    <div class="border-t border-gray-200 pt-2 flex justify-between">
      <span class="font-semibold text-[#0A2C1B]">Sisa Saldo Pakai</span>
      <span class="font-bold text-[#0A2C1B]">${formatRupiah(sisaPakai)}</span>
    </div>
  `;

  const newOkBtn = okBtn.cloneNode(true);
  okBtn.replaceWith(newOkBtn);
  document.getElementById('alokasiModalOkBtn').addEventListener('click', () => {
    overlay.classList.add('hidden');
    if (typeof onClose === 'function') onClose();
  });

  overlay.classList.remove('hidden');
}

/* ============================================================
   5. RENDER FUNCTIONS – memperbarui UI dari state
   ============================================================ */

/** Render semua bagian Dashboard */
function renderDashboard() {
  renderSaldoUtama();
  renderSubSaldo();
  renderHistoriDashboard();
}

/** Perbarui tampilan Saldo Utama */
function renderSaldoUtama() {
  const el = document.getElementById('saldoUtamaDisplay');
  el.textContent = state.showSaldoUtama
    ? formatRupiah(state.saldoUtama)
    : 'Rp ••••••••';
}

/** Perbarui tampilan Sub Saldo */
function renderSubSaldo() {
  const elTab = document.getElementById('saldoTabunganDisplay');
  const elDar = document.getElementById('saldoDaruratDisplay');

  elTab.textContent = state.showSaldoTabungan
    ? formatRupiah(state.saldoTabungan)
    : 'Rp ••••••';

  elDar.textContent = state.showSaldoDarurat
    ? formatRupiah(state.saldoDarurat)
    : 'Rp ••••••';
}

/** Render 5 transaksi terbaru di Dashboard */
function renderHistoriDashboard() {
  const container = document.getElementById('historiDashboard');
  const sorted    = [...state.transaksi].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  const tampil    = sorted.slice(0, 5);

  container.innerHTML = tampil.length
    ? tampil.map(renderTransaksiItem).join('')
    : '<p class="text-sm text-gray-400 text-center py-4">Belum ada transaksi.</p>';
}

/** Render satu baris transaksi sebagai HTML string */
function renderTransaksiItem(t) {
  const badge    = `badge-${t.kategori}`;
  const label    = KATEGORI_LABEL[t.kategori] || t.kategori;
  const isAlokasi = t.tipe === 'alokasi-tabungan' || t.tipe === 'alokasi-darurat';
  return `
    <div class="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition">
      <div class="flex flex-col gap-0.5 min-w-0">
        <p class="text-sm font-semibold text-[#0A2C1B] truncate">${t.judul}</p>
        <div class="flex items-center gap-2 flex-wrap">
          <span class="badge ${badge}">${label}</span>
          <span class="text-xs text-gray-400">${formatTanggal(t.tanggal)}</span>
        </div>
      </div>
      <p class="text-sm font-bold ml-3 flex-shrink-0 ${isAlokasi ? 'text-[#3B7A57]' : 'text-red-500'}">
        ${isAlokasi ? '+' : '-'}${formatRupiah(t.nominal)}
      </p>
    </div>`;
}

/** Render halaman Histori sesuai filter aktif */
function renderHistori() {
  const filter  = state.activeFilter;
  const list    = filterTransaksiByPeriode(filter);
  const sorted  = [...list].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  const total   = totalNominal(list.filter(t => t.tipe === 'pengeluaran'));

  const labelMap = {
    harian:   'Pengeluaran Hari Ini',
    mingguan: 'Pengeluaran Minggu Ini',
    bulanan:  'Pengeluaran Bulan Ini',
  };
  document.getElementById('historiInfoLabel').textContent   = labelMap[filter];
  document.getElementById('historiInfoNominal').textContent = formatRupiah(total);

  const container = document.getElementById('historiList');
  container.innerHTML = sorted.length
    ? sorted.map(renderTransaksiItem).join('')
    : '<p class="text-sm text-gray-400 text-center py-6">Tidak ada transaksi di periode ini.</p>';
}

/* ============================================================
   6. SPA NAVIGATION
   ============================================================ */

/**
 * Pindah ke halaman SPA tertentu.
 * @param {string} menuId – 'dashboard' | 'tambah' | 'histori' | 'laporan'
 */
function navigateTo(menuId) {
  // Sembunyikan semua section
  document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));

  // Tampilkan section yang dituju
  const target = document.getElementById(`page-${menuId}`);
  if (target) target.classList.add('active');

  // Perbarui state
  state.activePage = menuId;

  // Perbarui nav active state di sidebar
  document.querySelectorAll('[data-menu]').forEach(btn => {
    btn.classList.toggle('nav-active', btn.dataset.menu === menuId);
  });

  // Perbarui judul di top bar
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = PAGE_TITLES[menuId] || menuId;

  // Tutup mobile drawer setelah navigasi
  closeSidebarMobile();

  // Trigger render untuk halaman tertentu
  if (menuId === 'dashboard') renderDashboard();
  if (menuId === 'histori')   renderHistori();
  if (menuId === 'laporan')   renderLaporanForms();
}

/* ============================================================
   7. SIDEBAR COLLAPSE / EXPAND (Desktop) + MOBILE DRAWER
   ============================================================ */

/**
 * Toggle sidebar desktop: expanded <-> collapsed.
 * Di desktop sidebar bersifat in-flow (bukan fixed), jadi mainWrapper
 * otomatis melebar/menyempit karena flex layout.
 */
function toggleSidebarDesktop() {
  const sidebar = document.getElementById('sidebar');
  state.sidebarExpanded = !state.sidebarExpanded;

  if (state.sidebarExpanded) {
    sidebar.classList.remove('sidebar-collapsed');
  } else {
    sidebar.classList.add('sidebar-collapsed');
  }
}

/** Buka sidebar di mobile (slide-in dari kiri) */
function openSidebarMobile() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.add('mobile-open');
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // cegah scroll background
}

/** Tutup sidebar di mobile */
function closeSidebarMobile() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.remove('mobile-open');
  overlay.classList.add('hidden');
  document.body.style.overflow = '';
}

/**
 * Tombol hamburger di top bar:
 * - Mobile  → buka/tutup sidebar sebagai drawer
 * - Desktop → toggle collapse/expand sidebar
 */
function handleHamburgerClick() {
  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    const sidebar = document.getElementById('sidebar');
    const isOpen  = sidebar.classList.contains('mobile-open');
    isOpen ? closeSidebarMobile() : openSidebarMobile();
  } else {
    toggleSidebarDesktop();
  }
}

function initSidebar() {
  // Satu-satunya tombol burger: di top bar (hamburger)
  document.getElementById('hamburgerBtn').addEventListener('click', handleHamburgerClick);

  // Overlay mobile → tutup sidebar
  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebarMobile);
}

/* ============================================================
   8. TOGGLE SALDO VISIBILITY
   ============================================================ */

function initToggleSaldo() {
  // Saldo Utama
  document.getElementById('toggleSaldoUtama').addEventListener('click', () => {
    state.showSaldoUtama = !state.showSaldoUtama;
    renderSaldoUtama();
  });

  // Sub-saldo (Tabungan & Darurat)
  document.querySelectorAll('.toggle-sub').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target === 'saldoTabunganDisplay') {
        state.showSaldoTabungan = !state.showSaldoTabungan;
      } else if (target === 'saldoDaruratDisplay') {
        state.showSaldoDarurat = !state.showSaldoDarurat;
      }
      renderSubSaldo();
    });
  });
}

/* ============================================================
   9. MENU 2 – TAMBAH UANG BULANAN & ALOKASI OTOMATIS
   ============================================================ */

/** Nilai alokasi sementara sebelum dikonfirmasi */
let pendingAlokasi = null;

function initTambahUangBulanan() {
  document.getElementById('btnHitung').addEventListener('click', handleHitungAlokasi);
  document.getElementById('inputUangBulanan').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleHitungAlokasi();
  });
  document.getElementById('btnKonfirmasiAlokasi').addEventListener('click', handleKonfirmasiAlokasi);
}

/**
 * Menghitung alokasi dari input nominal bulanan dan
 * menampilkan pie chart + kartu rincian.
 * Validasi input menggunakan custom info modal, bukan alert().
 */
function handleHitungAlokasi() {
  const rawVal  = document.getElementById('inputUangBulanan').value;
  const nominal = parseInt(rawVal, 10);

  if (!nominal || nominal <= 0) {
    tampilInfoModal('error', 'Input Tidak Valid', 'Masukkan nominal uang bulanan yang valid (lebih dari 0).');
    return;
  }

  pendingAlokasi = { nominal };

  // Gambar pie chart
  gambarPieChart(nominal);

  // Render alokasi cards
  const cardsEl = document.getElementById('alokasiCards');
  cardsEl.innerHTML = ALOKASI_CONFIG.map(item => {
    const jumlah = Math.round(nominal * item.persen / 100);
    return `
      <div class="alokasi-card">
        <div class="flex items-center gap-2 mb-1">
          <span class="alokasi-dot" style="background:${item.warna}"></span>
          <p class="text-xs font-semibold text-gray-500">${item.label}</p>
          <span class="ml-auto text-xs font-semibold text-gray-400">${item.persen}%</span>
        </div>
        <p class="text-base font-bold text-[#0A2C1B]">${formatRupiah(jumlah)}</p>
      </div>`;
  }).join('');

  document.getElementById('hasilAlokasi').classList.remove('hidden');
  document.getElementById('hasilAlokasi').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Konfirmasi alokasi:
 * - Tambahkan nominal ke saldo utama (sisa setelah tabungan & darurat)
 * - Potong & simpan tabungan (21.5%) dan darurat (10%)
 * - Catat ke histori transaksi
 * - Tampilkan custom modal sukses (bukan alert)
 */
function handleKonfirmasiAlokasi() {
  if (!pendingAlokasi) return;

  const nominal    = pendingAlokasi.nominal;
  const now        = new Date();
  const tabungan   = Math.round(nominal * 0.215);
  const darurat    = Math.round(nominal * 0.10);
  const sisaPakai  = nominal - tabungan - darurat;

  // Perbarui saldo
  state.saldoUtama    += sisaPakai;
  state.saldoTabungan += tabungan;
  state.saldoDarurat  += darurat;

  // Catat alokasi ke histori
  state.transaksi.push({
    id: state.nextId++,
    judul: 'Alokasi Tabungan Bulanan',
    kategori: 'tabungan',
    nominal: tabungan,
    tanggal: now,
    tipe: 'alokasi-tabungan',
  });
  state.transaksi.push({
    id: state.nextId++,
    judul: 'Alokasi Dana Darurat Bulanan',
    kategori: 'darurat',
    nominal: darurat,
    tanggal: now,
    tipe: 'alokasi-darurat',
  });

  // Reset form & sembunyikan hasil alokasi
  document.getElementById('inputUangBulanan').value = '';
  document.getElementById('hasilAlokasi').classList.add('hidden');
  pendingAlokasi = null;

  // Perbarui dashboard di background
  renderDashboard();

  // Tampilkan custom modal sukses, lalu pindah ke dashboard
  tampilAlokasiModal(nominal, tabungan, darurat, sisaPakai, () => {
    navigateTo('dashboard');
  });
}

/* ============================================================
   10. MENU 3 – HISTORI FILTER TABS
   ============================================================ */

function initHistoriTabs() {
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('filter-active'));
      btn.classList.add('filter-active');
      state.activeFilter = btn.dataset.filter;
      renderHistori();
    });
  });
}

/* ============================================================
   11. MENU 4 – LAPORAN PENGELUARAN MANUAL & DYNAMIC FORMS
   ============================================================ */

/** Daftar kategori untuk dropdown laporan (tanpa tabungan & darurat) */
const KATEGORI_LAPORAN = [
  { value: 'makanan',       label: 'Makanan' },
  { value: 'gaya-hidup',    label: 'Gaya Hidup' },
  { value: 'transportasi',  label: 'Transportasi' },
  { value: 'tagihan',       label: 'Tagihan' },
  { value: 'lain-lain',     label: 'Lain-Lain' },
];

/** Counter unik untuk ID form laporan */
let formCounter = 0;

/**
 * Render ulang form container laporan.
 * Dipanggil setiap kali masuk ke halaman laporan.
 */
function renderLaporanForms() {
  formCounter = 0;
  const container = document.getElementById('laporanFormContainer');
  container.innerHTML = '';
  tambahFormLaporan(); // mulai dengan satu form
}

/**
 * Buat satu form laporan (card dengan 3 field input)
 * dan tambahkan secara dinamis ke dalam container.
 */
function tambahFormLaporan() {
  formCounter++;
  const id        = formCounter;
  const container = document.getElementById('laporanFormContainer');

  const card = document.createElement('div');
  card.className   = 'laporan-form-card';
  card.dataset.formId = id;

  // Tombol hapus hanya muncul untuk form ke-2 ke atas
  const removeBtn = id > 1
    ? `<button type="button" class="btn-remove-form" data-remove="${id}" title="Hapus form ini">
         <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
           <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
         </svg>
       </button>`
    : '';

  card.innerHTML = `
    ${removeBtn}
    <p class="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">Pengeluaran #${id}</p>
    <div class="flex flex-col gap-3">
      <div>
        <label class="block text-xs font-semibold text-[#0A2C1B] mb-1">Nama Pengeluaran</label>
        <input type="text" data-field="judul" data-form="${id}"
          placeholder="Contoh: Makan Siang"
          class="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ACE430] text-sm transition"/>
      </div>
      <div>
        <label class="block text-xs font-semibold text-[#0A2C1B] mb-1">Nominal (Rp)</label>
        <input type="number" min="0" data-field="nominal" data-form="${id}"
          placeholder="25000"
          class="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ACE430] text-sm transition"/>
      </div>
      <div>
        <label class="block text-xs font-semibold text-[#0A2C1B] mb-1">Kategori</label>
        <select data-field="kategori" data-form="${id}"
          class="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ACE430] text-sm bg-white transition">
          ${KATEGORI_LAPORAN.map(k => `<option value="${k.value}">${k.label}</option>`).join('')}
        </select>
      </div>
    </div>
  `;

  container.appendChild(card);

  // Pasang listener tombol hapus form
  const rmBtn = card.querySelector('.btn-remove-form');
  if (rmBtn) {
    rmBtn.addEventListener('click', () => card.remove());
  }
}

/**
 * Kumpulkan data dari semua form laporan yang ada.
 * Kembalikan array pengeluaran atau null jika validasi gagal.
 * Validasi menggunakan custom info modal, bukan alert().
 */
function kumpulkanDataLaporan() {
  const cards = document.querySelectorAll('#laporanFormContainer .laporan-form-card');
  const hasil = [];

  for (const card of cards) {
    const formId   = card.dataset.formId;
    const judul    = card.querySelector(`[data-field="judul"][data-form="${formId}"]`).value.trim();
    const nominal  = parseInt(card.querySelector(`[data-field="nominal"][data-form="${formId}"]`).value, 10);
    const kategori = card.querySelector(`[data-field="kategori"][data-form="${formId}"]`).value;

    if (!judul) {
      tampilInfoModal('error', 'Form Tidak Lengkap', `Pengeluaran #${formId}: Nama pengeluaran tidak boleh kosong.`);
      return null;
    }
    if (!nominal || nominal <= 0) {
      tampilInfoModal('error', 'Nominal Tidak Valid', `Pengeluaran #${formId}: Nominal harus lebih dari 0.`);
      return null;
    }

    hasil.push({ judul, nominal, kategori });
  }

  return hasil;
}

function initLaporan() {
  document.getElementById('btnTambahLaporan').addEventListener('click', () => {
    tambahFormLaporan();
    const cards = document.querySelectorAll('.laporan-form-card');
    cards[cards.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  document.getElementById('btnSimpanLaporan').addEventListener('click', handleSimpanLaporan);
}

/**
 * Proses simpan laporan manual:
 * 1. Validasi & kumpulkan data form (gagal → custom modal error)
 * 2. Cek saldo cukup (kurang → custom modal error)
 * 3. Tampilkan modal fase 1 (loading + animasi pesawat)
 * 4. Setelah 1.5–2 detik → simpan ke state → tampilkan modal fase 2 (sukses)
 */
function handleSimpanLaporan() {
  const data = kumpulkanDataLaporan();
  if (!data || data.length === 0) return;

  // Cek saldo
  const totalPengeluaran = data.reduce((acc, d) => acc + d.nominal, 0);
  if (totalPengeluaran > state.saldoUtama) {
    tampilInfoModal(
      'error',
      'Saldo Tidak Mencukupi',
      `Total pengeluaran: ${formatRupiah(totalPengeluaran)}\nSaldo saat ini: ${formatRupiah(state.saldoUtama)}`
    );
    return;
  }

  // Tampilkan modal fase 1 (loading)
  bukaModalLaporan('loading');

  // Simulasi proses 1.5–2 detik
  const delay = 1500 + Math.random() * 500;
  setTimeout(() => {
    const now = new Date();
    data.forEach(item => {
      state.transaksi.push({
        id: state.nextId++,
        judul: item.judul,
        kategori: item.kategori,
        nominal: item.nominal,
        tanggal: now,
        tipe: 'pengeluaran',
      });
      state.saldoUtama -= item.nominal;
    });

    renderDashboard();
    bukaModalLaporan('sukses');
  }, delay);
}

/* ============================================================
   12. MODAL LAPORAN WORKFLOW (loading → sukses)
   ============================================================ */

function bukaModalLaporan(fase) {
  const overlay = document.getElementById('modalOverlay');
  const phase1  = document.getElementById('modalPhase1');
  const phase2  = document.getElementById('modalPhase2');

  overlay.classList.remove('hidden');

  if (fase === 'loading') {
    phase1.classList.remove('hidden');
    phase2.classList.add('hidden');
  } else if (fase === 'sukses') {
    phase1.classList.add('hidden');
    phase2.classList.remove('hidden');
  }
}

function tutupModalLaporan() {
  document.getElementById('modalOverlay').classList.add('hidden');
  renderLaporanForms(); // reset form setelah berhasil
}

function initModalLaporan() {
  document.getElementById('modalCloseBtn').addEventListener('click', tutupModalLaporan);

  // Klik overlay = tutup hanya saat fase sukses
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) {
      if (!document.getElementById('modalPhase2').classList.contains('hidden')) {
        tutupModalLaporan();
      }
    }
  });
}

/* ============================================================
   13. INIT – Pasang semua event listener & render awal
   ============================================================ */

function init() {
  // Pasang event listener navigasi untuk semua tombol dengan data-menu
  // (mencakup nav sidebar, nav-trigger "Lihat Semua", dan tombol inline lainnya)
  document.querySelectorAll('[data-menu]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.menu));
  });

  // Inisialisasi semua modul
  initSidebar();
  initToggleSaldo();
  initTambahUangBulanan();
  initHistoriTabs();
  initLaporan();
  initModalLaporan();

  // Render halaman awal
  renderDashboard();
}

// Mulai saat DOM siap
document.addEventListener('DOMContentLoaded', init);
