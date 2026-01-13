/**
 * Utilidades para generación de PDFs
 */

/**
 * Generar PDF de conteo y retornar como Blob
 */
export async function generarPDFConteoBlob(almacen, sesion) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text(`Inventario ${almacen.toUpperCase()} – ${sesion.numero}`, 40, 40);
  doc.setFontSize(10);
  doc.text(
    `Registrado por: ${sesion.registrado} · Inicio: ${sesion.inicio} · Fin: ${sesion.fin || ""} ${sesion.tienda ? "· Tienda: " + sesion.tienda : ""}`,
    40,
    58
  );
  
  const body = sesion.filas.map((f) => [
    f.item,
    f.producto,
    f.codigo,
    f.cantidad.toString(),
    f.unidad_medida,
  ]);
  
  autoTable(doc, {
    startY: 80,
    head: [["Item", "Producto", "Código", "Cantidad", "UM"]],
    body,
  });
  
  const blob = doc.output("blob");
  return blob;
}

/**
 * Generar PDF de comparación
 */
export async function generarPDFComparacion(comparacion, filtros = {}) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text("Comparación de Inventario", 40, 40);
  doc.setFontSize(10);
  doc.text(
    `Almacén: ${comparacion.almacen?.toUpperCase() || ""}   Inventario: ${comparacion.numero || ""}   Fecha: ${comparacion.fecha || ""}`,
    40,
    58
  );
  
  let filas = comparacion.filas || [];
  
  // Aplicar filtros
  if (filtros.texto) {
    const txt = filtros.texto.toLowerCase();
    filas = filas.filter(
      (f) =>
        String(f.codigo || "").toLowerCase().includes(txt) ||
        String(f.producto || "").toLowerCase().includes(txt)
    );
  }
  
  if (filtros.estado === "OK") {
    filas = filas.filter((f) => f.res === 0);
  } else if (filtros.estado === "BAD") {
    filas = filas.filter((f) => f.res !== 0);
  }
  
  const rows = filas.map((f) => [
    f.item,
    f.producto,
    f.codigo,
    String(f.sis),
    String(f.fis),
    String(f.res),
    f.estado,
  ]);
  
  autoTable(doc, {
    startY: 74,
    head: [["Item", "Producto", "Código", "Sis", "Fis", "Res", "Estado"]],
    body: rows,
  });
  
  const blob = doc.output("blob");
  return blob;
}

/**
 * Generar PDF de proforma
 */
export async function generarPDFProforma(pf) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text(`Simulación de Proforma – ${pf.num}`, 40, 40);
  doc.setFontSize(10);
  doc.text(
    `Fecha: ${pf.fecha} · Asesor: ${pf.asesor} · Registrado: ${pf.registrado} · Almacén: ${pf.almacen.toUpperCase()}`,
    40,
    58
  );
  
  const body = pf.lineas.map((l) => [l.producto || l.codigo, l.um, l.cant.toString()]);
  
  autoTable(doc, {
    startY: 80,
    head: [["Producto", "UM", "Cantidad"]],
    body,
  });
  
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

/**
 * Exportar a Excel usando SheetJS
 */
export async function exportarAExcel(data, nombreArchivo = "export.xlsx") {
  if (typeof window === "undefined") return;
  
  let XLSX;
  if (window.XLSX) {
    XLSX = window.XLSX;
  } else {
    XLSX = await import("xlsx");
  }
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Datos");
  XLSX.writeFile(wb, nombreArchivo);
}
