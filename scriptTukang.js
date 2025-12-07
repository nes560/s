/**
 * DASHBOARD CORE LOGIC - HANDYMAN MITRA
 * File ini menangani seluruh fungsionalitas aplikasi multi-halaman:
 * 1. Sesi User (Menampilkan Nama & Cek Login)
 * 2. Manajemen Order (Load Data, Tab, Update Status)
 * 3. Sistem Notifikasi (Real-time Toast & Badge)
 * 4. Logika UI Halaman Akun (handleMenuClick)
 * 5. Logout
 * 6. Simulasi Job Status (Baru Ditambahkan)
 * * NOTE: Aplikasi ini menggunakan navigasi berbasis RELOAD HALAMAN (window.location.href)
 * untuk menghubungkan Akun Tukang.html, Beranda Tukang.html, Orderan.html, dan Notifikasi.html.
 */

// --- KONFIGURASI API & STATE ---
const API_URL = 'http://localhost:3000/api'; // Ganti dengan URL Backend aslimu
let currentTab = 'pending'; 

// --- EVENT LISTENER UTAMA (SAAT LOAD) ---
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. CEK SESI & TAMPILKAN NAMA
    const userSession = JSON.parse(localStorage.getItem('user_session'));
    const namaMitraElement = document.getElementById('nama-mitra');

    if (userSession) {
        // Tampilkan Nama Asli
        if(namaMitraElement) {
            namaMitraElement.innerText = `${userSession.nama_depan} ${userSession.nama_belakang}`;
        }
    } else {
        // Jika tidak login
        if(namaMitraElement) namaMitraElement.innerText = "Budi Santoso"; // Default untuk preview
        // window.location.href = 'login.html'; // Aktifkan ini untuk proteksi halaman
    }

    // 2. LOAD DATA SPESIFIK HALAMAN
    // Hanya jalankan fungsi jika elemen yang diperlukan ada di halaman ini
    if(document.getElementById('order-list')) {
        // Jika di halaman Orderan.html
        loadOrders('pending');
    }
    
    if(document.getElementById('notification-list') || document.getElementById('toast-container')) {
        // Jika di halaman Notifikasi.html atau halaman manapun yang butuh notif
        renderNotifications();
    }
});


// =========================================
// BAGIAN 1: MANAJEMEN ORDER (Hanya untuk Orderan.html)
// =========================================

// Ganti Tab (Pending / Proses / Selesai)
function switchTab(status) {
    currentTab = status;
    
    // Update Style Tombol Tab
    const tabs = ['pending', 'proses', 'selesai'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if(btn) {
            if (t === status) {
                btn.className = 'tab-active py-4 text-sm font-bold text-blue-600 border-b-2 border-blue-600 transition flex-1 text-center';
            } else {
                btn.className = 'tab-inactive py-4 text-sm font-medium text-slate-500 hover:text-slate-700 transition flex-1 text-center';
            }
        }
    });

    // Panggil data baru
    loadOrders(status);
}

// Ambil Data Order dari Server (Fetch dari /api/pesanan)
async function loadOrders(status) {
    const list = document.getElementById('order-list');
    if(!list) return;

    // Loader
    list.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
            <i class="fa-solid fa-circle-notch fa-spin text-3xl text-blue-500 mb-3"></i>
            <p class="text-sm">Sedang memuat data...</p>
        </div>`;

    try {
        console.log('🔄 Loading orders with status:', status);
        // --- FETCH DATA DARI API ---
        const response = await fetch(`${API_URL}/pesanan`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('📡 API Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Data received:', data);
        
        if (!data.success || !data.data) {
            throw new Error('Gagal mengambil data pesanan - invalid response format');
        }

        // Filter berdasarkan status (pending/proses/selesai/ditolak)
        // Case-insensitive comparison untuk handle DB yang mungkin return "Pending" atau "pending"
        let orders = data.data.filter(order => {
            const orderStatus = (order.status || 'pending').toLowerCase();
            return orderStatus === status.toLowerCase();
        });
        
        console.log(`📊 Filtered ${orders.length} orders for status: ${status}`);
        
        list.innerHTML = ''; // Hapus loader

        // Jika Kosong
        if (orders.length === 0) {
            const statusLabel = status === 'pending' ? 'Baru Masuk' : 
                               status === 'proses' ? 'Sedang Proses' :
                               status === 'selesai' ? 'Riwayat' : 'Ditolak';
            
            list.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-100 border-dashed">
                    <div class="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <i class="fa-solid fa-folder-open text-xl opacity-50"></i>
                    </div>
                    <p class="text-sm font-medium">Belum ada orderan "${statusLabel}".</p>
                </div>`;
            return;
        }

        // Update Badge Pending
        if(status === 'pending') {
            const badge = document.getElementById('badge-pending');
            if (badge) {
                // Count total pending orders (case-insensitive)
                const pendingCount = data.data.filter(o => (o.status || 'pending').toLowerCase() === 'pending').length;
                badge.innerText = pendingCount;
                badge.classList.toggle('hidden', pendingCount === 0);
            }
        }

        // Render Kartu
        orders.forEach(order => {
            const buttons = getActionButtons(status, order.id);
            list.innerHTML += createOrderCard(order, buttons);
        });
    } catch (error) {
        console.error('❌ Error loading orders:', error);
        list.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-10 text-red-400 bg-red-50 rounded-2xl border border-red-100">
                <i class="fa-solid fa-circle-exclamation text-2xl mb-2"></i>
                <p class="text-sm font-medium">Gagal memuat data.</p>
                <p class="text-xs mt-2">Error: ${error.message}</p>
            </div>`;
    }
}

// Helper: Dummy Data
function getDummyOrders(status) {
    if(status === 'pending') return [
        { id: 1, nama_user: "Budi Santoso", kategori_jasa: "Listrik", deskripsi_masalah: "Lampu ruang tamu korslet, bau hangus.", alamat: "Jl. Merdeka No. 45", created_at: Date.now() },
        { id: 2, nama_user: "Siti Aminah", kategori_jasa: "Pipa", deskripsi_masalah: "Kran air patah, air muncrat terus.", alamat: "Komp. Griya Indah Blok A2", created_at: Date.now() }
    ];
    if(status === 'proses') return [
        { id: 3, nama_user: "Ahmad Dhani", kategori_jasa: "AC", deskripsi_masalah: "Cuci AC rutin 3 unit.", alamat: "Apartemen Central Park lt 12", created_at: Date.now() }
    ];
    return [
        { id: 4, nama_user: "Dewi Kurnia", kategori_jasa: "Pengecatan", deskripsi_masalah: "Cat ulang kamar tidur.", alamat: "Jl. Anggrek No. 22", created_at: Date.now() }
    ];
}

// Helper: Tombol Aksi
function getActionButtons(status, orderId) {
    if (status === 'pending') {
        return `
            <button onclick="updateStatus(${orderId}, 'proses')" class="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold shadow-blue-200 hover:bg-blue-700 transition">Terima</button>
            <button onclick="updateStatus(${orderId}, 'ditolak')" class="flex-1 border border-red-100 bg-red-50 text-red-500 py-2 rounded-lg text-xs font-bold hover:bg-red-100 transition">Tolak</button>
        `;
    } else if (status === 'proses') {
        return `
            <button onclick="updateStatus(${orderId}, 'selesai')" class="flex-1 bg-green-600 text-white py-2 rounded-lg text-xs font-bold shadow-green-200 hover:bg-green-700 transition">Selesaikan</button>
            <button class="w-10 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 flex items-center justify-center transition"><i class="fa-solid fa-comment"></i></button>
        `;
    } else if (status === 'selesai') {
        return `
            <div class="flex gap-2 w-full">
                <div class="flex-1 text-center text-green-600 text-xs font-bold py-2 bg-green-50 rounded-lg"><i class="fa-solid fa-check"></i> Selesai</div>
                <button onclick="goToPayment(${orderId})" class="flex-1 bg-purple-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-purple-700 transition flex items-center justify-center gap-1"><i class="fa-solid fa-qrcode"></i> Bayar</button>
            </div>
        `;
    } else {
        return `<div class="w-full text-center text-green-600 text-xs font-bold py-2 bg-green-50 rounded-lg"><i class="fa-solid fa-check"></i> Selesai</div>`;
    }
}

// Helper: HTML Kartu
function createOrderCard(order, buttons) {
    const createdDate = order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Tgl tidak diketahui';
    
    // Cek jika foto ada dan susun foto preview
    let fotoHtml = '';
    if (order['Foto masalah'] || order.foto_masalah) {
        const fotoPath = order['Foto masalah'] || order.foto_masalah;
        fotoHtml = `<img src="http://localhost:3000/${fotoPath}" alt="Foto masalah" class="w-full h-32 object-cover rounded-lg mb-3 border border-slate-100">`;
    }
    
    return `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition mb-3">
            <div class="flex justify-between mb-2">
                <span class="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">${order.kategori_jasa || 'Umum'}</span>
                <span class="text-[10px] text-slate-400">${createdDate}</span>
            </div>
            ${fotoHtml}
            <h3 class="font-bold text-slate-800 text-sm">${order.nama_user}</h3>
            <p class="text-xs text-slate-500 mb-3 line-clamp-2">"${order.deskripsi_masalah || 'Tidak ada deskripsi'}"</p>
            <p class="text-xs text-slate-600 mb-3 flex items-center gap-1"><i class="fa-solid fa-location-dot text-red-400"></i> ${order.alamat || 'Alamat tidak ditentukan'}</p>
            <div class="flex gap-2 pt-2 border-t border-slate-50">${buttons}</div>
        </div>
    `;
}

// Update Status Order (Call API & Notifikasi)
async function updateStatus(id, newStatus) {
    const msg = newStatus === 'proses' ? 'Terima pekerjaan ini?' : 'Selesaikan pekerjaan ini?';
    if(!confirm(msg)) return;

    try {
        // Call API untuk update status
        const response = await fetch(`${API_URL}/pesanan/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(newStatus === 'proses' ? "✅ Order Diterima! Notifikasi dikirim." : "✅ Order Selesai!", "SUCCESS");
            
            // Refresh Tab (Pindah tab jika Terima)
            if(newStatus === 'proses') {
                setTimeout(() => switchTab('proses'), 1000);
            } else {
                setTimeout(() => loadOrders(currentTab), 1000);
            }
        } else {
            showToast("❌ Gagal update status: " + result.message, "ERROR");
        }
    } catch (error) {
        console.error('❌ Error updating status:', error);
        showToast("❌ Gagal terhubung ke server", "ERROR");
    }
}


// =========================================
// BAGIAN 2: SISTEM NOTIFIKASI
// =========================================

// Data Notifikasi Dummy
let notificationsData = [
    { id: "1", tipe: "ORDER_BARU", judul: "Order Masuk", pesan: "Service AC di Melati Mas.", is_read: false, timestamp: Date.now() },
    { id: "2", tipe: "INFO", judul: "Tips", pesan: "Jaga performa Anda.", is_read: true, timestamp: Date.now() - 3600000 }
];

function renderNotifications() {
    const container = document.getElementById('notification-list');
    if(!container) return; // Skip jika tidak ada elemen list

    container.innerHTML = '';
    notificationsData.forEach(n => {
        const bg = n.is_read ? 'bg-white' : 'bg-blue-50';
        container.innerHTML += `
            <div class="${bg} p-3 rounded-xl border border-slate-100 mb-2 cursor-pointer hover:shadow-sm" onclick="readNotif('${n.id}')">
                <div class="flex justify-between"><h4 class="text-sm font-bold">${n.judul}</h4><span class="text-[10px] text-slate-400">Baru saja</span></div>
                <p class="text-xs text-slate-500">${n.pesan}</p>
            </div>`;
    });
    
    // Update Badge Sidebar & Mobile
    const badgeSidebar = document.getElementById('sidebar-badge');
    const badgeMobile = document.getElementById('mobile-badge');
    const unread = notificationsData.filter(n => !n.is_read).length;
    
    if(badgeSidebar) {
        badgeSidebar.innerText = unread;
        badgeSidebar.classList.toggle('hidden', unread === 0);
    }
    if(badgeMobile) {
        badgeMobile.classList.toggle('hidden', unread === 0);
    }
}

function readNotif(id) {
    const n = notificationsData.find(x => x.id == id);
    if(n) { n.is_read = true; renderNotifications(); }
}

function markAllAsRead() {
    notificationsData.forEach(n => n.is_read = true);
    renderNotifications();
    showToast("Semua notifikasi ditandai sudah dibaca.", "INFO");
}

function showToast(msg, type) {
    const container = document.getElementById('toast-container');
    if(!container) return;
    
    const div = document.createElement('div');
    let icon = 'fa-circle-info text-blue-500';
    if(type === 'SUCCESS') icon = 'fa-circle-check text-green-500';

    div.className = "toast show";
    div.innerHTML = `<i class="fa-solid ${icon}"></i> <span class="text-sm font-bold text-slate-700">${msg}</span>`;
    container.appendChild(div);

    // Hapus setelah 3 detik
    setTimeout(() => {
        div.classList.remove('show');
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

// =========================================
// BAGIAN 3: LOGIKA HALAMAN AKUN & DASHBOARD SIMULASI
// =========================================

// FUNGSI UNTUK MENGHANDLE KLIK MENU (dipanggil dari onclick di Akun Tukang.html)
function handleMenuClick(menuName) {
    showToast(`Navigasi ke: ${menuName} (Fitur Belum Diimplementasikan)`);
}

// FUNGSI SIMULASI PENYELESAIAN PEKERJAAN DARI DASHBOARD
function finishJobSimulasi() {
    if(confirm('Apakah Anda yakin ingin menyelesaikan pekerjaan Perbaikan Pipa Bocor?')) {
        showToast("Pekerjaan Selesai! Saldo bertambah.", "SUCCESS");
        
        // Simulasi menghilangkan kartu pekerjaan aktif dari DOM
        const jobCard = document.getElementById('active-job-card');
        if (jobCard) {
             jobCard.innerHTML = `
                <div class="p-8 text-center text-slate-500">
                    <i class="fa-solid fa-bed text-4xl text-slate-300 mb-3"></i>
                    <p class="text-sm font-medium">Belum ada pekerjaan yang aktif saat ini.</p>
                </div>
            `;
            jobCard.classList.remove('p-5');
        }
    }
}


// =========================================
// BAGIAN 4: LOGOUT
// =========================================
function logout() {
    if(confirm('Apakah Anda ingin mengakhiri sesi kerja?')) {
        localStorage.removeItem('user_session');
        // Arahkan ke halaman login
        window.location.href = '../login.html';
    }
}

// =========================================
// BAGIAN 5: PAYMENT NAVIGATION
// =========================================
function goToPayment(orderId) {
    // Navigate to payment page with order ID
    window.location.href = `../pembayaran-qris.html?order_id=${orderId}`;
}
