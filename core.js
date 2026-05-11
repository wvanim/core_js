(function () {
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  class Face {
    constructor(options) {
      this.id = options.id;
      this.element = options.element;
      this.initializer = options.initializer || null;
      this.presenter = options.presenter || function () {};
      this.resetter = options.resetter || function () {};
      this.initialized = false;
    }

    mount(container) {
      if (!this.initialized && this.initializer) {
        this.initializer(this.element);
        this.initialized = true;
      }

      if (!this.element.parentNode) {
        container.appendChild(this.element);
      }
    }

    present(state) {
      this.presenter(this.element, state);
    }

    reset() {
      this.resetter(this.element);
    }
  }

  class Piece {
    constructor(options) {
      this.name = options.name;
      this.duration = options.duration;
      this.perform = options.perform;
    }

    play(context, elapsed) {
      const progress = clamp(elapsed / this.duration, 0, 1);
      this.perform({
        elapsed,
        progress,
        finished: progress >= 1,
        faces: context.faces
      });
    }
  }

  class Scenario {
    constructor(options) {
      this.stage = options.stage;
      this.faces = new Map(options.faces.map((face) => [face.id, face]));
      this.pieces = options.pieces;
      this.totalDuration = this.pieces.reduce(
        (sum, piece) => sum + piece.duration,
        0
      );
      this.startTime = 0;
      this.frameId = 0;
      this.playing = false;
      this.tick = this.tick.bind(this);

      this.faces.forEach((face) => {
        face.mount(this.stage);
        face.reset();
      });
    }

    tick(timestamp) {
      if (!this.playing) {
        return;
      }

      const elapsed = timestamp - this.startTime;
      let offset = 0;

      for (const piece of this.pieces) {
        const localElapsed = clamp(elapsed - offset, 0, piece.duration);
        piece.play(this, localElapsed);
        offset += piece.duration;
      }

      if (elapsed >= this.totalDuration) {
        this.playing = false;
        return;
      }

      this.frameId = window.requestAnimationFrame(this.tick);
    }

    play() {
      if (this.playing) {
        return;
      }

      this.playing = true;
      this.startTime = performance.now();
      this.frameId = window.requestAnimationFrame(this.tick);
    }

    reset() {
      this.playing = false;
      window.cancelAnimationFrame(this.frameId);
      this.faces.forEach((face) => face.reset());
    }
  }

  function setStyles(element, styles) {
    Object.assign(element.style, styles);
  }

  function buildDemo(stage) {
    const card = new Face({
      id: "card",
      element: Object.assign(document.createElement("article"), {
        className: "face card"
      }),
      initializer(element) {
        element.innerHTML = [
          '<span class="badge">FACE = space</span>',
          "<h2>HTML scenarios</h2>",
          "<p></p>"
        ].join("");
      },
      presenter(element, state) {
        const body = element.querySelector("p");
        body.textContent = state.message;
        setStyles(element, {
          opacity: String(state.opacity),
          transform: "translateY(" + state.shift + "px)"
        });
      },
      resetter(element) {
        element.querySelector("p").textContent =
          "Each Face stays independent and only reacts to standard time input.";
        setStyles(element, {
          opacity: "0.2",
          transform: "translateY(18px)"
        });
      }
    });

    const orb = new Face({
      id: "orb",
      element: Object.assign(document.createElement("div"), {
        className: "face orb"
      }),
      presenter(element, state) {
        setStyles(element, {
          opacity: String(state.opacity),
          transform:
            "translate(" +
            state.x +
            "px, " +
            state.y +
            "px) scale(" +
            state.scale +
            ")"
        });
      },
      resetter(element) {
        setStyles(element, {
          opacity: "0.25",
          transform: "translate(0px, 0px) scale(0.85)"
        });
      }
    });

    const panel = new Face({
      id: "panel",
      element: Object.assign(document.createElement("aside"), {
        className: "face panel"
      }),
      initializer(element) {
        element.innerHTML = [
          "<h3>Scenario contract</h3>",
          "<ul>",
          "<li>Pieces describe temporal progression.</li>",
          "<li>Faces expose their own spatial behavior.</li>",
          "<li>Interactive content can live inside a Face.</li>",
          "</ul>",
          '<div class="timeline"><div></div></div>'
        ].join("");
      },
      presenter(element, state) {
        const bar = element.querySelector(".timeline > div");
        bar.style.width = state.progress * 100 + "%";
        setStyles(element, {
          opacity: String(state.opacity),
          transform: "translateX(" + state.shift + "px)"
        });
      },
      resetter(element) {
        const bar = element.querySelector(".timeline > div");
        if (bar) {
          bar.style.width = "0%";
        }

        setStyles(element, {
          opacity: "0.15",
          transform: "translateX(24px)"
        });
      }
    });

    const scenario = new Scenario({
      stage,
      faces: [card, orb, panel],
      pieces: [
        new Piece({
          name: "introduction",
          duration: 1600,
          perform({ progress, faces }) {
            faces.get("card").present({
              message: "A Piece introduces the scene without owning the DOM.",
              opacity: 0.2 + progress * 0.8,
              shift: 18 - progress * 18
            });

            faces.get("orb").present({
              opacity: 0.25 + progress * 0.5,
              x: progress * 110,
              y: -progress * 28,
              scale: 0.85 + progress * 0.35
            });

            faces.get("panel").present({
              opacity: 0.15 + progress * 0.7,
              shift: 24 - progress * 24,
              progress: progress * 0.35
            });
          }
        }),
        new Piece({
          name: "development",
          duration: 1800,
          perform({ progress, faces }) {
            faces.get("card").present({
              message:
                "Another Piece can reuse the same Faces and send a different time state.",
              opacity: 1,
              shift: 0
            });

            faces.get("orb").present({
              opacity: 0.75 + progress * 0.25,
              x: 110 + progress * 230,
              y: -28 - Math.sin(progress * Math.PI) * 42,
              scale: 1.2 - progress * 0.15
            });

            faces.get("panel").present({
              opacity: 0.85 + progress * 0.15,
              shift: 0,
              progress: 0.35 + progress * 0.4
            });
          }
        }),
        new Piece({
          name: "handoff",
          duration: 1600,
          perform({ progress, faces }) {
            faces.get("card").present({
              message:
                "A Face may itself contain rich behavior: media, forms, games or nested Pieces.",
              opacity: 1,
              shift: -progress * 10
            });

            faces.get("orb").present({
              opacity: 1 - progress * 0.15,
              x: 340 + progress * 140,
              y: -28 + progress * 56,
              scale: 1.05 + progress * 0.2
            });

            faces.get("panel").present({
              opacity: 1,
              shift: 0,
              progress: 0.75 + progress * 0.25
            });
          }
        })
      ]
    });

    return scenario;
  }

  const stage = document.getElementById("stage");
  const playButton = document.getElementById("play");
  const resetButton = document.getElementById("reset");

  if (stage && playButton && resetButton) {
    const scenario = buildDemo(stage);
    const params = new URLSearchParams(window.location.search);

    playButton.addEventListener("click", function () {
      scenario.reset();
      scenario.play();
    });

    resetButton.addEventListener("click", function () {
      scenario.reset();
    });

    window.Face = Face;
    window.Piece = Piece;
    window.Scenario = Scenario;

    if (params.get("autoplay") === "1") {
      scenario.reset();
      scenario.play();
    }
  }
})();
