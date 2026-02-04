document.addEventListener("DOMContentLoaded", () => {

  function setActiveTab(tabId) {
    // Hide all panels
    document.querySelectorAll(".tab-content").forEach(panel => {
      panel.classList.remove("active");
    });

    // Deactivate all tabs
    document.querySelectorAll(".tab").forEach(tab => {
      tab.classList.remove("active");
    });

    // Activate selected panel
    const panel = document.getElementById(tabId);
    if (panel) panel.classList.add("active");

    // Activate selected tab
    const tabButton = document.querySelector(`.tab[data-tab="${tabId}"]`);
    if (tabButton) tabButton.classList.add("active");

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Top tab bar clicks
  document.querySelectorAll(".tab").forEach(button => {
    button.addEventListener("click", () => {
      const tabId = button.dataset.tab;
      setActiveTab(tabId);
    });
  });

  // Hero buttons that jump to tabs
  document.querySelectorAll(".tablink").forEach(button => {
    button.addEventListener("click", () => {
      const tabId = button.dataset.tab;
      setActiveTab(tabId);
    });
  });

  // Fake submit handler (front-end only)
  window.fakeSubmit = function (e) {
    e.preventDefault();
    const msg = document.getElementById("formMsg");
    if (msg) {
      msg.textContent = "✅ Inquiry submitted! We’ll contact you soon.";
    }
    e.target.reset();
    return false;
  };

});
