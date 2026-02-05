document.addEventListener("DOMContentLoaded", () => {

  /**************** EMAILJS ****************/
  const EMAILJS_PUBLIC_KEY = "z01UAn-dERFLYMxUV";
  const EMAILJS_SERVICE_ID = "service_ajfd3oo";
  const TEMPLATE_TO_YOU = "westudy_inquiry";
  const TEMPLATE_AUTOREPLY = "template_autoreply";
  const TZ = "America/Toronto";

  let emailReady = false;

  const emailJsScript = document.createElement("script");
  emailJsScript.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
  document.body.appendChild(emailJsScript);

  emailJsScript.onload = () => {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    emailReady = true;
  };

  /**************** TABS ****************/
  function setTab(tabId) {
    document.querySelectorAll(".tab-content").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

    document.getElementById(tabId)?.classList.add("active");
    document.querySelector(`.tab[data-tab="${tabId}"]`)?.classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });

    // fix FullCalendar when switching tabs
    if (tabId === "extras" && window.extraSessionsCalendar) {
      setTimeout(() => window.extraSessionsCalendar.updateSize(), 50);
    }
  }

  document.querySelectorAll(".tab, .tablink").forEach(btn => {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
  });

  /**************** RESOURCES ACCORDION ****************/
  document.addEventListener("click", (e) => {
    const header = e.target.closest(".resource-header");
    if (!header) return;

    const card = header.parentElement;
    card.setAttribute(
      "data-open",
      card.getAttribute("data-open") === "true" ? "false" : "true"
    );
  });

  /**************** INQUIRY FORM ****************/
  const inquiryForm = document.getElementById("inquiryForm");
  const inquiryMsg = document.getElementById("formMsg");

  inquiryForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!emailReady) return;

    inquiryMsg.textContent = "Sending…";

    const payload = {
      name: inquiryForm.name.value.trim(),
      email: inquiryForm.email.value.trim(),
      phone: inquiryForm.phone.value.trim(),
      grade: inquiryForm.grade.value.trim(),
      subjects: inquiryForm.subjects.value.trim(),
      availability: inquiryForm.availability.value.trim(),
      reply_to: inquiryForm.email.value.trim(),
      timestamp: new Date().toLocaleString("en-CA", { timeZone: TZ })
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_TO_YOU, payload);
      await emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_AUTOREPLY, payload);
      launchConfetti();
      inquiryMsg.textContent = "🎉 Inquiry sent! We’ll contact you within 24 hours.";
      inquiryForm.reset();
    } catch {
      inquiryMsg.textContent = "❌ Something went wrong.";
    }
  });

  /**************** EXTRA SESSIONS CALENDAR ****************/
  const BOOKING_API_URL =
    "https://script.google.com/macros/s/AKfycbycNYRfD73u3_QmmTgUPnrjSaa4GRRTGE9eEq2T08u5-h33ZA3KhYrpauGA4_mvGTV5/exec";

  const calendarEl = document.getElementById("calendar");
  if (!calendarEl || typeof FullCalendar === "undefined") return;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "timeGridWeek",
    timeZone: TZ,
    allDaySlot: false,
    slotMinTime: "08:00:00",
    slotMaxTime: "21:00:00",
    nowIndicator: true,
    height: "auto",

    validRange() {
      const now = new Date();
      const start = new Date(now);
      const end = new Date(now);
      start.setHours(0,0,0,0);
      end.setDate(end.getDate() + 14);
      return { start, end };
    },

    headerToolbar: {
      left: "prev,next",
      center: "title",
      right: ""
    }
  });

  window.extraSessionsCalendar = calendar;
  calendar.render();

  async function loadAvailability() {
    calendar.getEvents().forEach(ev => ev.remove());

    const res = await fetch(`${BOOKING_API_URL}?action=availability`);
    const data = await res.json();
    if (!data.ok) return;

    data.slots.forEach(slot => {
      calendar.addEvent({
        title: "Available",
        start: slot.start,
        end: slot.end,
        display: "block",          // 🔥 REQUIRED
        className: "available",
        extendedProps: {
          availabilityId: slot.id,
          maxMinutes: slot.maxMinutes
        }
      });

    });
  }

  loadAvailability();

  /**************** BOOKING MODAL ****************/
  const modal = document.getElementById("bookingModal");
  const closeModal = document.getElementById("closeModal");
  const modalX = document.getElementById("modalX");
  const bookingForm = document.getElementById("bookingForm");
  const bookingMsg = document.getElementById("bookingMsg");
  const selectedTimeText = document.getElementById("selectedTimeText");
  const durationSelect = bookingForm.duration;

  let selectedAvailability = null;

  modalX.onclick = closeModal.onclick = () => modal.classList.add("hidden");
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  calendar.on("eventClick", info => {
    const ev = info.event;
    if (!ev.classNames.includes("available")) return;

    selectedAvailability = ev;

    selectedTimeText.textContent =
      "Selected time: " +
      ev.start.toLocaleString("en-CA", { timeZone: TZ });

    durationSelect.innerHTML = `<option value="">Select duration</option>`;
    [30,60,90,120].forEach(min => {
      if (min <= ev.extendedProps.maxMinutes) {
        const o = document.createElement("option");
        o.value = min;
        o.textContent =
          min === 30 ? "30 minutes" :
          min === 60 ? "1 hour" :
          min === 90 ? "1.5 hours" : "2 hours";
        durationSelect.appendChild(o);
      }
    });

    bookingForm.reset();
    bookingMsg.textContent = "";
    modal.classList.remove("hidden");
  });

  bookingForm.addEventListener("submit", async e => {
    e.preventDefault();
    if (!selectedAvailability) return;

    bookingMsg.textContent = "Booking…";

    const resp = await fetch(BOOKING_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "book",
        availabilityId: selectedAvailability.extendedProps.availabilityId,
        studentNumber: bookingForm.studentNumber.value.trim(),
        email: bookingForm.email.value.trim(),
        durationMinutes: Number(bookingForm.duration.value),
        notes: bookingForm.notes.value.trim()
      })
    });

    const data = await resp.json();
    if (!data.ok) {
      bookingMsg.textContent = "❌ " + data.error;
      return;
    }

    launchConfetti();
    alert("🎉 Booking confirmed!");
    modal.classList.add("hidden");
    loadAvailability();
  });

});

/**************** CONFETTI ****************/
function launchConfetti() {
  const container = document.createElement("div");
  container.className = "confetti-container";
  document.body.appendChild(container);

  for (let i = 0; i < 50; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.backgroundColor = `hsl(${Math.random()*360},100%,70%)`;
    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), 1200);
}
