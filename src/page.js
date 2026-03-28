export function markActiveNav(pageName) {
  document.querySelectorAll("[data-page]").forEach((link) => {
    if (link.getAttribute("data-page") === pageName) {
      link.classList.add("active");
    }
  });
}

export function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

export function setStatus(id, message, isError = false) {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  element.textContent = message;
  element.style.color = isError ? "#8d3b2d" : "#6c2d12";
}
