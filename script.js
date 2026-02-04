function openTab(tabId, button) {
  document.querySelectorAll('.tab-content').forEach(tab =>
    tab.classList.remove('active')
  );

  document.querySelectorAll('.tab').forEach(btn =>
    btn.classList.remove('active')
  );

  document.getElementById(tabId).classList.add('active');
  button.classList.add('active');
}
