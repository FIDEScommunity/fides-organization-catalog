(function () {
  "use strict";

  const duration = 4500;

  function animateValue(element, target) {
    let startTime = null;
    element.textContent = "0";

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      element.textContent = String(Math.round(target * eased));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.textContent = String(target);
      }
    }

    window.requestAnimationFrame(step);
  }

  function initCounters(showcase) {
    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    showcase.querySelectorAll(".fides-org-showcase__count[data-count]").forEach((element) => {
      const target = Number.parseInt(element.getAttribute("data-count"), 10);
      if (!Number.isFinite(target) || target < 0) return;
      if (reducedMotion) {
        element.textContent = String(target);
      } else {
        animateValue(element, target);
      }
    });
  }

  function initCarousel(carousel) {
    const viewport = carousel.querySelector(".fides-org-showcase__viewport");
    const track = carousel.querySelector(".fides-org-showcase__track");
    const cards = Array.from(carousel.querySelectorAll(".fides-org-showcase__card"));
    const previous = carousel.querySelector('[data-carousel-direction="-1"]');
    const next = carousel.querySelector('[data-carousel-direction="1"]');
    const position = carousel.querySelector("[data-carousel-position]");
    if (!viewport || !track || !cards.length || !previous || !next) return;

    function measurements() {
      const cardWidth = cards[0].getBoundingClientRect().width;
      const styles = window.getComputedStyle(track);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
      const step = Math.max(1, cardWidth + gap);
      const visible = Math.max(1, Math.round(viewport.clientWidth / step));
      return {
        step,
        visible,
        pages: Math.max(1, Math.ceil(cards.length / visible)),
      };
    }

    function update() {
      const { step, visible, pages } = measurements();
      const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      const currentCard = Math.round(viewport.scrollLeft / step);
      const currentPage = Math.min(pages, Math.floor(currentCard / visible) + 1);
      previous.disabled = viewport.scrollLeft <= 2;
      next.disabled = viewport.scrollLeft >= maxScroll - 2;
      previous.hidden = maxScroll <= 2;
      next.hidden = maxScroll <= 2;
      if (position) {
        position.hidden = maxScroll <= 2;
        position.textContent = `${currentPage} / ${pages}`;
      }
    }

    carousel.querySelectorAll("[data-carousel-direction]").forEach((button) => {
      button.addEventListener("click", () => {
        const direction = Number.parseInt(button.getAttribute("data-carousel-direction"), 10) || 1;
        const { step, visible } = measurements();
        viewport.scrollBy({ left: direction * step * visible, behavior: "smooth" });
      });
    });

    let updateFrame = 0;
    viewport.addEventListener(
      "scroll",
      () => {
        window.cancelAnimationFrame(updateFrame);
        updateFrame = window.requestAnimationFrame(update);
      },
      { passive: true },
    );
    if (typeof window.ResizeObserver === "function") {
      const resizeObserver = new ResizeObserver(update);
      resizeObserver.observe(viewport);
    } else {
      window.addEventListener("resize", update);
    }
    update();
  }

  function init() {
    const showcases = document.querySelectorAll(".fides-org-showcase");
    showcases.forEach((showcase) => {
      const carousel = showcase.querySelector("[data-fides-org-carousel]");
      if (carousel) initCarousel(carousel);
    });
    if (!showcases.length) return;

    if (typeof window.IntersectionObserver !== "function") {
      showcases.forEach(initCounters);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          initCounters(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px", threshold: 0.1 },
    );
    showcases.forEach((showcase) => observer.observe(showcase));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
