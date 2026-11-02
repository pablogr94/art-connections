# Art Connections — playtest

A small visual grouping prototype. Arrange sixteen artworks into four rows by dragging to swap two tiles. Tap an image to inspect the complete artwork.

Categories are hidden initially. Each press of **Pedir pista** reveals one category, up to four. Layout and requested hints are saved in the current browser. This is a curated experiment, not a validated daily puzzle; alternative connections may be possible.

Use the header selector to switch between **Estudio 1** and **Estudio 2**. Direct links use `?study=1` or `?study=2`; existing links with no query still open Study 1. Each study keeps its own layout and hints, including existing Study 1 progress. Unknown study values fall back to Study 1. Titles and category answers are not shown by the selector.

Run locally with `python -m http.server 8792`, or open index.html in a modern browser. There are no dependencies or analytics.

Images reproduce the same research references used in the local playtest. Artwork source links are included in the inspection modal and board.js. Artwork rights are separate from this prototype's code; this repository does not grant rights to third-party artworks or claim that all reproductions are cleared for unrestricted reuse.
