document.addEventListener("DOMContentLoaded", () => {

  const BOOKING_API_URL =
    "https://script.google.com/macros/s/AKfycbzFyKWaQE_GcLm96amB4JlZjXSZSD_Hl6aFGk9UqCosFIdlMrecebkejk-M8hHetL8Ayw/exec";

  const TZ = "America/Toronto";

  /* ================= CALENDAR ================= */
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

      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + 14);

      return { start, end };
    },

    headerToolbar: {
      left: "prev,next",
      center: "title",
      right: ""
    }
  });

  calendar.render();

  /* ================= LOAD AVAILABILITY ================= */
  async function loadAvailability() {
    calendar.getEvents().forEach(e => e.remove());

    const res = await fetch(`${BOOKING_API_URL}?action=availability`);
    const data = await res.json();
    if (!data.ok) return;

    data.slots.forEach(slot => {
      calendar.addEvent({
        title: "Available",
        start: slot.start, // UTC → FC converts
        end: slot.end,
        className: "available",
        extendedProps: {
          availabilityId: slot.id,
          maxMinutes: slot.maxMinutes
        }
      });
    });
  }

  loadAvailability();

  /* ================= BOOKING MODAL ================= */
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

    durationSelect.innerHTML =
      `<option value="">Select duration</option>`;

    [30, 60, 90, 120].forEach(min => {
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

    alert("🎉 Booking confirmed!");
    modal.classList.add("hidden");
    loadAvailability();
  });

});
