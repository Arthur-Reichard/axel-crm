// HomeAnimations.js
export function setupAnimations() {
  const reveals = document.querySelectorAll(".reveal");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target) {
        entry.target.classList.add("active");
      }
    });
  }, { threshold: 0.2 });

  reveals.forEach(reveal => observer.observe(reveal));

  // ✅ Parallax effect sécurisé
  const hero = document.querySelector(".hero-section");
  if (hero) {
    document.addEventListener("mousemove", (e) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      hero.style.backgroundPosition = `${50 + x * 20}% ${50 + y * 20}%`;
    });
  }

  // ✅ Logo animation sécurisé
  const logo = document.querySelector(".logo");
  if (logo) {
    logo.style.animation = "spin 30s linear infinite";
    logo.addEventListener("mouseenter", () => {
      logo.style.transform = "scale(1.05)";
      logo.style.filter = "drop-shadow(0 0 10px #E53935)";
    });
    logo.addEventListener("mouseleave", () => {
      logo.style.transform = "scale(1)";
      logo.style.filter = "none";
    });
  }

  // ✅ Inject keyframes si pas déjà injecté
  if (!document.querySelector('#spin-keyframes')) {
    const style = document.createElement('style');
    style.id = 'spin-keyframes';
    style.innerHTML = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}
