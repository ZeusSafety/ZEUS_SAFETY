/**
 * Módulo de Componentes - PDF
 * 
 * Contiene todas las funciones relacionadas con la generación de PDFs.
 */

import { AppState, cmpFiltroTxt, cmpEstado } from '../state.js';
import { $, fmt12 } from '../utils.js';

/**
 * Generar PDF de conteo y retornar como Blob
 */
export async function generarPDFConteoBlob(almacen, sesion) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text(`Inventario ${almacen.toUpperCase()} – ${sesion.numero}`, 40, 40);
  doc.setFontSize(10);
  doc.text(`Registrado por: ${sesion.registrado} · Inicio: ${sesion.inicio} · Fin: ${sesion.fin || ''} ${sesion.tienda ? '· Tienda: ' + sesion.tienda : ''}`, 40, 58);
  const body = sesion.filas.map(f => [f.item, f.producto, f.codigo, f.cantidad.toString(), f.unidad_medida]);
  doc.autoTable({ startY: 80, head: [["Item", "Producto", "Código", "Cantidad", "UM"]], body });
  const blob = doc.output('blob');
  return blob;
}

/**
 * Generar PDF de conteo y retornar URL local
 */
export async function generarPDFConteo(almacen, sesion) {
  const blob = await generarPDFConteoBlob(almacen, sesion);
  return URL.createObjectURL(blob);
}

/**
 * Generar PDF de listado de conteos
 */
export function pdfListado(almacen) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text(`Listado de Conteos – ${almacen.toUpperCase()}`, 40, 40);
  const arr = AppState.sesiones[almacen].map((s, i) => [
    i + 1,
    s.inicio,
    s.numero,
    (almacen === 'malvinas' ? (s.tienda || '') : '-'),
    s.fin || '-'
  ]);
  const head = (almacen === 'malvinas') ?
    [["ID", "Inicio", "N° Inventario", "Tienda", "Hora Final"]] :
    [["ID", "Inicio", "N° Inventario", "Hora Final"]];
  doc.autoTable({ startY: 60, head, body: arr });
  doc.save(`listado_${almacen}.pdf`);
}

/**
 * Exportar comparación a PDF
 */
export function exportComparacionPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text('Comparación de Inventario', 40, 40);
  const alm = (AppState.comparacion?.almacen || '').toUpperCase();
  const num = $('cmp-numero')?.textContent || '';
  const fecha = $('cmp-fecha')?.textContent || '';
  doc.setFontSize(10);
  doc.text(`Almacén: ${alm}   Inventario: ${num}   Fecha: ${fecha}`, 40, 58);
  
  const rows = (AppState.comparacion?.filas || []).filter(f => {
    if (cmpFiltroTxt) {
      const code = String(f.codigo || '').toLowerCase();
      const prod = String(f.producto || '').toLowerCase();
      if (!code.includes(cmpFiltroTxt) && !prod.includes(cmpFiltroTxt)) return false;
    }
    if (cmpEstado === 'OK' && f.res !== 0) return false;
    if (cmpEstado === 'BAD' && f.res === 0) return false;
    return true;
  }).map(f => [f.item, f.producto, f.codigo, String(f.sis), String(f.fis), String(f.res), f.estado]);
  
  doc.autoTable({ startY: 74, head: [["Item", "Producto", "Código", "Sis", "Fis", "Res", "Estado"]], body: rows });
  doc.save(`Comparacion_${alm || 'ALL'}.pdf`);
}

/**
 * Exportar comparación a Excel
 */
export function exportComparacionExcel() {
  try {
    const data = (AppState.comparacion?.filas || []).filter(f => {
      if (cmpFiltroTxt) {
        const code = String(f.codigo || '').toLowerCase();
        const prod = String(f.producto || '').toLowerCase();
        if (!code.includes(cmpFiltroTxt) && !prod.includes(cmpFiltroTxt)) return false;
      }
      if (cmpEstado === 'OK' && f.res !== 0) return false;
      if (cmpEstado === 'BAD' && f.res === 0) return false;
      return true;
    }).map(f => ({
      Item: f.item,
      Producto: f.producto,
      Código: f.codigo,
      Sistema: f.sis,
      Físico: f.fis,
      Resultado: f.res,
      Estado: f.estado
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comparacion');
    XLSX.writeFile(wb, 'Comparacion.xlsx');
  } catch (e) {
    alert('No se pudo exportar a Excel');
  }
}

/**
 * Generar PDF de proforma
 */
export async function generarPDFProforma(pf) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text(`Simulación de Proforma – ${pf.num}`, 40, 40);
  doc.setFontSize(10);
  doc.text(`Fecha: ${pf.fecha} · Asesor: ${pf.asesor} · Registrado: ${pf.registrado} · Almacén: ${pf.almacen.toUpperCase()}`, 40, 58);
  const body = pf.lineas.map(l => [l.producto || l.codigo, l.um, l.cant.toString()]);
  doc.autoTable({ startY: 80, head: [["Producto", "UM", "Cantidad"]], body });
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}

/**
 * Exportar proformas a PDF
 */
export function pdfProformas() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text('Listado de Proformas', 40, 40);
  const body = (AppState.proformas || []).map(p => [
    p.id,
    p.fecha,
    p.asesor,
    String(p.registrado || '').toUpperCase(),
    (p.almacen || '').toUpperCase(),
    p.num,
    p.estado
  ]);
  doc.autoTable({ startY: 60, head: [["ID", "Fecha", "Asesor", "Registrado", "Almacén", "N°", "Estado"]], body });
  doc.save('proformas.pdf');
}

/**
 * Exportar acciones a PDF
 */
export function pdfAcciones() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const norm = (s) => {
    s = String(s || '').toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  doc.setFontSize(14);
  doc.text('Listado de Acciones', 40, 40);
  const body = (AppState.acciones || []).map(a => {
    const idRef = (a.item ? `Item ${a.item}` : '') + (a.producto ? (a.item ? ' · ' : '') + a.producto : '');
    const cant = (a.cantidad !== undefined && a.cantidad !== null && String(a.cantidad) !== '') ? a.cantidad : '-';
    const tipoError = a.tipoError || 'N/A';
    return [idRef || a.id, a.fecha, norm(a.registrado), norm(a.almacen), norm(a.motivo), String(cant), norm(a.errorDe), tipoError, (a.obs || '')];
  });
  doc.autoTable({ startY: 60, head: [["Item/Producto", "Fecha y Hora", "Registrado", "Almacén", "Motivo", "Cantidad", "Error de", "Tipo", "Observaciones"]], body });
  doc.save('acciones.pdf');
}

/**
 * Exportar registro a PDF
 */
export function regExportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text('Registro de Inventarios', 40, 40);
  const rows = [];
  (AppState.sesiones.callao || []).forEach(s =>
    rows.push(['CALLAO', s.numero, s.tipo || '-', s.registrado, s.inicio, s.fin || '-'])
  );
  (AppState.sesiones.malvinas || []).forEach(s =>
    rows.push(['MALVINAS', s.numero, s.tienda || '-', s.registrado, s.inicio, s.fin || '-'])
  );
  doc.autoTable({ startY: 60, head: [["Almacén", "N° Inventario", "Tipo/Tienda", "Registrado", "Inicio", "Fin"]], body: rows });
  doc.save('registro.pdf');
}

/**
 * Exportar verificación a PDF
 */
export function pdfVerificacion() {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const fechaEmision = fmt12();
    doc.setFontSize(16);
    doc.text('Resultado de Verificación – Zeus Safety', 40, 44);
    doc.setFontSize(10);
    doc.text(`Emitido: ${fechaEmision}`, 40, 60);
    
    const compras = [
      ['Fecha ingreso', $('v-c-fecha-ing').value || ''],
      ['Hora ingreso', $('v-c-hora-ing').value || ''],
      ['N° acta', $('v-c-num-acta').value || ''],
      ['Fecha descarga inv.', $('v-c-fecha-desc').value || ''],
      ['Hora descarga inv.', $('v-c-hora-desc').value || '']
    ];
    
    const ventas = [
      ['Fecha desc. ventas', $('v-v-fecha-desc-ventas').value || ''],
      ['Hora desc. ventas', $('v-v-hora-desc-ventas').value || ''],
      ['Fecha desc. sistema', $('v-v-fecha-desc-sis').value || ''],
      ['Hora desc. sistema', $('v-v-hora-desc-sis').value || '']
    ];
    
    doc.autoTable({
      startY: 78,
      head: [['COMPRAS', 'VALOR']],
      body: compras,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [13, 110, 253] }
    });
    
    const y2 = doc.lastAutoTable.finalY + 8;
    doc.autoTable({
      startY: y2,
      head: [['VENTAS', 'VALOR']],
      body: ventas,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [13, 110, 253] }
    });
    
    const y3 = doc.lastAutoTable.finalY + 14;
    doc.setFontSize(12);
    doc.text('Resumen General', 40, y3);
    
    const comprasTot = Number($('v-res-compras').value || 0);
    const ventasTot = Number($('v-res-ventas').value || 0);
    const exist = Number($('v-res-exist').value || 0);
    const fis = Number($('v-stock-fis').value || 0);
    const sis = Number($('v-stock-sis').value || 0);
    
    const y4 = y3 + 6;
    doc.autoTable({
      startY: y4,
      head: [['MÉTRICA', 'VALOR']],
      body: [
        ['Compras Totales', comprasTot],
        ['Ventas Totales', ventasTot],
        ['Stock de Existencias', exist],
        ['Stock Físico', fis],
        ['Stock Sistema', sis]
      ],
      theme: 'striped',
      styles: { fontSize: 10 }
    });
    
    const y5 = doc.lastAutoTable.finalY + 14;
    doc.setFontSize(12);
    doc.text('Resultado de Verificación', 40, y5);
    const badgeTxt = $('v-resultado')?.innerText || '';
    const y6 = y5 + 10;
    doc.setFontSize(11);
    doc.text(badgeTxt, 40, y6);
    doc.setFontSize(9);
    doc.text('Zeus Safety · Sistema de Inventario', 40, 820);
    doc.save('verificacion.pdf');
  } catch (err) {
    alert('No se pudo generar el PDF de verificación: ' + err.message);
  }
}

// Exportar funciones para uso global (temporal hasta que se cree main.js)
window.generarPDFConteoBlob = generarPDFConteoBlob;
window.generarPDFConteo = generarPDFConteo;
window.pdfListado = pdfListado;
window.exportComparacionPDF = exportComparacionPDF;
window.exportComparacionExcel = exportComparacionExcel;
window.generarPDFProforma = generarPDFProforma;
window.pdfProformas = pdfProformas;
window.pdfAcciones = pdfAcciones;
window.regExportPDF = regExportPDF;
window.pdfVerificacion = pdfVerificacion;


