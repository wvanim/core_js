# core_js
WvAnim Project: JS implementation of the Time/Space Interleaved structure (TiSpi)

---

**A step-by-step course to build TiSpi from scratch — do it yourself.**

---

## The concept in one image: Lego bricks

Imagine two types of Lego bars:

- **Blue** bars → can only receive yellow bars
- **Yellow** bars → can only receive blue bars
- Each bar clips **perpendicularly** to the previous one
- A bar can only rest on **one** other bar, but can **carry several**

Result: by following these four rules, children spontaneously build a **regular tree**, where blue and yellow levels alternate, perpendicular to each other.

---

## From metaphor to structure

| Lego | WvAnim | Role |
|---|---|---|
| **Blue** bar | `Piece` | **Time** unit — plays its children one after another |
| **Yellow** bar | `Face` / `Group` | **Space** unit — displays its children simultaneously |

> The mandatory alternation Time → Space → Time naturally forms a tree: **TiSpi** (*Time/Space Interleaved*).

A `Face` can hold any media: image, text, sound, video.

---

## TiSpi tree architecture

```
Piece  (blue — time)
├── Face/image
├── Face/text
├── Face/video
└── Face/Group  (yellow — space)
    └── Piece  (blue — time)
        ├── Face/image
        └── Face/sound
```

Each `Piece` plays its `Face` children **sequentially**.
Each `Face` displays its children **simultaneously**.
Recursion allows animations of arbitrary complexity to be composed.

---

## Demo files

### `tispi001.js` — The minimal stage
A single blue `Piece` animates a sequence of simple yellow `Face` elements.
The most basic case: a linear timeline.

### `tispi002.js` — The tree appears
A yellow `Face` carries in turn a blue `Piece`.
The recursive structure comes into play: we move beyond the straight line into the tree.

---

## Current stage

> minimal and extensible core — basic movements, transitions and nestings are operational

---
