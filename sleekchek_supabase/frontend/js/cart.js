/* ==========================================================================
   SLEEKCHEK — Cart / Bag / Checkout
   Cart persists in localStorage so it survives across Home/Shop pages.
   ========================================================================== */

const CART_KEY = "sleekchek_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderBagCount();
}

// Adds a line item. Same product+size merges quantity.
function addToCart(product, size, qty = 1) {
  const cart = getCart();
  const existing = cart.find((i) => i.id === product.id && i.size === size);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      size: size,
      qty: qty,
    });
  }
  saveCart(cart);
  showToast(`${product.title} (${size}) added to bag`);
  renderBagDrawer();
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderBagDrawer();
}

function cartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function renderBagCount() {
  document.querySelectorAll("[data-bag-count]").forEach((el) => {
    el.textContent = cartCount();
  });
}

/* ---- Bag drawer UI ---- */
function renderBagDrawer() {
  const itemsEl = document.getElementById("bagItems");
  const footerEl = document.getElementById("bagFooter");
  if (!itemsEl) return;

  const cart = getCart();

  if (cart.length === 0) {
    itemsEl.innerHTML = "";
    itemsEl.style.display = "none";
    document.getElementById("bagEmpty").style.display = "flex";
    footerEl.style.display = "none";
    return;
  }

  document.getElementById("bagEmpty").style.display = "none";
  itemsEl.style.display = "flex";
  footerEl.style.display = "flex";

  itemsEl.innerHTML = cart
    .map(
      (item, i) => `
    <div class="bag-item">
      <img src="${item.image}" alt="${item.title}" loading="lazy">
      <div>
        <div class="bag-item-title">${item.title}</div>
        <div class="bag-item-meta">SIZE ${item.size} &middot; QTY ${item.qty}</div>
        <button class="bag-item-remove" data-remove-index="${i}">Remove</button>
      </div>
      <div class="bag-item-price">৳${(item.price * item.qty).toLocaleString()}</div>
    </div>
  `
    )
    .join("");

  document.getElementById("bagTotal").textContent = `৳${cartTotal().toLocaleString()}`;

  itemsEl.querySelectorAll("[data-remove-index]").forEach((btn) => {
    btn.addEventListener("click", () => removeFromCart(Number(btn.dataset.removeIndex)));
  });
}

function openBag() {
  document.getElementById("bagOverlay").classList.add("open");
  renderBagDrawer();
}
function closeBag() {
  document.getElementById("bagOverlay").classList.remove("open");
}

/* ==========================================================================
   Checkout form -> WhatsApp message
   ========================================================================== */
function openCheckout() {
  if (getCart().length === 0) return;
  closeBag();
  document.getElementById("checkoutOverlay").classList.add("open");
}
function closeCheckout() {
  document.getElementById("checkoutOverlay").classList.remove("open");
}

function buildWhatsAppMessage(customer) {
  const cart = getCart();
  const lines = [];
  lines.push("*NEW ORDER — SLEEKCHEK*");
  lines.push("");
  lines.push("*Items:*");
  cart.forEach((item, i) => {
    lines.push(
      `${i + 1}. ${item.title} | Size: ${item.size} | Qty: ${item.qty} | ৳${(
        item.price * item.qty
      ).toLocaleString()}`
    );
  });
  lines.push("");
  lines.push(`*Total: ৳${cartTotal().toLocaleString()}*`);
  lines.push("");
  lines.push("*Customer Details:*");
  lines.push(`Name: ${customer.name}`);
  lines.push(`Phone: ${customer.phone}`);
  lines.push(`Address: ${customer.address}`);
  lines.push(`Payment Method: ${customer.payment}`);
  if (customer.payment !== "Cash on Delivery") {
    lines.push(`(Send payment to ${WHATSAPP_NUMBER.replace("880", "+880")} then share the Transaction ID here)`);
  }
  return encodeURIComponent(lines.join("\n"));
}

function handleCheckoutSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const customer = {
    name: form.name.value.trim(),
    address: form.address.value.trim(),
    phone: form.phone.value.trim(),
    payment: form.querySelector('input[name="payment"]:checked')?.value || "Cash on Delivery",
  };

  if (!customer.name || !customer.address || !customer.phone) {
    showToast("Please fill in all fields");
    return;
  }

  const msg = buildWhatsAppMessage(customer);
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;

  // Clear cart once order handed off to WhatsApp
  localStorage.removeItem(CART_KEY);
  renderBagCount();

  window.open(waUrl, "_blank");
  closeCheckout();
  form.reset();
  showToast("Redirecting to WhatsApp to confirm your order…");
}

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

/* ---- Wire up global bag/checkout controls once DOM is ready ---- */
document.addEventListener("DOMContentLoaded", () => {
  renderBagCount();

  document.querySelectorAll("[data-open-bag]").forEach((btn) => btn.addEventListener("click", openBag));
  document.getElementById("bagOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "bagOverlay") closeBag();
  });
  document.getElementById("bagClose")?.addEventListener("click", closeBag);
  document.getElementById("checkoutTrigger")?.addEventListener("click", openCheckout);

  document.getElementById("checkoutOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "checkoutOverlay") closeCheckout();
  });
  document.getElementById("checkoutClose")?.addEventListener("click", closeCheckout);
  document.getElementById("checkoutForm")?.addEventListener("submit", handleCheckoutSubmit);

  // Payment option chip selection styling
  document.querySelectorAll(".payment-option").forEach((label) => {
    const input = label.querySelector("input");
    input.addEventListener("change", () => {
      document.querySelectorAll(".payment-option").forEach((l) => l.classList.remove("selected"));
      label.classList.add("selected");
      const note = document.getElementById("payNote");
      if (input.value === "Cash on Delivery") {
        note.classList.remove("show");
      } else {
        note.textContent = `Send the payment to ${input.value} number +880 1627-053081, then share the Transaction ID with us on WhatsApp after this form is submitted.`;
        note.classList.add("show");
      }
    });
  });
});
