/* ==========================================================================
   Buzz — landing site behaviour
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var BEE_PATH =
    "M128 70.3 A91.7 91.7 0 1 0 128 238.7 Z M338 70.3 A91.7 91.7 0 1 1 338 238.7 Z " +
    "M162 0 H304 A34 34 0 0 1 338 34 V275 A34 34 0 0 1 304 309 H162 A34 34 0 0 1 128 275 V34 A34 34 0 0 1 162 0 Z " +
    "M220.3 84.4 A27 27 0 1 1 166.3 84.4 A27 27 0 1 1 220.3 84.4 Z " +
    "M303 84.4 A27 27 0 1 1 249 84.4 A27 27 0 1 1 303 84.4 Z " +
    "M171.3 157.2 H298.2 A5 5 0 0 1 303.2 162.2 V190.5 A5 5 0 0 1 298.2 195.5 H171.3 A5 5 0 0 1 166.3 190.5 V162.2 A5 5 0 0 1 171.3 157.2 Z " +
    "M171.9 235.1 H298.1 A5 5 0 0 1 303.1 240.1 V267.7 A5 5 0 0 1 298.1 272.7 H171.9 A5 5 0 0 1 166.9 267.7 V240.1 A5 5 0 0 1 171.9 235.1 Z";

  var BEE_COLORS = ["rgb(219, 250, 82)", "rgb(215, 231, 245)"];

  function beeSvg(color, flapDelay) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "bee-sprite");
    svg.setAttribute("viewBox", "0 0 466 309");
    svg.setAttribute("width", "46");
    svg.setAttribute("height", "31");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.style.setProperty("--flap-delay", flapDelay + "s");
    if (color) svg.style.color = color;
    var title = document.createElementNS(ns, "title");
    title.textContent = "Animated bee";
    var path = document.createElementNS(ns, "path");
    path.setAttribute("d", BEE_PATH);
    path.setAttribute("fill", "currentColor");
    path.setAttribute("fill-rule", "evenodd");
    path.setAttribute("clip-rule", "evenodd");
    svg.appendChild(title);
    svg.appendChild(path);
    return svg;
  }

  /* ------------------------------------------------------------------ bees */

  var FIELDS = {
    "hero-back": 11,
    "hero-front": 13,
    cta: 7,
    footer: 14
  };

  var fields = [];

  function buildField(el, count, seed) {
    var bees = [];
    for (var i = 0; i < count; i++) {
      var span = document.createElement("span");
      span.className = "bee";
      var color = BEE_COLORS[(i + seed) % BEE_COLORS.length];
      span.appendChild(beeSvg(color, -(((i * 37 + seed * 13) % 520) / 100)));
      el.appendChild(span);
      bees.push({
        el: span,
        bx: ((i * 61 + seed * 29) % 100) / 100,
        by: ((i * 43 + seed * 17) % 100) / 100,
        ax: 6 + ((i * 23 + seed) % 16),
        ay: 5 + ((i * 31 + seed) % 14),
        sx: 0.11 + ((i * 7 + seed) % 9) / 46,
        sy: 0.09 + ((i * 11 + seed) % 8) / 41,
        px: ((i * 97 + seed * 7) % 628) / 100,
        py: ((i * 53 + seed * 11) % 628) / 100,
        drift: 0.006 + ((i % 5) * 0.0022),
        lastX: 0,
        lastY: 0,
        angle: 0
      });
    }
    return { el: el, bees: bees, w: 0, h: 0, visible: false };
  }

  Object.keys(FIELDS).forEach(function (name, idx) {
    var el = document.querySelector('[data-bee-field="' + name + '"]');
    if (el) fields.push(buildField(el, FIELDS[name], idx + 1));
  });

  function measureFields() {
    fields.forEach(function (f) {
      var r = f.el.getBoundingClientRect();
      f.w = r.width;
      f.h = r.height;
    });
  }
  measureFields();
  window.addEventListener("resize", measureFields);

  if ("IntersectionObserver" in window) {
    var fieldObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          fields.forEach(function (f) {
            if (f.el === entry.target) f.visible = entry.isIntersecting;
          });
        });
      },
      { rootMargin: "20% 0px" }
    );
    fields.forEach(function (f) { fieldObserver.observe(f.el); });
  } else {
    fields.forEach(function (f) { f.visible = true; });
  }

  function flyBees(t) {
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      if (!f.visible || !f.w) continue;
      for (var j = 0; j < f.bees.length; j++) {
        var b = f.bees[j];
        var wanderX = (b.bx + Math.sin(t * b.drift + b.px) * 0.09) * f.w;
        var wanderY = (b.by + Math.cos(t * b.drift * 1.21 + b.py) * 0.11) * f.h;
        var x = wanderX + Math.sin(t * b.sx * 0.01 + b.px) * b.ax;
        var y = wanderY + Math.cos(t * b.sy * 0.01 + b.py) * b.ay;
        var dx = x - b.lastX;
        var dy = y - b.lastY;
        if (dx || dy) {
          var target = (Math.atan2(dy, dx) * 180) / Math.PI;
          var delta = ((target - b.angle + 540) % 360) - 180;
          b.angle += delta * 0.08;
        }
        b.lastX = x;
        b.lastY = y;
        b.el.style.transform =
          "translate(" + x.toFixed(2) + "px, " + y.toFixed(2) + "px) rotate(" +
          b.angle.toFixed(2) + "deg) scale(0.58)";
      }
    }
  }

  /* -------------------------------------------------- scrolling background */

  var SECTION_COLORS = {
    hero: [247, 168, 200],
    how: [247, 168, 200],
    compare: [215, 231, 245],
    pricing: [158, 203, 245],
    modes: [158, 203, 245],
    details: [215, 231, 245],
    key: [215, 231, 245],
    platforms: [247, 168, 200],
    questions: [247, 168, 200],
    footer: [247, 168, 200]
  };

  var anchors = [];

  function measureAnchors() {
    anchors = [];
    var sections = document.querySelectorAll("[data-bg-section]");
    for (var i = 0; i < sections.length; i++) {
      var el = sections[i];
      var name = el.getAttribute("data-bg-section");
      var color = SECTION_COLORS[name];
      if (!color) continue;
      var box = el.getBoundingClientRect();
      var top = box.top + window.scrollY;
      anchors.push({ pos: top + box.height * 0.5, color: color });
    }
    anchors.sort(function (a, b) { return a.pos - b.pos; });
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function paintBackground() {
    if (!anchors.length) return;
    var center = window.scrollY + window.innerHeight / 2;
    var color = anchors[0].color;
    if (center <= anchors[0].pos) {
      color = anchors[0].color;
    } else if (center >= anchors[anchors.length - 1].pos) {
      color = anchors[anchors.length - 1].color;
    } else {
      for (var i = 0; i < anchors.length - 1; i++) {
        var a = anchors[i];
        var b = anchors[i + 1];
        if (center >= a.pos && center <= b.pos) {
          var t = (center - a.pos) / (b.pos - a.pos);
          // hold each section's own colour, then cross-fade through the middle
          t = Math.min(1, Math.max(0, (t - 0.32) / 0.36));
          t = t * t * (3 - 2 * t);
          color = [
            lerp(a.color[0], b.color[0], t),
            lerp(a.color[1], b.color[1], t),
            lerp(a.color[2], b.color[2], t)
          ];
          break;
        }
      }
    }
    var rgb =
      "rgb(" + Math.round(color[0]) + ", " + Math.round(color[1]) + ", " +
      Math.round(color[2]) + ")";
    root.style.setProperty("--bg-top", rgb);
    var lum = (color[0] * 0.299 + color[1] * 0.587 + color[2] * 0.114) / 255;
    root.style.setProperty(
      "--buzz-dot",
      lum > 0.55 ? "rgba(35, 30, 30, 0.16)" : "rgba(35, 30, 30, 0.22)"
    );
  }

  measureAnchors();
  paintBackground();
  window.addEventListener("resize", function () {
    measureAnchors();
    paintBackground();
  });
  window.addEventListener("load", function () {
    measureAnchors();
    measureFields();
    paintBackground();
  });

  /* ---------------------------------------------------------- render loop */

  var scrollDirty = true;
  window.addEventListener("scroll", function () { scrollDirty = true; }, { passive: true });

  function frame(now) {
    if (scrollDirty) {
      paintBackground();
      scrollDirty = false;
    }
    if (!reduceMotion) flyBees(now / 16.6667);
    window.requestAnimationFrame(frame);
  }
  window.requestAnimationFrame(frame);

  /* ---------------------------------------------------------- reveal on scroll */

  var revealables = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var siblings = el.parentElement
            ? Array.prototype.filter.call(el.parentElement.children, function (n) {
                return n.hasAttribute && n.hasAttribute("data-reveal");
              })
            : [];
          var index = siblings.indexOf(el);
          el.style.transitionDelay = (index > 0 ? index * 0.09 : 0) + "s";
          el.classList.add("is-in");
          revealObserver.unobserve(el);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    Array.prototype.forEach.call(revealables, function (el) { revealObserver.observe(el); });
  } else {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add("is-in"); });
  }

  /* ------------------------------------------------------------- feature bees */

  Array.prototype.forEach.call(
    document.querySelectorAll(".feature-card-figure[data-avatar]"),
    function (figure, i) {
      var holder = document.createElement("span");
      holder.className = "bee";
      holder.appendChild(beeSvg(null, -(i * 0.4)));
      figure.appendChild(holder);
    }
  );

  /* ------------------------------------------------------- logo: blink + top */

  var logoButton = document.querySelector(".chrome-logo");
  if (logoButton) {
    var blinkers = logoButton.querySelectorAll("animate");
    var blink = function () {
      Array.prototype.forEach.call(blinkers, function (node) {
        if (typeof node.beginElement === "function") {
          try { node.beginElement(); } catch (err) { /* noop */ }
        }
      });
    };
    logoButton.addEventListener("mouseenter", blink);
    logoButton.addEventListener("click", function () {
      blink();
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
    if (!reduceMotion) {
      window.setInterval(function () {
        if (Math.random() > 0.55) blink();
      }, 5200);
    }
  }

  /* ------------------------------------------------------------- scroll cue */

  Array.prototype.forEach.call(document.querySelectorAll("[data-scroll-to]"), function (btn) {
    btn.addEventListener("click", function () {
      var target = document.querySelector(btn.getAttribute("data-scroll-to"));
      if (target) {
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }
    });
  });

  /* ------------------------------------------------ play videos in view */

  // Muted, looping clips play only while on screen, and never under reduced
  // motion — there the poster stands in and native controls are offered.
  Array.prototype.forEach.call(document.querySelectorAll("video[data-autoplay]"), function (video) {
    if (reduceMotion) {
      video.controls = true;
      return;
    }
    if (!("IntersectionObserver" in window)) {
      video.play().catch(function () { /* autoplay refused: poster stays */ });
      return;
    }
    new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            video.play().catch(function () { /* autoplay refused: poster stays */ });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.35 }
    ).observe(video);
  });

  /* ----------------------------------------------------------- typewriter */

  var typeTarget = document.querySelector("[data-typewriter]");
  if (typeTarget) {
    var PHRASE = "The only way out is a walk.";
    if (reduceMotion) {
      typeTarget.textContent = PHRASE;
    } else {
      var started = false;
      var typePhrase = function () {
        var i = 0;
        (function step() {
          typeTarget.textContent = PHRASE.slice(0, i);
          if (i++ <= PHRASE.length) window.setTimeout(step, 52);
        })();
      };
      var startType = function () {
        if (started) return;
        started = true;
        typePhrase();
      };
      if ("IntersectionObserver" in window) {
        var typeObserver = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) startType();
            });
          },
          { threshold: 0.4 }
        );
        typeObserver.observe(typeTarget.closest(".footer-content") || typeTarget);
      } else {
        startType();
      }
    }
  }

  /* -------------------------------------------------- fuzz filter scaling */

  var fuzzTarget = document.querySelector("[data-fuzz]");
  var heroBlur = document.querySelector("#buzz-fuzz-hero feGaussianBlur");
  var heroDisplace = document.querySelector("#buzz-fuzz-hero feDisplacementMap");

  function tuneFuzz() {
    if (!fuzzTarget || !heroBlur || !heroDisplace) return;
    var size = parseFloat(window.getComputedStyle(fuzzTarget).fontSize) || 380;
    var ratio = size / 380; // the filter constants are tuned for a 380px wordmark
    heroBlur.setAttribute("stdDeviation", (9.6 * ratio).toFixed(2));
    heroDisplace.setAttribute("scale", (14.4 * ratio).toFixed(2));
  }
  tuneFuzz();
  window.addEventListener("resize", tuneFuzz);
  window.addEventListener("load", tuneFuzz);

})();
