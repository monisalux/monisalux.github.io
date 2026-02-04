document.addEventListener("DOMContentLoaded", () => {
  /* ============ CONFIG: replace these 3 values ============ */
  const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY_HERE";
  const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID_HERE";
  const TEMPLATE_TO_YOU = "YOUR_TEMPLATE_ID_TO_YOU_HERE";
  const TEMPLATE_AUTOREPLY = "YOUR_TEMPLATE_ID_AUTOREPLY_HERE";

  /* ============ Tabs ============ */
  function setTab(tabId) {
    document.querySelectorAll(".tab-content").forEach((s) => s.classList.remove("active"));
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));

    const panel = document.getElementById(tabId);
    const tabBtn = document.querySelector(`.tab[data-tab="${tabId}"]`);
    if (panel) panel.classList.add("active");
    if (tabBtn) tabBtn.classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll(".tab, .tablink").forEach((btn) => {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
  });

  /* ============ Expandable resources (if present) ============ */
  document.addEventListener("click", (e) => {
    const header = e.target.closest(".resource-header");
    if (!header) return;
    const card = header.parentElement;
    const isOpen = card.getAttribute("data-open") === "true";
    card.setAttribute("data-open", String(!isOpen));
  });

  /* ============ Load EmailJS ============ */
  const emailJsScript = document.createElement("script");
  emailJsScript.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
  document.body.appendChild(emailJsScript);

  emailJsScript.onload = () => {
    if (!window.emailjs) {
      console.error("EmailJS failed to load.");
      return;
    }
    window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  };

  /* ============ Inquiry form: send to you + auto-reply ============ */
  const form = document.getElementById("inquiryForm");
  const msg = document.getElementById("formMsg");

  function setMsg(text) {
    if (msg) msg.textContent = text;
  }

  function getValue(name) {
    const el = form.querySelector(`[name="${name}"]`);
    return (el?.value || "").trim();
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Basic front-end validation
    const name = getValue("name");
    const email = getValue("email");
    const grade = getValue("grade");
    const subjects = getValue("subjects");
    const availability = getValue("availability");
    const phone = getValue("phone");

    if (!name || !email || !grade || !subjects || !availability) {
      setMsg("❌ Please fill in all required fields.");
      return;
    }

    setMsg("Sending…");

    const payload = {
      name,
      email,          // used in your “to you” template
      phone,
      grade,
      subjects,
      availability,
      reply_to: email, // used in auto-reply template to send to the parent
      timestamp: new Date().toLocaleString()
    };

    try {
      // 1) Send inquiry email to you
      await window.emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_TO_YOU, payload);

      // 2) Send auto-reply to parent
      await window.emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_AUTOREPLY, payload);

      launchConfetti();
      setMsg("🎉 Sent! We’ll contact you within 24 hours.");
      form.reset();
    } catch (err) {
      console.error(err);
      setMsg("❌ Something went wrong. Please try again.");
    }
  });
});

/* ============ Confetti (micro-animation) ============ */
function launchConfetti() {
  const container = document.createElement("div");
  container.className = "confetti-container";
  document.body.appendChild(container);

  for (let i = 0; i < 50; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 70%)`;
    piece.style.animationDelay = Math.random() * 0.2 + "s";
    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), 1200);
}
