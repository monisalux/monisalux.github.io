document.addEventListener("DOMContentLoaded", () => {

  function setTab(tabId){
    document.querySelectorAll(".tab-content").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

    document.getElementById(tabId).classList.add("active");
    document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll(".tab, .tablink").forEach(btn => {
    btn.addEventListener("click", () => {
      setTab(btn.dataset.tab);
    });
  });

  // Expandable resources (robust)
  document.addEventListener("click", (e) => {
    const header = e.target.closest(".resource-header");
    if (!header) return;

    const card = header.parentElement;
    const isOpen = card.getAttribute("data-open") === "true";
    card.setAttribute("data-open", String(!isOpen));
  });

  // Form submit + confetti
  const form = document.getElementById("inquiryForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    launchConfetti();
    document.getElementById("formMsg").textContent =
      "🎉 Inquiry submitted! We’ll contact you soon.";
    form.reset();
  });

});

function launchConfetti(){
  const container = document.createElement("div");
  container.className = "confetti-container";
  document.body.appendChild(container);

  for(let i=0;i<40;i++){
    const piece=document.createElement("span");
    piece.className="confetti";
    piece.style.left=Math.random()*100+"vw";
    piece.style.backgroundColor=`hsl(${Math.random()*360},100%,70%)`;
    container.appendChild(piece);
  }

  setTimeout(()=>container.remove(),1200);
}
