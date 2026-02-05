document.addEventListener("DOMContentLoaded", () => {

  /* ================= EMAILJS CONFIG ================= */
  const EMAILJS_PUBLIC_KEY = "z01UAn-dERFLYMxUV";
  const EMAILJS_SERVICE_ID = "service_ajfd3oo";
  const TEMPLATE_TO_YOU = "westudy_inquiry";
  const TEMPLATE_AUTOREPLY = "template_autoreply";

  /* ================= APPS SCRIPT (Stage 2.3) ================= */
  const BOOKING_API_URL = "https://script.google.com/macros/s/AKfycbwy9uoluq7eThI-zCF2RIdJSma4mCg2wdeDDaRNOSSoc1gXsbJbH9K35cutmMQwCDM/exec"; // from Apps Script deployment
  const TZ = "America/Toronto";

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

    // Fix FullCalendar render when tab becomes visible
    if (tabId === "extras" && window.extraSessionsCalendar) {
      setTimeout(() => window.extraSessionsCalendar.updateSize(), 50);
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
    card.setAttribute("data-open", card.getAttribute("data-open") === "true" ? "false" : "true");
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
      timestamp: new Date().toLocaleString("en-CA", { timeZone: TZ })
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

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "timeGridWeek",
    timeZone: TZ,
    allDaySlot: false,
    slotMinTime: "08:00:00",
    slotMaxTime: "21:00:00",
    nowIndicator: true,
    height: "auto",
    validRange: function () {
    const now = new Date(
      new Date().toLocaleString("en-CA", { timeZone: TZ })
        );
      
        const end = new Date(now);
        end.setDate(now.getDate() + 14);
      
        return {
          start: now,
          end: end
        };
      },

    headerToolbar: { left: "prev,next", center: "title", right: "" }
  });

  window.extraSessionsCalendar = calendar;
  calendar.render();
  setTimeout(() => {
    loadAvailability();
    calendar.updateSize();
  }, 50);

  // Modal elements
  const modal = document.getElementById("bookingModal");
  const closeModal = document.getElementById("closeModal");
  const bookingForm = document.getElementById("bookingForm");
  const bookingMsg = document.getElementById("bookingMsg");
  const selectedTimeText = document.getElementById("selectedTimeText");
  const durationSelect = bookingForm.duration;

  // Add extra close behaviors
  const modalX = document.getElementById("modalX");
  modalX && (modalX.onclick = () => modal.classList.add("hidden"));
  closeModal.onclick = () => modal.classList.add("hidden");
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) modal.classList.add("hidden");
  });

  let selectedAvailability = null;

  async function loadAvailability() {
    calendar.getEvents().forEach(ev => ev.remove());

    const url = `${BOOKING_API_URL}?action=availability`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok) {
      console.error(data);
      return;
    }

    data.slots.forEach(slot => {
      const start = new Date(slot.start);
      const end = new Date(slot.end);

      calendar.addEvent({
        title: "Available",
        start,
        end,
        className: "available",
        extendedProps: {
          availabilityId: slot.id,
          maxMinutes: slot.maxMinutes
        }
      });
    });
  }

  // Click available -> open booking modal
  calendar.on("eventClick", (info) => {
    const ev = info.event;

    if (ev.classNames.includes("available")) {
      selectedAvailability = ev;

      const maxMinutes = ev.extendedProps.maxMinutes;

      selectedTimeText.textContent =
        "Selected time: " +
        ev.start.toLocaleString("en-CA", { timeZone: TZ });

      // build duration options to fit slot
      durationSelect.innerHTML = '<option value="">Select duration</option>';
      [30, 60, 90, 120].forEach(min => {
        if (min <= maxMinutes) {
          const opt = document.createElement("option");
          opt.value = String(min);
          opt.textContent =
            min === 30 ? "30 minutes" :
            min === 60 ? "1 hour" :
            min === 90 ? "1.5 hours" : "2 hours";
          durationSelect.appendChild(opt);
        }
      });

      bookingForm.reset();
      bookingMsg.textContent = "";
      modal.classList.remove("hidden");
      return;
    }

    // Cancel flow for booked events (we add these after booking)
    if (ev.classNames.includes("booked")) {
      const studentNumber = prompt("Enter your Student Number to cancel:");
      if (!studentNumber) return;
      const email = prompt("Enter your Email to cancel:");
      if (!email) return;

      cancelBooking(ev.extendedProps.bookingId, studentNumber, email);
    }
  });

  // Book submit -> POST to Apps Script
  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const studentNumber = bookingForm.studentNumber.value.trim();
    const email = bookingForm.email.value.trim();
    const durationMinutes = Number(bookingForm.duration.value);
    const notes = bookingForm.notes.value.trim();

    if (!studentNumber || !email || !durationMinutes || !notes) {
      bookingMsg.textContent = "❌ Please complete all fields.";
      return;
    }
    if (!selectedAvailability) {
      bookingMsg.textContent = "❌ No availability selected.";
      return;
    }

    bookingMsg.textContent = "Booking…";

    try {
      const resp = await fetch(BOOKING_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "book",
          availabilityId: selectedAvailability.extendedProps.availabilityId,
          studentNumber,
          email,
          durationMinutes,
          notes
        })
      });

      const data = await resp.json();
      if (!data.ok) {
        bookingMsg.textContent = "❌ " + (data.error || "Booking failed");
        return;
      }

      // send confirmation email (parent)
      if (emailReady) {
        try {
          await emailjs.send(
            EMAILJS_SERVICE_ID,
            TEMPLATE_AUTOREPLY,
            {
              name: "WeStudy Student",
              reply_to: email,
              grade: "",
              subjects: `Extra Session booked: ${notes}`
            }
          );
        } catch (err) {
          console.error("Confirmation email failed:", err);
        }
      }

      launchConfetti();
      modal.classList.add("hidden");
      alert("🎉 Booking confirmed! A confirmation email has been sent.");

      await loadAvailability(); // refresh calendar slots

      // Add booked event for visual (optional; loadAvailability already removed availability)
      // If you want booked events shown too, we can add a separate endpoint later.

    } catch (err) {
      console.error(err);
      bookingMsg.textContent = "❌ Booking failed. Try again.";
    }
  });

  async function cancelBooking(bookingId, studentNumber, email) {
    try {
      const resp = await fetch(BOOKING_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          bookingId,
          studentNumber,
          email
        })
      });

      const data = await resp.json();
      if (!data.ok) {
        alert("❌ " + (data.error || "Cancel failed"));
        return;
      }

      alert("✅ Booking cancelled.");
      await loadAvailability();
    } catch (err) {
      console.error(err);
      alert("❌ Cancel failed.");
    }
  }

  // Initial load
  loadAvailability();

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
