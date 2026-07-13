/* ==========================================================================
   SLEEKCHEK — Global UI behavior
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ---- Mobile nav toggle ---- */
  const hamburger = document.querySelector(".hamburger");
  const mobileNav = document.getElementById("mobileNav");
  hamburger?.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
  });
  mobileNav?.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => mobileNav.classList.remove("open"))
  );

  /* ---- Logo fallback detection ----
     If images/logo.svg fails to load (because the user hasn't added it yet),
     keep the text wordmark visible. If it loads successfully, hide the text
     and show only the artwork. */
  document.querySelectorAll("img.logo-slot").forEach((img) => {
    img.addEventListener("load", () => {
      if (img.naturalWidth > 0) document.body.classList.add("has-logo");
    });
    img.addEventListener("error", () => {
      img.style.display = "none";
    });
  });

  /* ---- Redaction-bar reveal on scroll ---- */
  const redactEls = document.querySelectorAll(".redact, .redact-block");
  if ("IntersectionObserver" in window && redactEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add("is-declassified"), 200);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    redactEls.forEach((el) => io.observe(el));
  } else {
    redactEls.forEach((el) => el.classList.add("is-declassified"));
  }

  /* ---- Search: simple redirect-to-shop-with-query ---- */
  document.querySelectorAll("[data-search-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = form.querySelector("input").value.trim();
      if (q) window.location.href = `shop.html?q=${encodeURIComponent(q)}`;
    });
  });

  /* ---- Navbar contrast swap on dark hero pages ---- */
  const navbar = document.querySelector(".navbar");
  const hero = document.querySelector(".hero");
  if (navbar && hero && "IntersectionObserver" in window) {
    const navIo = new IntersectionObserver(
      ([entry]) => {
        navbar.classList.toggle("is-dark", entry.isIntersecting);
      },
      { rootMargin: `-${navbar.offsetHeight}px 0px 0px 0px`, threshold: 0 }
    );
    navIo.observe(hero);
  }
});
