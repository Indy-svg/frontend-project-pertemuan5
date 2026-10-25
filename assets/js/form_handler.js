const getEl = (id) => document.getElementById(id);

const getStockStatus = (stock) => (stock >= 15 ? 'Stok Aman' : 'Stok Menipis');

// [UBAH] ditambah parameter prefix: '' = form tambah, 'edit-' = form edit (modal)
const getFormValues = (prefix = '') => ({
  name: getEl(prefix + 'product-name').value.trim(),
  category: getEl(prefix + 'product-category').value,
  price: parseFloat(getEl(prefix + 'product-price').value),
  stock: parseInt(getEl(prefix + 'product-stock').value, 10),
});

// [UBAH] ditambah parameter excludeId: saat EDIT, produk itu sendiri tidak dianggap nama kembar
const validateProduct = ({ name, category, price, stock }, excludeId = null) => {
  const errors = {};
  if (!name) {
    errors['product-name'] = 'Nama produk wajib diisi.';
  } else if (productDataset.some((p) => p.id !== excludeId && p.name.toLowerCase() === name.toLowerCase())) {
    errors['product-name'] = 'Nama produk sudah ada.';
  }
  if (!category) errors['product-category'] = 'Pilih kategori.';
  if (isNaN(price) || price < 1000) errors['product-price'] = 'Harga minimal Rp1.000.';
  if (isNaN(stock) || stock < 0) errors['product-stock'] = 'Stok tidak valid.';
  return { errors, valid: Object.keys(errors).length === 0 };
};

const showFeedback = (el, message, type) => {
  el.textContent = message;
  el.className = `feedback-msg ${type}`; // type: 'success' atau 'error'
};

const clearInvalidMarks = () =>
  document.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));

// [UBAH] ditambah parameter prefix (sama seperti getFormValues)
const markInvalid = (errors, prefix = '') =>
  Object.keys(errors).forEach((id) => getEl(prefix + id).classList.add('invalid'));

// ===== RENDER TABEL, FILTER, REKAP =====
const createCell = (text) => {
  const td = document.createElement('td');
  td.textContent = text;
  return td;
};

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

// ----- [BARU] pembantu untuk kolom Tampil (badge) dan Aksi (tombol) -----
const isActive = (p) => p.active !== false; // data lama tanpa field "active" dianggap aktif

const applyBadge = (btn, active) => {
  btn.classList.toggle('inactive', !active); // classList.toggle (Tugas Praktikum 5)
  btn.textContent = active ? 'Aktif' : 'Nonaktif';
};

const createButton = (label, className, onClick) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
};

const createBadgeCell = (p) => {
  const td = document.createElement('td');
  const badge = createButton('', 'badge-toggle', () => handleToggle(p.id, badge));
  applyBadge(badge, isActive(p));
  td.appendChild(badge);
  return td;
};

const createActionCell = (p) => {
  const td = document.createElement('td');
  td.append(
    createButton('Edit', 'btn btn-sm btn-edit', () => openEditModal(p.id)),
    createButton('Hapus', 'btn btn-sm btn-delete', () => handleDeleteProduct(p.id)),
  );
  return td;
};

// [UBAH] renderTable: tambah pencarian, data-id, kolom Tampil & Aksi (kolom lama tetap sama)
const renderTable = (newId = null) => {
  const selected = getEl('filter-category').value || null;
  const { products: byCategory } = filterProducts(productDataset, selected); // dari logic.js
  const keyword = getEl('search-input').value.trim().toLowerCase();
  const products = byCategory.filter((p) =>
    keyword === '' || p.name.toLowerCase().includes(keyword) || p.category.toLowerCase().includes(keyword));
  const tbody = getEl('product-table-body');
  tbody.replaceChildren();

  if (products.length === 0) {
    const tr = document.createElement('tr');
    const td = createCell('Tidak ada data yang cocok.');
    td.colSpan = 8;
    td.className = 'empty-cell';
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  products.forEach((p) => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', p.id);                 // dipakai untuk mencari baris saat dihapus
    if (p.id === newId) tr.classList.add('fade-in');  // efek muncul untuk data baru
    [p.id, p.name, p.category, formatRupiah(p.price), p.stock, getStockStatus(p.stock)]
      .forEach((v) => tr.appendChild(createCell(v)));
    tr.appendChild(createBadgeCell(p));
    tr.appendChild(createActionCell(p));
    tbody.appendChild(tr);
  });
  getEl('product-count').textContent = products.length;
};

const renderRecap = () => {
  const { totalProducts, totalItems, totalStockValue } = calculateTotalStockValue(productDataset); // dari logic.js
  const list = getEl('recap-list');
  list.replaceChildren();
  [
    `Jumlah produk: ${totalProducts}`,
    `Total unit stok: ${totalItems}`,
    `Total nilai stok: ${formatRupiah(totalStockValue)}`,
  ].forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    list.appendChild(li);
  });
};

const refreshView = (newId = null) => {
  renderFilterOptions();
  renderTable(newId);
  renderProductCards(productDataset, '#product-container', newId); // [BARU] kartu di samping form (logic.js)
  renderRecap();
};

// ===== SUBMIT (TAMBAH) =====
// [BARU] ID = ID terbesar + 1 (productDataset.length + 1 bisa kembar setelah ada data yang dihapus)
const getNextId = () => Math.max(0, ...productDataset.map((p) => p.id)) + 1;

const handleSubmit = (event, form, feedback) => {
  event.preventDefault(); // cegah reload

  clearInvalidMarks();
  const values = getFormValues();
  const { errors, valid } = validateProduct(values);

  if (!valid) {
    markInvalid(errors);
    console.warn('Validasi gagal (tambah):', errors);
    showFeedback(feedback, 'Gagal: ' + Object.values(errors).join(' '), 'error');
    return;
  }

  const newProduct = { id: getNextId(), ...values, active: true };
  productDataset.push(newProduct);
  saveProducts(); // [BARU] simpan ke localStorage
  console.log('Data produk berhasil ditambahkan:', newProduct);

  showFeedback(feedback, `Sukses! Produk '${newProduct.name}' (${formatRupiah(newProduct.price)}) tersimpan.`, 'success');

  getEl('search-input').value = ''; // supaya produk baru langsung terlihat
  getEl('filter-category').value = '';
  refreshView(newProduct.id); // perbarui tabel + rekap
  form.reset();    // kosongkan form
};

// ===== [BARU] HAPUS: fade-out lalu remove() =====
const handleDeleteProduct = (productId) => {
  const target = productDataset.find((p) => p.id === productId);
  if (!target) return;
  if (!window.confirm(`Hapus produk "${target.name}"?`)) return;

  const rowToDelete = document.querySelector(`tr[data-id="${productId}"]`);
  const cardToDelete = document.querySelector(`article[data-id="${productId}"]`); // kartu di samping form
  if (rowToDelete) {
    if (rowToDelete.classList.contains('fade-out')) return; // cegah klik ganda
    rowToDelete.classList.add('fade-out');
  }
  if (cardToDelete) cardToDelete.classList.add('fade-out');

  setTimeout(() => {
    const index = productDataset.findIndex((p) => p.id === productId);
    productDataset.splice(index, 1);
    saveProducts();
    console.log(`Produk ID ${productId} (${target.name}) berhasil dihapus. Sisa: ${productDataset.length}`);
    refreshView();
  }, 300);
};

// ===== [BARU] TOGGLE status aktif / nonaktif =====
const handleToggle = (productId, badge) => {
  const product = productDataset.find((p) => p.id === productId);
  if (!product) return;
  product.active = !isActive(product);
  saveProducts();
  applyBadge(badge, product.active);
  renderProductCards(productDataset); // kartu ikut diperbarui
  console.log(`Status ${product.name} sekarang ${product.active ? 'AKTIF' : 'NONAKTIF'}`);
};

// ===== [BARU] EDIT lewat modal =====
let editingId = null;

const openEditModal = (productId) => {
  const product = productDataset.find((p) => p.id === productId);
  if (!product) return;
  editingId = productId;
  clearInvalidMarks();
  getEl('edit-feedback').className = 'feedback-msg';
  getEl('edit-feedback').textContent = '';
  getEl('edit-product-name').value = product.name;
  getEl('edit-product-category').value = product.category;
  getEl('edit-product-price').value = product.price;
  getEl('edit-product-stock').value = product.stock;

  getEl('edit-modal').classList.add('open');
  getEl('edit-modal').setAttribute('aria-hidden', 'false');
  getEl('edit-product-name').focus();
  console.log('Edit produk dibuka:', { ...product });
};

const closeEditModal = () => {
  getEl('edit-modal').classList.remove('open');
  getEl('edit-modal').setAttribute('aria-hidden', 'true');
  editingId = null;
};

const handleEditSubmit = (event) => {
  event.preventDefault();
  clearInvalidMarks();
  const values = getFormValues('edit-');
  const { errors, valid } = validateProduct(values, editingId);

  if (!valid) {
    markInvalid(errors, 'edit-');
    console.warn('Validasi gagal (edit):', errors);
    showFeedback(getEl('edit-feedback'), 'Gagal: ' + Object.values(errors).join(' '), 'error');
    return;
  }

  const product = productDataset.find((p) => p.id === editingId);
  const before = { ...product };
  Object.assign(product, values); // timpa name, category, price, stock
  saveProducts();
  console.log('Produk diedit. Sebelum:', before, '| Sesudah:', { ...product });

  closeEditModal();
  refreshView();
  showFeedback(getEl('form-feedback'), `Produk '${product.name}' berhasil diperbarui.`, 'success');
};

// ===== INISIALISASI =====
document.addEventListener('DOMContentLoaded', () => {
  const form = getEl('product-form');
  const feedback = getEl('form-feedback');

  form.addEventListener('submit', (event) => handleSubmit(event, form, feedback));

  getEl('filter-category').addEventListener('change', () => renderTable());

  // [BARU] pencarian, tombol Reset Form, modal edit, Reset Data
  getEl('search-input').addEventListener('input', () => renderTable());
  getEl('btn-reset-form').addEventListener('click', () => {
    form.reset();
    clearInvalidMarks();
  });
  getEl('edit-form').addEventListener('submit', handleEditSubmit);
  getEl('btn-cancel-edit').addEventListener('click', closeEditModal);
  getEl('edit-modal').addEventListener('click', (e) => { if (e.target === getEl('edit-modal')) closeEditModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeEditModal(); });
  getEl('btn-reset-data').addEventListener('click', () => {
    if (!window.confirm('Kembalikan semua data ke data contoh awal?')) return;
    productDataset.splice(0, productDataset.length, ...JSON.parse(JSON.stringify(seedDataset)));
    saveProducts();
    refreshView();
  });

  refreshView(); 
});