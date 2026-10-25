// ===== katalog.js : halaman client (hanya MENAMPILKAN kartu, tanpa tombol edit/hapus) =====
// Kartu dibuat oleh renderProductCards() di logic.js
// Data productDataset sudah otomatis terisi dari localStorage oleh logic.js

const getEl = (id) => document.getElementById(id);

const getStockStatus = (stock) => (stock >= 15 ? 'Stok Aman' : 'Stok Menipis');

const renderFilterOptions = () => {
  const select = getEl('filter-category');
  const current = select.value;
  const categories = [...new Set(productDataset.map((p) => p.category))];
  select.replaceChildren();
  const all = document.createElement('option');
  all.value = '';
  all.textContent = 'Semua kategori';
  select.appendChild(all);
  categories.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });
  select.value = categories.includes(current) ? current : '';
};

const refreshCatalog = () => {
  renderFilterOptions();
  const category = getEl('filter-category').value;
  const keyword = getEl('search-input').value.trim().toLowerCase();
  const result = productDataset.filter((p) =>
    (category === '' || p.category === category) &&
    (keyword === '' || p.name.toLowerCase().includes(keyword) || p.category.toLowerCase().includes(keyword)));
  renderProductCards(result); // dari logic.js
  getEl('product-count').textContent = result.length;
  getEl('empty-state').hidden = result.length > 0;
  console.log(`[KATALOG] Menampilkan ${result.length} dari ${productDataset.length} produk.`);
};

document.addEventListener('DOMContentLoaded', () => {
  getEl('search-input').addEventListener('input', refreshCatalog);
  getEl('filter-category').addEventListener('change', refreshCatalog);
  // Jika admin mengubah data di tab lain, katalog ikut berubah otomatis
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) { loadFromStorage(); refreshCatalog(); }
  });
  refreshCatalog();
});