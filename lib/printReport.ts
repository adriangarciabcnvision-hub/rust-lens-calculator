// Exporta un informe a PDF usando el diálogo de impresión nativo del navegador
// ("Guardar como PDF"). Se evita deliberadamente cualquier librería de generación
// de PDF en el cliente (jsPDF y similares arrastran CVEs críticos de XSS/DoS/
// inyección) — ver SECURITY.md.

export interface PrintReportRow {
  label: string;
  value: string;
}

export interface PrintReportSection {
  title: string;
  rows: PrintReportRow[];
}

export function openPrintableReport(reportTitle: string, sections: PrintReportSection[]) {
  const win = window.open('', '_blank', 'width=800,height=1000');
  if (!win) return;

  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const sectionsHtml = sections
    .map(
      (section) => `
      <section>
        <h2>${escapeHtml(section.title)}</h2>
        <table>
          ${section.rows
            .map((r) => `<tr><td class="label">${escapeHtml(r.label)}</td><td class="value">${escapeHtml(r.value)}</td></tr>`)
            .join('')}
        </table>
      </section>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${escapeHtml(reportTitle)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; margin: 0; padding: 32px; }
  header { display: flex; align-items: center; gap: 12px; border-bottom: 3px solid #d5a437; padding-bottom: 12px; margin-bottom: 20px; }
  header img { height: 48px; }
  header h1 { font-size: 20px; margin: 0; color: #8f671f; }
  header p { margin: 2px 0 0; font-size: 12px; color: #666; }
  section { margin-bottom: 18px; break-inside: avoid; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #8f671f; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  td { padding: 4px 6px; }
  td.label { color: #555; width: 45%; }
  td.value { font-weight: bold; color: #111; }
  tr:nth-child(even) { background: #faf7f0; }
  footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 10px; color: #999; text-align: center; }
  @media print {
    body { padding: 12px; }
    button { display: none; }
  }
</style>
</head>
<body>
  <header>
    <img src="/logo.png" alt="EQUIPO RUST" onerror="this.style.display='none'">
    <div>
      <h1>EQUIPO RUST · Informe de Cálculo Óptico</h1>
      <p>${new Date().toLocaleString()}</p>
    </div>
  </header>
  ${sectionsHtml}
  <footer>EQUIPO RUST · Lens Calculator</footer>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
  // Se dispara el print desde la ventana que abrió el popup, sin necesitar un <script>
  // inline dentro del documento generado.
  win.onload = () => setTimeout(() => win.print(), 300);
}
