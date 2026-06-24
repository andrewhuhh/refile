# Architecture

This app intentionally stays build-free: `index.html` loads ES modules directly from `src/`.

## Module Ownership

- `src/formats.js`: the source of truth for supported input and output file types.
- `src/image-codec.js`: browser image decoding and canvas encoding.
- `src/downloads.js`: safe output names, single-file downloads, and ZIP downloads.
- `src/image-card.js`: per-image UI, file size estimates, and download history.
- `src/dom.js`: shared DOM lookups and small DOM helpers.
- `src/app.js`: application state, event wiring, and cross-module orchestration.

## Adding File Types

Add input types in `INPUT_FORMATS` inside `src/formats.js`. Include both MIME types and extensions because browser-provided MIME metadata is not always reliable.

Add output types in `OUTPUT_FORMATS` only when the app can produce that MIME type. Canvas-native formats are feature-detected at runtime, so browser-specific formats such as AVIF can be exposed safely when available. Custom encoders, such as BMP and SVG, declare an `encoder` key and are implemented in `src/image-codec.js`.

Formats that browsers can display but not animate or preserve exactly, such as GIF and SVG, should include a short `note` explaining the limitation.
