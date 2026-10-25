// 1. Dataset Mock Produk UMKM (minimal 8 produk)
const productDataset = [
    {
        id: 1,
        name: "Keripik Mangrove",
        category: "Makanan",
        price: 15000,
        stock: 20
    },
    {
        id: 2,
        name: "Blueberry Cheesecake",
        category: "Dessert",
        price: 30000,
        stock: 15
    },
    {
        id: 3,
        name: "Batik Gajah Oling",
        category: "Fashion",
        price: 150000,
        stock: 8
    },
    {
        id: 4,
        name: "Butterscotch Coffe",
        category: "Minuman",
        price: 25000,
        stock: 30
    },
    {
        id: 5,
        name: "Dimsum Mentai",
        category: "Makanan",
        price: 22000,
        stock: 25
    },
    {
        id: 6,
        name: "Tas Anyaman Bambu",
        category: "Kerajinan",
        price: 85000,
        stock: 10
    },
    {
        id: 7,
        name: "Mochi Bites",
        category: "Camilan",
        price: 18000,
        stock: 40
    },
    {
        id: 8,
        name: "Smoothies",
        category: "Minuman",
        price: 20000,
        stock: 12
    }
];
// ===== [TAMBAHAN PRAKTIK 5] Penyimpanan localStorage =====
// Dataset di atas jadi DATA AWAL. Jika di localStorage sudah ada data, isinya dipakai
// (isi array diganti, nama variabel productDataset tetap sama).
const STORAGE_KEY = 'umkm_products_v1';
const seedDataset = JSON.parse(JSON.stringify(productDataset)); // salinan data awal (untuk tombol Reset)

const loadFromStorage = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw !== null) {
            const saved = JSON.parse(raw);
            if (Array.isArray(saved)) productDataset.splice(0, productDataset.length, ...saved);
        }
    } catch (err) {
        console.error('Data localStorage rusak, memakai data awal:', err);
    }
};

const saveProducts = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(productDataset));
    } catch (err) {
        console.error('Gagal menyimpan ke localStorage:', err);
    }
};

loadFromStorage();
// ===== [AKHIR TAMBAHAN] =====

console.log(productDataset);

// Fungsi bantu: format angka menjadi Rupiah (contoh: Rp15.000)
const formatRupiah = (amount) => {
    return `Rp${amount.toLocaleString("id-ID")}`;
};

// 2a. Fungsi Filter Produk (berdasarkan kategori dan/atau rentang harga)
// Parameter yang tidak diisi memakai nilai default (fitur ES6)
const filterProducts = (products, filterCategory = null, minPrice = 0, maxPrice = Infinity) => {

    console.log(`=== Menjalankan Filter Produk ===`);
    console.log(`Kategori: ${filterCategory === null ? "Semua" : filterCategory} | Harga: ${formatRupiah(minPrice)} - ${maxPrice === Infinity ? "tanpa batas" : formatRupiah(maxPrice)}`);

    const filteredProducts = [];

    for (const product of products) {
        // Evaluasi kondisi menggunakan Strict Equality (===)
        const isCategoryMatch = filterCategory === null || product.category === filterCategory;
        const isPriceMatch = product.price >= minPrice && product.price <= maxPrice;

        if (isCategoryMatch && isPriceMatch) {
            filteredProducts.push(product);

            // Evaluasi status stok dengan Ternary Operator
            const stockStatus = product.stock >= 15 ? "Stok Aman" : "Stok Menipis";
            console.log(`[ID: ${product.id}] ${product.name} (${product.category}) - Harga: ${formatRupiah(product.price)} - Stok: ${product.stock} (${stockStatus})`);
        }
    }

    if (filteredProducts.length === 0) {
        console.log("Tidak ada produk yang cocok.");
    }

    return {
        category: filterCategory,
        totalProducts: filteredProducts.length,
        products: filteredProducts
    };
}

// 2b. Fungsi Kalkulasi Total Valuasi Stok
const calculateTotalStockValue = (products) => {

    console.log(`=== Menghitung Total Nilai Stok ===`);

    let totalStockValue = 0;
    let totalItems = 0;

    for (const product of products) {
        // Nilai stok = harga x jumlah stok
        const stockValue = product.price * product.stock;
        totalStockValue += stockValue;
        totalItems += product.stock;

        console.log(`${product.name}: ${formatRupiah(product.price)} x ${product.stock} = ${formatRupiah(stockValue)}`);
    }

    return {
        totalProducts: products.length,
        totalItems: totalItems,
        totalStockValue: totalStockValue
    };
}

// 3. Eksekusi Fungsi & Output Console

// Filter berdasarkan kategori
const foodResult = filterProducts(productDataset, "Makanan");
console.log("Hasil Filter Kategori:", foodResult);
console.log(`Jumlah produk Makanan: ${foodResult.totalProducts}`);

// Filter berdasarkan rentang harga
const priceResult = filterProducts(productDataset, null, 20000, 90000);
console.log(`Jumlah produk harga Rp20.000 - Rp90.000: ${priceResult.totalProducts}`);

// Total valuasi stok seluruh produk
const stockResult = calculateTotalStockValue(productDataset);
console.log("Hasil Rekapitulasi:", stockResult);
console.log(`Total nilai stok: ${formatRupiah(stockResult.totalStockValue)}`);


// ===== [TAMBAHAN PRAKTIK 5] Render kartu produk (dipakai index.html DAN katalog.html) =====
// Pola dari Materi 5: kosongkan container -> forEach -> createElement -> innerHTML -> append
// Catatan: getStockStatus() didefinisikan di form_handler.js dan katalog.js (dipanggil saat render)

// Cegah karakter HTML dari input user ikut "dieksekusi" saat dimasukkan lewat innerHTML
const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// newId (opsional): kartu produk baru diberi efek fade-in
const renderProductCards = (products, selector = '#product-container', newId = null) => {
  const container = document.querySelector(selector);
  container.innerHTML = ''; // hapus gambar lama dulu, biar kartu tidak dobel-dobel

  products.forEach((prod) => {
    const active = prod.active !== false;

    // 1. Buat elemen kartu
    const card = document.createElement('article');
    card.className = 'product-card' + (active ? '' : ' inactive') + (prod.id === newId ? ' fade-in' : '');
    card.setAttribute('data-id', prod.id);

    // 2. Isi kartu
    card.innerHTML = `
      <span class="tag">${escapeHtml(prod.category)}</span>
      <h3 class="product-title">${escapeHtml(prod.name)}</h3>
      <p class="product-price">${formatRupiah(prod.price)}</p>
      <p class="product-stock">Sisa Stok: <span class="badge">${prod.stock}</span>
        <span class="stock-status ${prod.stock >= 15 ? 'ok' : 'low'}">${getStockStatus(prod.stock)}</span></p>
      <span class="status-pill ${active ? 'on' : 'off'}">${active ? 'Tersedia' : 'Tidak tersedia'}</span>
    `;

    // 3. Masukkan ke halaman
    container.append(card);
  });
};
// ===== [AKHIR TAMBAHAN] =====