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

  /* ============ Extra Sessions Calendar (UI only) ============ */
const calendarEl = document.getElementById("calendar");

if (calendarEl) {
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 14);

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "timeGridWeek",
    timeZone: "America/Toronto",
    allDaySlot: false,
    slotMinTime: "08:00:00",
    slotMaxTime: "21:00:00",
    nowIndicator: true,
    height: "auto",

    validRange: {
      start: today,
      end: maxDate
    },

    headerToolbar: {
      left: "prev,next",
      center: "title",
      right: ""
    },

    events: [
      // TEMP demo availability (we remove this in Stage 2.2)
      {
        title: "Available",
        start: FullCalendar.formatDate(today, {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "America/Toronto"
        }),
        end: FullCalendar.formatDate(today, {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "America/Toronto"
        }),
        backgroundColor: "#2ec4b6"
      }
    ],

    dateClick(info) {
      // UI-only for now
      if (info.date < today || info.date > maxDate) return;
      alert(
        "Booking will be enabled soon.\n\n" +
        "Selected time:\n" +
        info.date.toLocaleString("en-CA", { timeZone: "America/Toronto" })
      );
    }
  });

  calendar.render();
}

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
