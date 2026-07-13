/* ==========================================================================
   SLEEKCHEK — Admin Dashboard (Supabase)
   ========================================================================== */

const SIZE_OPTIONS = ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "S", "M", "L", "XL", "XXL"];
let editingId = null;
let productsCache = [];

/* ---- Toast ---- */
let toastTimer;
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function money(n) {
  return `৳${Number(n).toLocaleString()}`;
}

/* ---- Size checkboxes ---- */
function renderSizeCheckboxes(selected = []) {
  const row = document.getElementById("sizeCheckboxRow");
  row.innerHTML = SIZE_OPTIONS.map(
    (s) => `
    <label class="size-checkbox">
      <input type="checkbox" value="${s}" ${selected.includes(s) ? "checked" : ""}> ${s}
    </label>`
  ).join("");
}

function getSelectedSizes() {
  return Array.from(document.querySelectorAll("#sizeCheckboxRow input:checked")).map((i) => i.value);
}

/* ---- Load + render product table ---- */
async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    productsCache = [];
    document.getElementById("productTableBody").innerHTML =
      `<tr><td colspan="7" style="text-align:center;color:var(--signal);font-family:var(--font-mono);padding:30px;">
        Could not reach Supabase. Check SUPABASE_URL / SUPABASE_ANON_KEY in js/config.js.<br>${error.message}
      </td></tr>`;
    return;
  }

  productsCache = data.map((p) => ({
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

  renderTable();
  renderStats();
}

function renderStats() {
  document.getElementById("statTotal").textContent = productsCache.length;
  document.getElementById("statSale").textContent = productsCache.filter((p) => p.tag === "Sale").length;
}

function renderTable() {
  const body = document.getElementById("productTableBody");
  if (!productsCache.length) {
    body.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted-dark);font-family:var(--font-mono);padding:30px;">No products yet. Click "Add product" to create your first listing.</td></tr>`;
    return;
  }
  body.innerHTML = productsCache
    .map(
      (p) => `
    <tr>
      <td><img src="${resolveAdminImage(p.image)}" alt="${p.title}" onerror="this.style.opacity=0"></td>
      <td>${p.title}</td>
      <td>${p.category}</td>
      <td>${p.old_price ? `<s style="color:var(--muted-dark);">${money(p.old_price)}</s> ` : ""}${money(p.price)}</td>
      <td>${p.sizes.join(", ")}</td>
      <td>${p.tag || "—"}</td>
      <td class="row-actions">
        <button data-edit="${p.id}">Edit</button>
        <button data-delete="${p.id}" class="danger">Delete</button>
      </td>
    </tr>`
    )
    .join("");

  body.querySelectorAll("[data-edit]").forEach((btn) =>
    btn.addEventListener("click", () => openEditForm(btn.dataset.edit))
  );
  body.querySelectorAll("[data-delete]").forEach((btn) =>
    btn.addEventListener("click", () => deleteProduct(btn.dataset.delete))
  );
}

function resolveAdminImage(path) {
  if (!path) return "";
  return path;
}

/* ---- Form open/close ---- */
function openNewForm() {
  editingId = null;
  document.getElementById("formTitle").textContent = "Add product";
  document.getElementById("productForm").reset();
  document.getElementById("imgPreview").style.display = "none";
  document.getElementById("formStatus").textContent = "";
  renderSizeCheckboxes([]);
  document.getElementById("formPanel").style.display = "block";
  document.getElementById("formPanel").scrollIntoView({ behavior: "smooth" });
}

function openEditForm(id) {
  const p = productsCache.find((x) => String(x.id) === String(id));
  if (!p) return;
  editingId = p.id;
  document.getElementById("formTitle").textContent = `Edit — ${p.title}`;
  document.getElementById("pTitle").value = p.title;
  document.getElementById("pCategory").value = p.category;
  document.getElementById("pPrice").value = p.price;
  document.getElementById("pOldPrice").value = p.old_price || "";
  document.getElementById("pDescription").value = p.description || "";
  document.getElementById("pTag").value = p.tag || "";
  renderSizeCheckboxes(p.sizes);

  const preview = document.getElementById("imgPreview");
  if (p.image) {
    preview.src = resolveAdminImage(p.image);
    preview.style.display = "block";
  } else {
    preview.style.display = "none";
  }
  document.getElementById("formStatus").textContent = "";
  document.getElementById("formPanel").style.display = "block";
  document.getElementById("formPanel").scrollIntoView({ behavior: "smooth" });
}

function closeForm() {
  document.getElementById("formPanel").style.display = "none";
  editingId = null;
}

/* ---- Delete ---- */
async function deleteProduct(id) {
  if (!confirm("Delete this product? This cannot be undone.")) return;
  const { error } = await supabaseClient.from("products").delete().eq("id", id);
  if (error) {
    showToast("Failed to delete product");
    return;
  }
  showToast("Product deleted");
  loadProducts();
}

/* ---- Image upload to Supabase Storage, returns a public URL ---- */
async function uploadProductImage(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabaseClient.storage
    .from(SUPABASE_PRODUCT_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabaseClient.storage.from(SUPABASE_PRODUCT_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/* ---- Save (create or update) ---- */
document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const statusEl = document.getElementById("formStatus");
  const sizes = getSelectedSizes();

  if (!sizes.length) {
    statusEl.textContent = "Select at least one size.";
    statusEl.className = "admin-status err";
    return;
  }

  const imageFile = document.getElementById("pImage").files[0];
  if (!editingId && !imageFile) {
    statusEl.textContent = "Please upload a product image.";
    statusEl.className = "admin-status err";
    return;
  }

  statusEl.textContent = "Saving…";
  statusEl.className = "admin-status";

  try {
    let image_url;
    if (imageFile) {
      image_url = await uploadProductImage(imageFile);
    }

    const record = {
      title: document.getElementById("pTitle").value.trim(),
      category: document.getElementById("pCategory").value,
      price: parseInt(document.getElementById("pPrice").value, 10),
      old_price: document.getElementById("pOldPrice").value
        ? parseInt(document.getElementById("pOldPrice").value, 10)
        : null,
      description: document.getElementById("pDescription").value.trim(),
      sizes,
      tag: document.getElementById("pTag").value || null,
    };
    if (image_url) record.image_url = image_url;

    let error;
    if (editingId) {
      ({ error } = await supabaseClient.from("products").update(record).eq("id", editingId));
    } else {
      ({ error } = await supabaseClient.from("products").insert(record));
    }

    if (error) throw error;

    statusEl.textContent = "Saved!";
    statusEl.className = "admin-status ok";
    showToast(editingId ? "Product updated" : "Product added");
    closeForm();
    loadProducts();
  } catch (err) {
    statusEl.textContent = err.message || "Something went wrong.";
    statusEl.className = "admin-status err";
  }
});

/* ---- Image preview ---- */
document.getElementById("pImage").addEventListener("change", (e) => {
  const file = e.target.files[0];
  const preview = document.getElementById("imgPreview");
  if (!file) return;
  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";
  document.getElementById("uploadHint").textContent = file.name;
});

/* ---- Wire up buttons ---- */
document.getElementById("newProductBtn").addEventListener("click", openNewForm);
document.getElementById("cancelFormBtn").addEventListener("click", closeForm);
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "/admin/login.html";
});

/* ---- Boot ---- */
(async () => {
  await requireAdminAuth();
  loadProducts();
})();
