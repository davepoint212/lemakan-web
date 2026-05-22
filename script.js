// GANTI URL INI DENGAN URL APPS SCRIPT LO!
// =====================================================
const API_BASE = "https://script.google.com/macros/s/AKfycbxTnhf3atIXUDq06j2r6HQrIiL0-KKnDgMenCK1mGCScPXjd2jslhKTOCg163cL3j3u/exec";

// Helper function panggil API
async function fetchAPI(action) {
    try {
        const response = await fetch(`${API_BASE}?action=${action}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error:", error);
        return { status: "error", message: error.message };
    }
}

// ========== INDEX PAGE (Dashboard) ==========
async function loadDashboard() {
    if (!document.getElementById("totalMembers")) return;
    
    const [members, recipes, products, announcements] = await Promise.all([
        fetchAPI("get_members"),
        fetchAPI("get_recipes"),
        fetchAPI("get_products"),
        fetchAPI("get_announcements")
    ]);
    
    // Update stats
    document.getElementById("totalMembers").innerText = members.data?.length || 0;
    document.getElementById("totalRecipes").innerText = recipes.data?.length || 0;
    document.getElementById("totalProducts").innerText = products.data?.length || 0;
    
    // Show announcements
    const annContainer = document.getElementById("announcements");
    if (annContainer && announcements.data?.length) {
        annContainer.innerHTML = announcements.data.slice(0, 3).map(ann => `
            <div class="announcement-card">
                <h3>${escapeHtml(ann.judul)}</h3>
                <p>${escapeHtml(ann.isi)}</p>
                <div class="announcement-date">${ann.tgl_post || ""}</div>
            </div>
        `).join("");
    }
}

// ========== RECIPES PAGE ==========
async function loadRecipes() {
    const container = document.getElementById("recipesList");
    if (!container) return;
    
    showLoading(true);
    const result = await fetchAPI("get_recipes");
    showLoading(false);
    
    if (result.status !== "success" || !result.data) {
        showError("Gagal memuat resep");
        return;
    }
    
    window.allRecipes = result.data;
    renderRecipes(result.data);
}

function renderRecipes(recipes) {
    const container = document.getElementById("recipesList");
    if (!container) return;
    
    if (!recipes || recipes.length === 0) {
        container.innerHTML = '<div class="loading">Belum ada resep</div>';
        return;
    }
    
    container.innerHTML = recipes.map(recipe => `
        <div class="recipe-card">
            ${recipe.foto_url ? `<img src="${recipe.foto_url}" class="recipe-image" onerror="this.src='https://via.placeholder.com/300x180?text=No+Image'">` : '<div class="recipe-image" style="background:#eee; display:flex;align-items:center;justify-content:center">📷 No Image</div>'}
            <div class="recipe-info">
                <div class="recipe-title">${escapeHtml(recipe.judul)}</div>
                <div class="recipe-category">🏷️ ${escapeHtml(recipe.kategori || "Umum")}</div>
                <div class="recipe-desc">
                    <strong>Bahan:</strong><br>
                    ${escapeHtml(recipe.bahan || "-").replace(/\n/g, "<br>")}
                </div>
                <div class="recipe-desc" style="margin-top:10px">
                    <strong>Langkah:</strong><br>
                    ${escapeHtml(recipe.langkah || "-").replace(/\n/g, "<br>")}
                </div>
                ${recipe.rating_avg ? `<div class="rating">⭐ ${recipe.rating_avg}</div>` : ""}
            </div>
        </div>
    `).join("");
}

function filterRecipes() {
    if (!window.allRecipes) return;
    const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const filtered = window.allRecipes.filter(r => 
        r.judul?.toLowerCase().includes(search) || 
        r.kategori?.toLowerCase().includes(search)
    );
    renderRecipes(filtered);
}

// ========== PRODUCTS PAGE ==========
async function loadProducts() {
    const container = document.getElementById("productsList");
    if (!container) return;
    
    showLoading(true);
    const result = await fetchAPI("get_products");
    showLoading(false);
    
    if (result.status !== "success" || !result.data) {
        showError("Gagal memuat produk");
        return;
    }
    
    window.allProducts = result.data;
    renderProducts(result.data);
}

function renderProducts(products) {
    const container = document.getElementById("productsList");
    if (!container) return;
    
    if (!products || products.length === 0) {
        container.innerHTML = '<div class="loading">Belum ada produk</div>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card">
            ${product.foto_url ? `<img src="${product.foto_url}" class="product-image" onerror="this.src='https://via.placeholder.com/300x180?text=No+Image'">` : '<div class="product-image" style="background:#eee; display:flex;align-items:center;justify-content:center">📷 No Image</div>'}
            <div class="product-info">
                <div class="product-title">${escapeHtml(product.nama_produk)}</div>
                <div class="product-price">Rp ${formatRupiah(product.harga)}</div>
                <div class="product-desc">${escapeHtml(product.deskripsi_singkat || "-")}</div>
                <div class="product-desc" style="font-size:12px">📦 Stok: ${product.stok || "?"}</div>
                ${product.no_wa_penjual ? `<a href="https://wa.me/${product.no_wa_penjual}?text=Halo%2C%20saya%20tertarik%20dengan%20${encodeURIComponent(product.nama_produk)}" class="wa-btn" target="_blank">💬 Pesan via WA</a>` : ""}
            </div>
        </div>
    `).join("");
}

function filterProducts() {
    if (!window.allProducts) return;
    const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const filtered = window.allProducts.filter(p => 
        p.nama_produk?.toLowerCase().includes(search) ||
        p.deskripsi_singkat?.toLowerCase().includes(search)
    );
    renderProducts(filtered);
}

// ========== ALBUMS PAGE ==========
async function loadAlbums() {
    const container = document.getElementById("albumsList");
    if (!container) return;
    
    showLoading(true);
    const result = await fetchAPI("get_albums");
    showLoading(false);
    
    if (result.status !== "success" || !result.data) {
        showError("Gagal memuat album");
        return;
    }
    
    if (result.data.length === 0) {
        container.innerHTML = '<div class="loading">Belum ada album foto</div>';
        return;
    }
    
    container.innerHTML = result.data.map(album => `
        <div class="album-card">
            ${album.foto_url ? `<img src="${album.foto_url}" class="album-image" onerror="this.src='https://via.placeholder.com/300x180?text=No+Image'">` : '<div class="album-image" style="background:#eee; display:flex;align-items:center;justify-content:center">📷 No Image</div>'}
            <div class="album-info">
                <div class="album-title">${escapeHtml(album.nama_album)}</div>
                <div class="product-desc">${escapeHtml(album.deskripsi || "-")}</div>
                <div class="announcement-date">📅 ${album.tgl_upload || ""}</div>
            </div>
        </div>
    `).join("");
}

// Helper functions
function showLoading(show) {
    const loading = document.getElementById("loading");
    if (loading) loading.style.display = show ? "block" : "none";
}

function showError(msg) {
    const error = document.getElementById("error");
    if (error) {
        error.innerText = msg;
        error.style.display = "block";
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
        if (m === "&") return "&amp;";
        if (m === "<") return "&lt;";
        if (m === ">") return "&gt;";
        return m;
    });
}

function formatRupiah(angka) {
    if (!angka) return "0";
    return new Intl.NumberFormat("id-ID").format(angka);
}

// Run on page load
document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
    loadRecipes();
    loadProducts();
    loadAlbums();
});
