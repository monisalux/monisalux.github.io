document.addEventListener("DOMContentLoaded", () => {

  /* ================= EMAILJS CONFIG ================= */
  const EMAILJS_PUBLIC_KEY = "z01UAn-dERFLYMxUV";
  const EMAILJS_SERVICE_ID = "service_ajfd3oo";
  const TEMPLATE_TO_YOU = "westudy_inquiry";
  const TEMPLATE_AUTOREPLY = "template_autoreply";

  let emailReady = false;

  /* ================= LOAD EMAILJS ================= */
  const emailJsScript = document.createElement("script");
  emailJsScript.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
  document.body.appendChild(emailJsScript);

  emailJsScript.onload = () => {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    emailReady = true;
  };

  /* ================= TABS ================= */
  function setTab(tabId) {
    document.querySelectorAll(".tab-content").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

    document.getElementById(tabId)?.classList.add("active");
    document.querySelector(`.tab[data-tab="${tabId}"]`)?.classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });

    // Fix FullCalendar render issue when tab becomes visible
    if (tabId === "extras" && window.extraSessionsCalendar) {
      setTimeout(() => {
        window.extraSessionsCalendar.updateSize();
      }, 50);
    }
  }

  document.querySelectorAll(".tab, .tablink").forEach(btn => {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
  });

  /* ================= EXPANDABLE RESOURCES ================= */
  document.addEventListener("click", (e) => {
    const header = e.target.closest(".resource-header");
    if (!header) return;
    const card = header.parentElement;
    card.setAttribute(
      "data-open",
      card.getAttribute("data-open") === "true" ? "false" : "true"
    );
  });

  /* ================= INQUIRY FORM ================= */
  const inquiryForm = document.getElementById("inquiryForm");
  const inquiryMsg = document.getElementById("formMsg");

  inquiryForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!emailReady) return;

    const payload = {
      name: inquiryForm.name.value.trim(),
      email: inquiryForm.email.value.trim(),
      phone: inquiryForm.phone.value.trim(),
      grade: inquiryForm.grade.value.trim(),
      subjects: inquiryForm.subjects.value.trim(),
      availability: inquiryForm.availability.value.trim(),
      reply_to: inquiryForm.email.value.trim(),
      timestamp: new Date().toLocaleString("en-CA", { timeZone: "America/Toronto" })
    };

    inquiryMsg.textContent = "Sending…";

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

  /* ================= EXTRA SESSIONS CALENDAR ================= */
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl || typeof FullCalendar === "undefined") return;

  window.extraSessionsCalendar = new FullCalendar.Calendar(calendarEl, {

    initialView: "timeGridWeek",
    timeZone: "America/Toronto",
    allDaySlot: false,
    slotMinTime: "08:00:00",
    slotMaxTime: "21:00:00",
    nowIndicator: true,
    height: "auto",
    validRange: function () {
      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + 14);
      return { start, end };
    },
    headerToolbar: {
      left: "prev,next",
      center: "title",
      right: ""
    }
  });

  window.extraSessionsCalendar.render();

  /* ===== DEMO AVAILABILITY (ET SAFE) ===== */
  function makeETDate(daysFromNow, hour, minute) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hour, minute, 0, 0);
    return d;
  }

  const demoSlots = [
    { start: makeETDate(1, 16, 0), length: 60 },
    { start: makeETDate(2, 17, 0), length: 90 },
    { start: makeETDate(3, 15, 30), length: 120 }
  ];

  demoSlots.forEach(slot => {
    window.extraSessionsCalendar.addEvent({
      title: "Available",
      start: slot.start,
      end: new Date(slot.start.getTime() + slot.length * 60000),
      className: "available",
      extendedProps: { maxDuration: slot.length }
    });
  });

  /* ================= BOOKING MODAL ================= */
  const modal = document.getElementById("bookingModal");
  const closeModal = document.getElementById("closeModal");
  const bookingForm = document.getElementById("bookingForm");
  const bookingMsg = document.getElementById("bookingMsg");
  const selectedTimeText = document.getElementById("selectedTimeText");
  const durationSelect = bookingForm.duration;

  let selectedEvent = null;
  const activeBookings = [];

  closeModal.onclick = () => modal.classList.add("hidden");

  window.extraSessionsCalendar.on("eventClick", (info) => {
    if (!info.event.classNames.includes("available")) return;

    selectedEvent = info.event;
    const maxDuration = info.event.extendedProps.maxDuration;

    selectedTimeText.textContent =
      "Selected time: " +
      info.event.start.toLocaleString("en-CA", { timeZone: "America/Toronto" });

    // Build duration options dynamically
    durationSelect.innerHTML = '<option value="">Select duration</option>';
    [30, 60, 90, 120].forEach(min => {
      if (min <= maxDuration) {
        const opt = document.createElement("option");
        opt.value = min;
        opt.textContent = min === 60 ? "1 hour" : min + " minutes";
        durationSelect.appendChild(opt);
      }
    });

    bookingForm.reset();
    bookingMsg.textContent = "";
    modal.classList.remove("hidden");
  });

  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const studentNumber = bookingForm.studentNumber.value.trim();
    const email = bookingForm.email.value.trim();
    const duration = Number(bookingForm.duration.value);
    const notes = bookingForm.notes.value.trim();

    if (!studentNumber || !email || !duration || !notes) {
      bookingMsg.textContent = "❌ Please complete all fields.";
      return;
    }

    if (activeBookings.some(b => b.studentNumber === studentNumber)) {
      bookingMsg.textContent = "❌ You already have an active booking.";
      return;
    }

    selectedEvent.remove();
    window.extraSessionsCalendar.addEvent({
      title: "Booked",
      start: selectedEvent.start,
      end: new Date(selectedEvent.start.getTime() + duration * 60000),
      className: "booked"
    });

    activeBookings.push({ studentNumber, email });

    if (emailReady) {
      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          TEMPLATE_AUTOREPLY,
          {
            name: "Student",
            reply_to: email,
            subjects: notes
          }
        );
      } catch {}
    }

    launchConfetti();
    modal.classList.add("hidden");
    alert("🎉 Booking confirmed! A confirmation email has been sent.");
  });

});

/* ================= CONFETTI ================= */
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
