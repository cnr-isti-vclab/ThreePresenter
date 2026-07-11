export const DEFAULT_UI_SKIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .tp-icon {
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .tp-icon-fill {
        fill: currentColor;
        stroke: none;
      }
    </style>
  </defs>

  <g class="tp-home">
    <path class="tp-icon" d="M4 10.5L12 4l8 6.5" />
    <path class="tp-icon" d="M6.5 9.5V20h11V9.5" />
    <path class="tp-icon" d="M10 20v-5h4v5" />
  </g>

  <g class="tp-light-on">
    <path class="tp-icon" d="M9 14.5V13a4 4 0 1 1 6 0v1.5" />
    <path class="tp-icon" d="M9.5 17h5" />
    <path class="tp-icon" d="M10.5 20h3" />
    <path class="tp-icon" d="M12 2.5v2" />
    <path class="tp-icon" d="M5.5 5.5l1.5 1.5" />
    <path class="tp-icon" d="M18.5 5.5L17 7" />
    <path class="tp-icon" d="M3 11h2" />
    <path class="tp-icon" d="M19 11h2" />
  </g>

  <g class="tp-light-position">
    <circle class="tp-icon" cx="12" cy="12" r="3.5" />
    <path class="tp-icon" d="M12 3v3" />
    <path class="tp-icon" d="M12 18v3" />
    <path class="tp-icon" d="M3 12h3" />
    <path class="tp-icon" d="M18 12h3" />
    <path class="tp-icon" d="M6 6l2 2" />
    <path class="tp-icon" d="M16 16l2 2" />
    <path class="tp-icon" d="M18 6l-2 2" />
    <path class="tp-icon" d="M6 18l2-2" />
  </g>

  <g class="tp-env-on">
    <circle class="tp-icon" cx="12" cy="12" r="8.5" />
    <path class="tp-icon" d="M3.5 12h17" />
    <path class="tp-icon" d="M12 3.5a12 12 0 0 1 0 17" />
    <path class="tp-icon" d="M12 3.5a12 12 0 0 0 0 17" />
  </g>

  <g class="tp-screenshot">
    <path class="tp-icon" d="M4 8.5h16v10.5H4z" />
    <path class="tp-icon" d="M8 8.5l1.5-2h5L16 8.5" />
    <circle class="tp-icon" cx="12" cy="13.5" r="3.2" />
  </g>

  <g class="tp-camera-perspective">
    <path class="tp-icon" d="M6 8h12v10H6z" />
    <path class="tp-icon" d="M9 11h6" />
    <path class="tp-icon" d="M12 8v10" />
    <path class="tp-icon" d="M6 8l3 3" />
    <path class="tp-icon" d="M18 8l-3 3" />
    <path class="tp-icon" d="M6 18l3-3" />
    <path class="tp-icon" d="M18 18l-3-3" />
  </g>

  <g class="tp-camera-orthographic">
    <rect class="tp-icon" x="5" y="6" width="14" height="12" rx="1" />
    <path class="tp-icon" d="M5 10h14" />
    <path class="tp-icon" d="M10 6v12" />
  </g>

  <g class="tp-annotation">
    <path class="tp-icon" d="M6 18l2.5-.5L18 8l-2-2-9.5 9.5L6 18z" />
    <path class="tp-icon" d="M14 6l2 2" />
  </g>

  <g class="tp-measure">
    <path class="tp-icon" d="M5 15.5L15.5 5l3.5 3.5L8.5 19z" />
    <path class="tp-icon" d="M8 12l1.5 1.5" />
    <path class="tp-icon" d="M11 9l1.5 1.5" />
    <path class="tp-icon" d="M14 6l1.5 1.5" />
  </g>

  <g class="tp-fullscreen-enter">
    <path class="tp-icon" d="M8 4H4v4" />
    <path class="tp-icon" d="M16 4h4v4" />
    <path class="tp-icon" d="M20 16v4h-4" />
    <path class="tp-icon" d="M4 16v4h4" />
  </g>

  <g class="tp-fullscreen-exit">
    <path class="tp-icon" d="M8 9H4V5" />
    <path class="tp-icon" d="M16 9h4V5" />
    <path class="tp-icon" d="M20 15v4h-4" />
    <path class="tp-icon" d="M4 15v4h4" />
    <path class="tp-icon" d="M9 9L4 4" />
    <path class="tp-icon" d="M15 9l5-5" />
    <path class="tp-icon" d="M15 15l5 5" />
    <path class="tp-icon" d="M9 15l-5 5" />
  </g>
</svg>
`;
