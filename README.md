# core_js
Programmation JS de WvAnim

JavaScript program for displaying HTML scenarios: WvAnim.
Do it yourself. This can serve as a model for developing personal tools.

This model is built on a strict separation between Time and Space.

* Time: called a Piece
* Space: called a Face

This gives us an extremely lightweight core with unlimited extensibility.

Note: what I call a Face originally refers to fixed elements:

* images,
* text,
* geometric shapes...

But a Face may also contain its own temporal behavior:

* animated GIF,
* sound,
* video,
* group of Pieces.

In that case, it becomes an independent internal behavior or a standardized exchange with Time.

A Face is not limited:
it can be a form, a game, or any interactive structure.

The only constraint is the standardized interaction with Pieces.
