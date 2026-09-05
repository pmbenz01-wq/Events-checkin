// Renders a real, scannable QR code as an inline SVG (fill: currentColor),
// using the vendored qrcode-generator library (vendor/qrcode.js).
window.renderQrSvg = function renderQrSvg(payload) {
  const qr = qrcode(0, "M"); // type 0 = auto-size, error correction level M
  qr.addData(String(payload));
  qr.make();
  const n = qr.getModuleCount();
  let d = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) d += `M${c},${r}h1v1h-1Z`;
    }
  }
  return `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" width="100%" height="100%" shape-rendering="crispEdges" style="display:block"><path d="${d}" fill="currentColor"/></svg>`;
};
