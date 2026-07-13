/* ==========================================================================
   SLEEKCHEK — Shop / Product logic
   Shared by index.html (featured products) and shop.html (full grid).
   ========================================================================== */

let ALL_PRODUCTS = [];
let ACTIVE_CATEGORY = "All";
let selectedSize = null;

const CATEGORIES = ["All", "Tshirt", "Man Shirt", "Kids Tshirt", "Woman Oversize Tshirt"];

// Standard size charts (inches) shown in the Product Detail view.
const SIZE_CHARTS = {
  adult: {
    headers: ["Size", "Chest", "Length", "Shoulder"],
    rows: [
      ["S", "36", "26", "17"],
      ["M", "38", "27", "18"],
      ["L", "40", "28", "19"],
      ["XL", "42", "29", "20"],
      ["XXL", "44", "30", "21"],
    ],
  },
  kids: {
    headers: ["Size", "Age", "Chest", "Length"],
    rows: [
      ["2-3Y", "2-3 yrs", "22", "15"],
      ["4-5Y", "4-5 yrs", "24", "16"],
      ["6-7Y", "6-7 yrs", "26", "18"],
      ["8-9Y", "8-9 yrs", "28", "20"],
    ],
  },
};

function sizeChartFor(category) {
  return category === "Kids Tshirt" ? SIZE_CHARTS.kids : SIZE_CHARTS.adult;
}

/* ---- Fetch products: try Supabase first, fall back to local demo JSON ---- */
async function loadProducts() {
  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (Array.isArray(data) && data.length) {
      // Normalize Supabase rows to the shape the rest of this file expects.
      return data.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        price: p.price,
        old_price: p.old_price,
        description: p.description || "",
        sizes: Array.isArray(p.sizes) ? p.sizes : [],
        image: p.image_url || "",
        tag: p.tag,
      }));
    }
    throw new Error("Empty Supabase response");
  } catch (e) {
    // Supabase not configured / unreachable yet — use bundled demo catalog.
    const res = await fetch("data/products.json");
    return res.json();
  }
}

function money(n) {
  return `৳${Number(n).toLocaleString()}`;
}

// Product images can come from two places:
//  - the bundled demo catalog (relative paths like "images/products/x.jpg")
//  - Supabase Storage public URLs for admin-uploaded items (full https URL)
function resolveProductImage(path) {
  if (!path) return "images/products/placeholder.svg";
  return path;
}

function productCardHTML(p) {
  return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-thumb">
        ${p.tag ? `<span class="tag">${p.tag}</span>` : ""}
        <img src="${resolveProductImage(p.image)}" alt="${p.title}" loading="lazy"
             onerror="this.src='images/products/placeholder.svg'">
        <div class="quick-add">View product</div>
      </div>
      <div class="product-info">
        <div class="p-cat">${p.category}</div>
        <div class="p-title">${p.title}</div>
        <div class="p-price">
          ${p.old_price ? `<span class="old">${money(p.old_price)}</span>` : ""}${money(p.price)}
        </div>
      </div>
    </div>`;
}

function renderGrid(targetEl, products, emptyMessage = "No products found in this category yet.") {
  if (!products.length) {
    targetEl.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
    return;
  }
  targetEl.innerHTML = products.map(productCardHTML).join("");
  targetEl.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", () => openProductModal(card.dataset.id));
  });
}

function applyFilter() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  const filtered =
    ACTIVE_CATEGORY === "All" ? ALL_PRODUCTS : ALL_PRODUCTS.filter((p) => p.category === ACTIVE_CATEGORY);
  renderGrid(grid, filtered);
}

function initFilters() {
  const wrap = document.getElementById("filterChips");
  if (!wrap) return;
  wrap.innerHTML = CATEGORIES.map(
    (c) => `<button class="filter-chip${c === "All" ? " active" : ""}" data-cat="${c}">${c}</button>`
  ).join("");
  wrap.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      wrap.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      ACTIVE_CATEGORY = chip.dataset.cat;
      applyFilter();
    });
  });
}

/* ==========================================================================
   Product Detail Modal
   ========================================================================== */
function openProductModal(id) {
  const p = ALL_PRODUCTS.find((x) => String(x.id) === String(id));
  if (!p) return;
  selectedSize = null;

  const chart = sizeChartFor(p.category);
  const modal = document.getElementById("productModalContent");
  modal.innerHTML = `
    <button class="pd-close" id="pdClose" aria-label="Close">&times;</button>
    <div class="pd-body">
      <div class="pd-media">
        <img src="${resolveProductImage(p.image)}" alt="${p.title}" onerror="this.src='images/products/placeholder.svg'">
      </div>
      <div class="pd-info">
        <span class="eyebrow">${p.category}</span>
        <h2>${p.title}</h2>
        <div class="pd-price">
          ${p.old_price ? `<span class="old" style="text-decoration:line-through;color:var(--muted);margin-right:8px;">${money(p.old_price)}</span>` : ""}${money(p.price)}
        </div>
        <p class="pd-desc">${p.description || ""}</p>

        <div>
          <span class="eyebrow" style="display:block;margin-bottom:8px;">Select size</span>
          <div class="size-row" id="sizeRow">
            ${p.sizes.map((s) => `<button class="size-chip" data-size="${s}">${s}</button>`).join("")}
          </div>
          <button class="size-chart-toggle" id="sizeChartToggle" type="button">View size chart</button>
          <table class="size-chart-table" id="sizeChartTable">
            <thead><tr>${chart.headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
            <tbody>
              ${chart.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}
            </tbody>
          </table>
          <p style="font-family:var(--font-mono);font-size:0.68rem;color:var(--muted);margin-top:6px;">
            All measurements in inches. Garment laid flat.
          </p>
        </div>

        <div class="qty-row">
          <span class="eyebrow">Qty</span>
          <div class="qty-control">
            <button type="button" id="qtyMinus">&minus;</button>
            <span id="qtyValue">1</span>
            <button type="button" id="qtyPlus">&plus;</button>
          </div>
        </div>

        <button class="btn btn-dark btn-block" id="pdAddToCart">Add to bag</button>
      </div>
    </div>
  `;

  document.getElementById("productModalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";

  document.getElementById("pdClose").addEventListener("click", closeProductModal);

  let qty = 1;
  document.getElementById("qtyMinus").addEventListener("click", () => {
    qty = Math.max(1, qty - 1);
    document.getElementById("qtyValue").textContent = qty;
  });
  document.getElementById("qtyPlus").addEventListener("click", () => {
    qty = Math.min(10, qty + 1);
    document.getElementById("qtyValue").textContent = qty;
  });

  document.getElementById("sizeRow").querySelectorAll(".size-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".size-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      selectedSize = chip.dataset.size;
    });
  });

  document.getElementById("sizeChartToggle").addEventListener("click", () => {
    document.getElementById("sizeChartTable").classList.toggle("open");
  });

  document.getElementById("pdAddToCart").addEventListener("click", () => {
    if (!selectedSize) {
      showToast("Please select a size first");
      return;
    }
    addToCart(p, selectedSize, qty);
    closeProductModal();
  });
}

function closeProductModal() {
  document.getElementById("productModalOverlay").classList.remove("open");
  document.body.style.overflow = "";
}

/* ==========================================================================
   Boot
   ========================================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  ALL_PRODUCTS = await loadProducts();

  // Featured products on Home (first 4)
  const featuredGrid = document.getElementById("featuredGrid");
  if (featuredGrid) renderGrid(featuredGrid, ALL_PRODUCTS.slice(0, 4));

  // Full shop grid + filters
  if (document.getElementById("productGrid")) {
    initFilters();

    // Support ?q= search and ?cat= deep link from nav/search bar
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const cat = params.get("cat");

    if (cat && CATEGORIES.includes(cat)) {
      ACTIVE_CATEGORY = cat;
      document.querySelectorAll(".filter-chip").forEach((c) => {
        c.classList.toggle("active", c.dataset.cat === cat);
      });
    }

    if (q) {
      const results = ALL_PRODUCTS.filter(
        (p) =>
          p.title.toLowerCase().includes(q.toLowerCase()) ||
          p.category.toLowerCase().includes(q.toLowerCase())
      );
      renderGrid(document.getElementById("productGrid"), results, `No results for "${q}".`);
    } else {
      applyFilter();
    }
  }

  document.getElementById("productModalOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "productModalOverlay") closeProductModal();
  });
});
