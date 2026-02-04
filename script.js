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
    console.log("EmailJS ready");
  };

  /* ================= TABS ================= */
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
    if (!emailReady) {
      inquiryMsg.textContent = "❌ Email service not ready. Try again.";
      return;
    }

    const payload = {
      name: inquiryForm.name.value.trim(),
      email: inquiryForm.email.value.trim(),
      phone: inquiryForm.phone.value.trim(),
      grade: inquiryForm.grade.value.trim(),
      subjects: inquiryForm.subjects.value.trim(),
      availability: inquiryForm.availability.value.trim(),
      reply_to: inquiryForm.email.value.trim(),
      timestamp: new Date().toLocaleString()
    };

    if (!payload.name || !payload.email || !payload.grade || !payload.subjects || !payload.availability) {
      inquiryMsg.textContent = "❌ Please fill in all required fields.";
      return;
    }

    inquiryMsg.textContent = "Sending…";

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_TO_YOU, payload);
      await emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_AUTOREPLY, payload);
      launchConfetti();
      inquiryMsg.textContent = "🎉 Inquiry sent! We’ll contact you within 24 hours.";
      inquiryForm.reset();
    } catch (err) {
      console.error(err);
      inquiryMsg.textContent = "❌ Something went wrong.";
    }
  });

  /* ================= EXTRA SESSIONS CALENDAR ================= */
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl || typeof FullCalendar === "undefined") return;

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
    validRange: { start: today, end: maxDate },
    headerToolbar: {
      left: "prev,next",
      center: "title",
      right: ""
    }
  });

  calendar.render();

  /* ===== DEMO AVAILABILITY ===== */
  const demoSlots = [
    { days: 1, time: "16:00" },
    { days: 2, time: "17:00" },
    { days: 3, time: "15:30" }
  ];

  demoSlots.forEach(slot => {
    const d = new Date();
    d.setDate(d.getDate() + slot.days);
    const [h, m] = slot.time.split(":");
    d.setHours(h, m, 0, 0);

    calendar.addEvent({
      title: "Available",
      start: d,
      end: new Date(d.getTime() + 60 * 60000),
      className: "available"
    });
  });

  /* ================= BOOKING MODAL ================= */
  const modal = document.getElementById("bookingModal");
  const closeModal = document.getElementById("closeModal");
  const bookingForm = document.getElementById("bookingForm");
  const bookingMsg = document.getElementById("bookingMsg");
  const selectedTimeText = document.getElementById("selectedTimeText");

  let selectedEvent = null;
  const activeBookings = [];

  closeModal.onclick = () => modal.classList.add("hidden");

  calendar.on("eventClick", (info) => {
    if (!info.event.classNames.includes("available")) return;

    selectedEvent = info.event;
    selectedTimeText.textContent =
      "Selected time: " +
      info.event.start.toLocaleString("en-CA", { timeZone: "America/Toronto" });

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
    calendar.addEvent({
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
      } catch (err) {
        console.error("Confirmation email failed", err);
      }
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
