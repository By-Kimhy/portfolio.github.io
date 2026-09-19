function startParticles(dark) {
  if (typeof particlesJS !== "function") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const color = dark ? "#5ee4f0" : "#00b8c9";
  particlesJS("particles-js", {
    particles: {
      number: { value: 100, density: { enable: true, value_area: 900 } },
      color: { value: color },
      shape: { type: "circle" },
      opacity: {
        value: dark ? 0.45 : 0.35,
        random: true,
        anim: { enable: false },
      },
      size: { value: 3, random: true },
      line_linked: {
        enable: true,
        distance: 140,
        color: color,
        opacity: dark ? 0.28 : 0.22,
        width: 1,
      },
      move: {
        enable: true,
        speed: 1.15,
        direction: "none",
        random: false,
        straight: false,
        out_mode: "out",
        bounce: false,
      },
    },
    interactivity: {
      detect_on: "window",
      events: {
        onhover: { enable: true, mode: "grab" },
        onclick: { enable: false },
        resize: true,
      },
      modes: {
        grab: { distance: 150, line_linked: { opacity: 0.5 } },
      },
    },
    retina_detect: true,
  });
}
