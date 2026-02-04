document.addEventListener("DOMContentLoaded", () => {

  const EMAILJS_PUBLIC_KEY = "z01UAn-dERFLYMxUV";
  const EMAILJS_SERVICE_ID = "service_ajfd3oo";
  const TEMPLATE_TO_YOU = "westudy_inquiry";
  const TEMPLATE_AUTOREPLY = "template_autoreply";

  let emailReady = false;

  /* ============ Tabs ============ */
  function setTab(tabId) {
    document.querySelectorAll(".tab-content").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

    const panel = document.getElementById(tabId);
    const tabBtn = document.querySelector(`.tab[data-tab="${tabId}"]`);
    if (panel) panel.classList.add("active");
    if (tabBtn) tabBtn.classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll(".tab, .tablink").forEach(btn => {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
  });

  /* ============ Expandable resources ============ */
  document.addEventListener("click", (e) => {
    const header = e.target.closest(".resource-header");
    if (!header) return;
    const card = header.parentElement;
    card.setAttribute(
      "data-open",
      card.getAttribute("data-open") === "true" ? "false" : "true"
    );
  });

  /* ============ Load EmailJS ============ */
  const emailJsScript = document.createElement("script");
  emailJsScript.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
  document.body.appendChild(emailJsScript);

  emailJsScript.onload = () => {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    emailReady = true;
    console.log("EmailJS ready");
  };

  /* ============ Inquiry Form ============ */
  const form = document.getElementById("inquiryForm");
  const msg = document.getElementById("formMsg");

  function setMsg(text) {
    if (msg) msg.textContent = text;
  }

  function getValue(name) {
    const el = form.querySelector(`[name="${name}"]`);
    return (el?.value || "").trim();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!emailReady) {
      setMsg("❌ Email service not ready. Please try again.");
      return;
    }

    const payload = {
      name: getValue("name"),
      email: getValue("email"),
      phone: getValue("phone"),
      grade: getValue("grade"),
      subjects: getValue("subjects"),
      availability: getValue("availability"),
      reply_to: getValue("email"),
      timestamp: new Date().toLocaleString()
    };

    if (!payload.name || !payload.email || !payload.grade || !payload.subjects || !payload.availability) {
      setMsg("❌ Please fill in all required fields.");
      return;
    }

    setMsg("Sending…");

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_TO_YOU, payload);
      await emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_AUTOREPLY, payload);

      launchConfetti();
      setMsg("🎉 Inquiry sent! We’ll contact you within 24 hours.");
      form.reset();

    } catch (err) {
      console.error("EmailJS error:", err);
      setMsg("❌ Failed to send. Please try again.");
    }
  });
});

/* ============ Confetti ============ */
function launchConfetti() {
  const container = document.createElement("div");
  container.className = "confetti-container";
  document.body.appendChild(container);

  for (let i = 0; i < 50; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.backgroundColor = `hsl(${Math.random() * 360},100%,70%)`;
    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), 1200);
}
