function openTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  document.querySelectorAll('.tab').forEach(button => {
    button.classList.remove('active');
  });

  document.getElementById(tabId).classList.add('active');
  event.target.classList.add('active');
}
