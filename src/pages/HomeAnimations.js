// HomeAnimations.js
export function setupAnimations() {
    const reveals = document.querySelectorAll(".reveal");
  
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    }, { threshold: 0.2 });
  
    reveals.forEach(reveal => observer.observe(reveal));
  }
  
    // Parallax effect
    const hero = document.querySelector(".hero-section");
    document.addEventListener("mousemove", (e) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      hero.style.backgroundPosition = `${50 + x * 20}% ${50 + y * 20}%`;
    });
  
    // Logo animation
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
  
  
  // Petite animation de rotation
  const style = document.createElement('style');
  style.innerHTML = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }`;
  document.head.appendChild(style);
  