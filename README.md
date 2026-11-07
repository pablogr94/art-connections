# Art Connections — playtest

Arrange sixteen artworks into four rows. Drag to exchange two artworks; tap or press Enter to inspect the complete image. Shift + arrow keys exchange adjacent artworks. The viewer's **Original** link opens the reproduction for native browser zoom.

**Submit** checks the current complete arrangement. Anonymous green squares report how many rows agree with one accepted complete solution, without identifying rows or connections. Edits clear the previous feedback; later counts can decrease. There are six unsuccessful submissions available per puzzle. A complete solution wins before spending a try; exhaustion does not reveal answers. All genuine registered eligibility alternatives are retained.

Six puzzles are available through previous/next navigation and direct links `?study=1` through `?study=6`. The root and unknown study IDs open Puzzle 1. Existing `?study=4` links still work. Public puzzles 5 and 6 correspond to the retained internal experiments 007 and 009.

Each puzzle saves its own order, tries and checked feedback in this browser. Valid layouts from the old public app migrate without reordering; old hint-disclosure keys remain untouched, although hints are no longer shown in this anonymous UI. A deliberate `?study=N&reset=puzzle` resets only that puzzle once and removes the reset parameter from the address.

Images prefer exact remote reproduction URLs already recorded with the original boards. Puzzle 6 uses the retained National Gallery services (800px provider maximum); no higher-resolution promise is made. Puzzle 3 retains five historical local reproductions where no reliable HTTPS image URL was recorded. Existing local assets for Puzzles 1–4 remain byte-for-byte unchanged, and can serve as fallback if their recorded remote image fails. No new artwork images were downloaded for this release. Remote availability may change independently of this site.

Run retained legacy tests with `node --test tests/*.test.cjs`. Run locally with `python -m http.server 8800`. No package installation, build step, analytics or backend is required. A modern browser is required.

This remains a curated playtest, not a validated daily puzzle. Exact source metadata is retained in the board data. Artwork and reproduction rights are separate from this code; making an image accessible or linking to it does not establish unrestricted reuse rights. The locally bundled Material Symbols font is distributed with its license in `assets/Material-Symbols-LICENSE.txt`.
