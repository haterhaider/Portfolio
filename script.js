document.documentElement.classList.add("js");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("is-visible", entry.isIntersecting);
    });
  },
  {
    root: null,
    threshold: 0.16,
    rootMargin: "-8% 0px -8% 0px",
  }
);

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

function setupTiltMedia() {
  if (reducedMotion.matches) return;

  document.querySelectorAll(".tilt-media").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      element.style.setProperty("--tilt-x", `${x * 8}deg`);
      element.style.setProperty("--tilt-y", `${y * -8}deg`);
      element.style.setProperty("--shift-x", `${x * 10}px`);
      element.style.setProperty("--shift-y", `${y * 10}px`);
    });

    element.addEventListener("pointerleave", () => {
      element.style.setProperty("--tilt-x", "0deg");
      element.style.setProperty("--tilt-y", "0deg");
      element.style.setProperty("--shift-x", "0px");
      element.style.setProperty("--shift-y", "0px");
    });
  });
}

function setupSkillCarousel() {
  const viewport = document.querySelector(".carousel-viewport");
  const track = document.querySelector(".carousel-track");

  if (!viewport || !track) return;

  const originals = Array.from(track.children);
  originals.forEach((child) => {
    track.appendChild(child.cloneNode(true));
  });

  let offset = 0;
  let dragStartX = 0;
  let offsetStart = 0;
  let isDragging = false;
  let isHovering = false;
  let lastTime = performance.now();

  const getLoopWidth = () => track.scrollWidth / 2;

  function normalizeOffset() {
    const loopWidth = getLoopWidth();
    if (!loopWidth) return;

    while (offset <= -loopWidth) offset += loopWidth;
    while (offset > 0) offset -= loopWidth;
  }

  function render() {
    normalizeOffset();
    track.style.transform = `translate3d(${offset}px, 0, 0)`;
  }

  function animate(now) {
    const delta = now - lastTime;
    lastTime = now;

    if (!reducedMotion.matches && !isDragging) {
      offset -= delta * (isHovering ? 0.008 : 0.025);
      render();
    }

    requestAnimationFrame(animate);
  }

  viewport.addEventListener("pointerdown", (event) => {
    isDragging = true;
    dragStartX = event.clientX;
    offsetStart = offset;
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    offset = offsetStart + event.clientX - dragStartX;
    render();
  });

  function stopDragging(event) {
    if (!isDragging) return;
    isDragging = false;
    viewport.releasePointerCapture?.(event.pointerId);
  }

  viewport.addEventListener("pointerup", stopDragging);
  viewport.addEventListener("pointercancel", stopDragging);
  viewport.addEventListener("mouseenter", () => {
    isHovering = true;
  });
  viewport.addEventListener("mouseleave", () => {
    isHovering = false;
  });

  viewport.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      offset -= 80;
      render();
    }
    if (event.key === "ArrowLeft") {
      offset += 80;
      render();
    }
  });

  render();
  requestAnimationFrame(animate);
}

function setupScienceGraph() {
  const visual = document.querySelector(".science-visual");
  const card = document.querySelector(".concentration-card");
  const nodes = document.querySelectorAll("[data-concentration]");

  if (!visual || !card || !nodes.length) return;

  const content = {
    "computer-science": {
      title: "Computer Science",
      body: "Building logical problem-solving skills and understanding how complex systems work.",
    },
    neuroscience: {
      title: "Neuroscience",
      body: "Exploring the brain systems behind cognitive processes.",
    },
    psychology: {
      title: "Psychology",
      body: "Understanding human behavior and how to measure it.",
    },
    linguistics: {
      title: "Linguistics",
      body: "Studying how language influences communication.",
    },
    philosophy: {
      title: "Philosophy",
      body: "Examining reasoning and the questions that shape how we think.",
    },
    credential: {
      title: "Credentials",
      body: `
        <div class="credential-card-content">
          <div class="credential-tabs" role="tablist" aria-label="Credential status">
            <button class="credential-tab is-active" type="button" data-credential-tab="completed">Completed</button>
            <button class="credential-tab" type="button" data-credential-tab="progress">In progress</button>
          </div>
          <div class="credential-mailbox" data-credential-list></div>
        </div>
      `,
      html: true,
    },
  };

  const credentialItems = {
    completed: [
      {
        title: "HubSpot Digital Marketing Certified",
        meta: "Complete",
        body: "Always learning and improving through practical digital marketing systems.",
        image: "assets/hubspot-certificate.png",
      },
      {
        title: "This Website",
        meta: "Complete",
        body: "Learned a lot making this place actually",
      },
    ],
    progress: [
      {
        title: "Google Digital Marketing",
        meta: "In progress",
        body: "exploring googles SEO and Google ads course",
      },
      {
        title: "UVA marketing analysis",
        meta: "In progress",
        body: "Applying data analysis and audience research to marketing decisions.",
      },
    ],
  };

  let activeKey = "psychology";
  let switchTimer;

  function setActive(nextKey) {
    if (!content[nextKey] || nextKey === activeKey) return;

    activeKey = nextKey;
    clearTimeout(switchTimer);
    card.classList.add("is-switching");

    switchTimer = window.setTimeout(() => {
      const next = content[nextKey];
      card.querySelector("h3").textContent = next.title;
      const body = card.querySelector("p:not(.section-label)");
      if (next.html) {
        body.outerHTML = next.body;
        setupCredentialPanel();
      } else {
        const richBody = card.querySelector(".credential-card-content");
        if (richBody) {
          richBody.outerHTML = "<p></p>";
        }
        card.querySelector("p:not(.section-label)").textContent = next.body;
      }
      card.classList.remove("is-switching");
    }, reducedMotion.matches ? 0 : 160);

    nodes.forEach((node) => {
      const isActive = node.dataset.concentration === nextKey;
      node.classList.toggle("is-active", isActive);
      node.setAttribute("aria-pressed", String(isActive));
    });
  }

  nodes.forEach((node) => {
    node.addEventListener("click", () => setActive(node.dataset.concentration));
  });

  function setupCredentialPanel() {
    const panel = card.querySelector(".credential-card-content");
    const list = card.querySelector("[data-credential-list]");
    const tabs = card.querySelectorAll("[data-credential-tab]");

    if (!panel || !list || !tabs.length) return;

    let activeTab = "completed";
    let openIndex = null;

    function detailMarkup(item) {
      return `
        <div class="credential-detail">
        <h4>${item.title}</h4>
        <p>${item.body}</p>
        ${item.image ? `<img class="credential-thumb" src="${item.image}" alt="${item.title} certificate">` : ""}
        </div>
      `;
    }

    function setupCertificatePreview(scope) {
      const image = scope.querySelector(".credential-thumb");
      image?.addEventListener("click", (event) => {
        event.stopPropagation();
        document.querySelector(".image-modal")?.removeAttribute("hidden");
      });
    }

    function renderList() {
      list.innerHTML = "";
      credentialItems[activeTab].forEach((item, index) => {
        const entry = document.createElement("div");
        entry.className = "credential-entry";

        const row = document.createElement("button");
        const isOpen = openIndex === index;
        row.className = `credential-row credential-row-${activeTab}${isOpen ? " is-active" : ""}`;
        row.type = "button";
        row.setAttribute("aria-expanded", String(isOpen));
        row.innerHTML = `
          <span>
            <strong>${item.title}</strong>
          </span>
          <em class="credential-status">${item.meta}</em>
        `;
        row.addEventListener("click", () => {
          openIndex = openIndex === index ? null : index;
          renderList();
        });

        entry.appendChild(row);

        if (isOpen) {
          entry.insertAdjacentHTML("beforeend", detailMarkup(item));
          setupCertificatePreview(entry);
        }

        list.appendChild(entry);
      });
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        activeTab = tab.dataset.credentialTab;
        openIndex = null;
        tabs.forEach((other) => other.classList.toggle("is-active", other === tab));
        renderList();
      });
    });

    renderList();
  }
}

function setupScienceCopyPin() {
  const section = document.querySelector(".science-section");
  const visual = document.querySelector(".science-visual");
  const pin = document.querySelector(".science-copy-pin");
  const desktopQuery = window.matchMedia("(min-width: 981px)");

  if (!section || !visual || !pin) return;

  let frameId;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function reset() {
    pin.style.setProperty("--science-copy-shift", "0px");
  }

  function update() {
    frameId = undefined;

    if (reducedMotion.matches || !desktopQuery.matches) {
      reset();
      return;
    }

    const sectionRect = section.getBoundingClientRect();
    const visualRect = visual.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const sectionTop = scrollY + sectionRect.top;
    const visualTop = scrollY + visualRect.top;
    const visualBottom = scrollY + visualRect.bottom;
    const start = Math.max(sectionTop, visualTop - window.innerHeight * 0.58);
    const end = Math.max(start + 1, visualBottom - window.innerHeight * 0.72);
    const progress = clamp((scrollY - start) / (end - start), 0, 1);
    const maxShift = Math.min(visualRect.height * 0.42, window.innerHeight * 0.32, 260);

    pin.style.setProperty("--science-copy-shift", `${Math.round(progress * maxShift)}px`);
  }

  function schedule() {
    if (!frameId) frameId = requestAnimationFrame(update);
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  reducedMotion.addEventListener?.("change", schedule);
  desktopQuery.addEventListener?.("change", schedule);
  update();
}

function setupImageModal() {
  const modal = document.querySelector(".image-modal");
  const closeButton = document.querySelector(".image-modal-close");

  if (!modal || !closeButton) return;

  closeButton.addEventListener("click", () => {
    modal.setAttribute("hidden", "");
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.setAttribute("hidden", "");
    }
  });
}

function setupWorkVideoParallax() {
  const section = document.querySelector(".work-section");
  const video = document.querySelector(".work-video-bg video");
  const proof = document.querySelector(".proof-panel");

  if (!section || !video || reducedMotion.matches) return;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let frameId;

  function render() {
    currentX += (targetX - currentX) * 0.14;
    currentY += (targetY - currentY) * 0.14;
    video.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(1.16)`;

    if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
      frameId = requestAnimationFrame(render);
    } else {
      frameId = undefined;
    }
  }

  function schedule() {
    if (!frameId) frameId = requestAnimationFrame(render);
  }

  section.addEventListener("pointermove", (event) => {
    const rect = section.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    targetX = x * -54;
    targetY = y * -34;
    proof?.style.setProperty("--proof-x", `${(x + 0.5) * 100}%`);
    proof?.style.setProperty("--proof-y", `${(y + 0.5) * 100}%`);
    schedule();
  });

  section.addEventListener("pointerleave", () => {
    targetX = 0;
    targetY = 0;
    proof?.style.setProperty("--proof-x", "50%");
    proof?.style.setProperty("--proof-y", "50%");
    schedule();
  });
}

function setupStatCounters() {
  const stats = document.querySelectorAll("[data-count-to]");

  if (!stats.length) return;

  function formatStat(element, value) {
    const prefix = element.dataset.countPrefix || "";
    const suffix = element.dataset.countSuffix || "";
    element.textContent = `${prefix}${Math.round(value)}${suffix}`;
  }

  function animateStat(element) {
    const target = Number(element.dataset.countTo || 0);
    const duration = 1100;
    const start = performance.now();

    if (reducedMotion.matches) {
      formatStat(element, target);
      return;
    }

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      formatStat(element, target * eased);

      if (progress < 1 && element.dataset.counting === "true") {
        requestAnimationFrame(tick);
      }
    }

    element.dataset.counting = "true";
    requestAnimationFrame(tick);
  }

  const statObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const stat = entry.target;
        const target = Number(stat.dataset.countTo || 0);
        const statCell = stat.closest(".stat-grid > div");

        if (entry.isIntersecting) {
          statCell?.classList.add("is-animated");
          animateStat(stat);
        } else {
          statCell?.classList.remove("is-animated");
          stat.dataset.counting = "false";
          formatStat(stat, reducedMotion.matches ? target : 0);
        }
      });
    },
    {
      threshold: 0.45,
    }
  );

  stats.forEach((stat) => {
    statObserver.observe(stat);
  });
}

function setupVideoLoops() {
  document.querySelectorAll("video[data-loop-end]").forEach((video) => {
    const start = Number(video.dataset.loopStart || 0);
    const end = Number(video.dataset.loopEnd || 0);
    if (!end) return;

    video.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(start) && video.currentTime < start) {
        video.currentTime = start;
      }
    });

    video.addEventListener("timeupdate", () => {
      if (video.currentTime >= end) {
        video.currentTime = start;
        video.play().catch(() => {});
      }
    });
  });
}

setupTiltMedia();
setupSkillCarousel();
setupScienceGraph();
setupScienceCopyPin();
setupImageModal();
setupWorkVideoParallax();
setupStatCounters();
setupVideoLoops();
