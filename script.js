const API_URL = 'http://localhost:3000/api';

// --- FUNGSI REGISTER ---
async function handleRegister(event) {
    event.preventDefault(); // Mencegah reload halaman

    // Ambil value dari input berdasarkan ID di HTML
    const namaDepan = document.getElementById('nama_depan').value;
    const namaBelakang = document.getElementById('nama_belakang').value;
    const jenisKelamin = document.getElementById('jenis_kelamin').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value; // Password wajib ada
    const alamat = document.getElementById('alamat').value;
    
    // Ambil tipe pengguna (pelanggan atau tukang)
    const tipePengguna = document.querySelector('input[name="tipe_pengguna"]:checked').value;
    // collect keahlian if user is tukang
    let keahlian = [];
    if (tipePengguna === 'tukang') {
        document.querySelectorAll('input[name="keahlian"]:checked').forEach(cb => keahlian.push(cb.value));
    }

    const data = {
        nama_depan: namaDepan,
        nama_belakang: namaBelakang,
        jenis_kelamin: jenisKelamin,
        email: email,
        password: password,
        alamat: alamat,
        tipe_pengguna: tipePengguna,  // Tambahkan tipe pengguna
        keahlian: keahlian
    };

    // Jika mendaftar sebagai tukang, ambil keahlian yang dipilih
    if (tipePengguna === 'tukang') {
        const checked = Array.from(document.querySelectorAll('input[name="keahlian"]:checked'));
        const keahlian = checked.map(c => c.value);
        data.keahlian = keahlian;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            alert('✅ Registrasi Berhasil! Silakan Login.');
            // Redirect berdasarkan tipe pengguna
            if (tipePengguna === 'tukang') {
                // Simpan data tukang di localStorage juga untuk ditampilkan di Beranda
                try {
                    const tukang = {
                        id: result.insertId || Date.now(),
                        nama_depan: namaDepan,
                        nama_belakang: namaBelakang,
                        email: email,
                        alamat: alamat,
                        keahlian: data.keahlian || []
                    };
                    const existing = JSON.parse(localStorage.getItem('tukangs') || '[]');
                    existing.push(tukang);
                    localStorage.setItem('tukangs', JSON.stringify(existing));
                } catch (e) { console.warn('Local save tukang failed', e); }

                window.location.href = 'BerandaTukang.html'; // Arahkan ke folder Tukang
            } else if (tipePengguna === 'pelanggan') {
                window.location.href = 'login.html'; // Redirect ke login untuk pelanggan
            }
        } else {
            alert('❌ Gagal: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Gagal terhubung ke server database.');
    }
}

// Helper: get tukangs from localStorage
function getTukangs() {
    try {
        return JSON.parse(localStorage.getItem('tukangs') || '[]');
    } catch (e) {
        return [];
    }
}

// Render tukang cards into a container. If category provided, filter by keahlian.
function renderTukangs(containerId = 'provider-list', category = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const tukangs = getTukangs();
    container.innerHTML = '';
    const filtered = category ? tukangs.filter(t => {
        if (!Array.isArray(t.keahlian)) return false;
        return t.keahlian.map(k => k.toLowerCase()).includes(category.toLowerCase());
    }) : tukangs;

    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-600">Belum ada tukang terdaftar untuk kategori ini.</p>';
        return;
    }

    filtered.forEach(t => {
        const card = document.createElement('div');
        card.className = 'p-3 border rounded flex items-center gap-3 cursor-pointer';
        card.onclick = () => openProviderDetail(t.id);
        const avatar = document.createElement('div');
        avatar.className = 'w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold';
        avatar.textContent = (t.nama_depan ? t.nama_depan[0].toUpperCase() : 'T');
        const info = document.createElement('div');
        info.innerHTML = `<div class="font-semibold">${t.nama_depan || ''} ${t.nama_belakang || ''}</div>
                          <div class="text-xs text-gray-500">${(t.keahlian||[]).join(', ')}</div>
                          <div class="text-sm text-gray-700">Rating: ★★★★☆ • Mulai Rp 50.000</div>`;
        card.appendChild(avatar);
        card.appendChild(info);
        container.appendChild(card);
    });
}

// Open provider detail (simple): finds tukang by id and navigates or shows info
function openProviderDetail(id) {
    const tukangs = getTukangs();
    const t = tukangs.find(x => String(x.id) === String(id));
    if (!t) return;
    // For now, just alert details or navigate to a detail page if exists
    alert(`Tukang: ${t.nama_depan} ${t.nama_belakang}\nKeahlian: ${(t.keahlian||[]).join(', ')}`);
}

document.addEventListener('DOMContentLoaded', () => {
    // auto-render main provider list if exists
    if (document.getElementById('provider-list')) {
        renderTukangs('provider-list', null);
    }
    // render tukang list on layanan pages by reading data-category
    const tukangListEl = document.getElementById('tukang-list');
    if (tukangListEl) {
        const category = tukangListEl.getAttribute('data-category') || null;
        renderTukangs('tukang-list', category);
    }
});

// --- FUNGSI LOGIN ---
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ Login Berhasil! Selamat datang ' + result.user.nama_depan);
            // Simpan data user sementara (opsional)
            localStorage.setItem('user_session', JSON.stringify(result.user));
            
            // Arahkan ke halaman sesuai tipe pengguna
            if (result.user.tipe_pengguna === 'tukang') {
                window.location.href = 'BerandaTukang.html'; // Arahkan ke halaman tukang
            } else {
                window.location.href = 'Beranda.html'; // Arahkan ke halaman pelanggan
            }
        } else {
            alert('❌ Login Gagal: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Gagal terhubung ke server.');
    }
}

// --- FUNGSI LOGOUT ---
function logout() {
    if(confirm('Apakah Anda ingin mengakhiri sesi kerja?')) {
        localStorage.removeItem('user_session');
        // Arahkan ke halaman login
        window.location.href = 'login.html';
    }
}

// -- Tukang helpers (client-side storage & rendering) --
function getTukangs() {
    try {
        return JSON.parse(localStorage.getItem('tukangs') || '[]');
    } catch (e) { return []; }
}

function renderTukangs(containerId = 'provider-list', category = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const tukangs = getTukangs();
    // filter by category if provided
    const list = category ? tukangs.filter(t => (t.keahlian || []).map(k=>k.toLowerCase()).includes(category.toLowerCase())) : tukangs;

    container.innerHTML = '';
    if (list.length === 0) {
        container.innerHTML = '<p class="text-slate-500">Belum ada tukang terdaftar untuk kategori ini.</p>';
        return;
    }

    list.forEach(t => {
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-4 items-center hover:shadow-md hover:border-blue-200 transition cursor-pointer';
        card.onclick = () => openProviderDetail(t.id);
        card.innerHTML = `
            <div class="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl">${(t.nama_depan||'')[0] || 'T'}</div>
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start">
                    <h4 class="font-bold text-slate-800 text-sm md:text-base truncate">${(t.nama_depan||'') + ' ' + (t.nama_belakang||'')}</h4>
                </div>
                <p class="text-slate-500 text-xs truncate">${(t.keahlian||[]).join(' • ')}</p>
                <div class="flex items-center mt-2 justify-between">
                    <div class="flex items-center bg-amber-50 px-2 py-0.5 rounded-md">
                        <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"currentColor\" class=\"text-amber-500 mr-1\"><polygon points=\"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2\"/></svg>
                        <span class="text-xs text-amber-700 font-bold">4.8</span>
                    </div>
                    <span class="text-blue-600 text-xs md:text-sm font-bold">Rp 50.000</span>
                </div>
            </div>`;
        container.appendChild(card);
    });
}

function openProviderDetail(id) {
    // Try to find tukang in localStorage
    const tukangs = getTukangs();
    const t = tukangs.find(x => String(x.id) === String(id));
    if (!t) {
        alert('Detail tukang tidak ditemukan.');
        return;
    }
    // Fill detail modal/section if exists
    const nameEl = document.getElementById('detail-name');
    if (nameEl) nameEl.textContent = (t.nama_depan||'') + ' ' + (t.nama_belakang||'');
    const descEl = document.getElementById('detail-desc');
    if (descEl) descEl.textContent = t.alamat || '-';
    const tagsEl = document.getElementById('detail-tags');
    if (tagsEl) {
        tagsEl.innerHTML = '';
        (t.keahlian || []).forEach(k => { const s = document.createElement('span'); s.className = 'px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs'; s.textContent = k; tagsEl.appendChild(s); });
    }
    const priceEl = document.getElementById('detail-price');
    if (priceEl) priceEl.textContent = 'Rp 50.000';
    // Show provider view if using single-page
    const providerView = document.getElementById('view-provider');
    if (providerView) {
        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        providerView.classList.add('active');
    }
}

// Auto-render on pages that include provider-list
document.addEventListener('DOMContentLoaded', () => {
    // If Beranda has provider-list, render all
    if (document.getElementById('provider-list')) renderTukangs('provider-list', null);
    // If halaman layanan memiliki tukang-list and a data-category attribute, render filtered
    const tl = document.getElementById('tukang-list');
    if (tl && tl.dataset && tl.dataset.category) renderTukangs('tukang-list', tl.dataset.category);

});
