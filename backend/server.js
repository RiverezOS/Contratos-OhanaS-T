const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// Formatear fechas a español formal (ej. "2026-10-31" -> "31 de octubre de 2026")
function formatearFechaEspanol(fechaStr) {
  if (!fechaStr) return "";
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  const partes = fechaStr.split("-");
  if (partes.length === 3) {
    const anio = partes[0];
    const mesIndex = parseInt(partes[1], 10) - 1;
    const dia = parseInt(partes[2], 10);
    return `${dia} de ${meses[mesIndex]} de ${anio}`;
  }
  return fechaStr;
}

// Iniciales en mayúscula
function capitalizarTexto(str) {
  if (!str) return "";
  return str.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());
}

app.post("/generate", (req, res) => {
  console.log(req.body);

  const { nombre, servicio, fechaEvento, lugarEvento, precio, anticipo } = req.body;
  
  // Margen de 25 para garantizar 1 sola página
  const doc = new PDFDocument({ margin: 25, size: "LETTER" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=contrato.pdf");

  doc.pipe(res);

  // =========================
  // 🔷 HEADER
  // =========================
  doc.rect(0, 0, 612, 100).fill("#1e293b");

  // ==============================
  // 🔶 MARCO ELEGANTE
  // ==============================
  doc.strokeColor("#d4af37");
  const topMargin = 108;

  // Marco exterior
  doc.lineWidth(2);
  doc.rect(40, topMargin, 532, 646).stroke();

  // Marco interior
  doc.lineWidth(0.5);
  doc.rect(48, topMargin + 8, 516, 630).stroke();

  // Esquinas decorativas
  doc.lineWidth(1);
  doc.moveTo(40, topMargin + 30).lineTo(70, topMargin).stroke();
  doc.moveTo(542, topMargin).lineTo(572, topMargin + 30).stroke();
  doc.moveTo(40, 724).lineTo(70, 754).stroke();
  doc.moveTo(542, 754).lineTo(572, 724).stroke();

  // Logo derecha
  const logoWidth = 70;
  const logoX = 612 - logoWidth - 35;
  const logoY = 15;

  doc.image(__dirname + "/logo.png", logoX, logoY, {
    width: logoWidth,
  });

  // Datos de empresa en encabezado
  doc.fillColor("white")
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("OHANA SNACKS & TROLES", 55, 32);

  doc.fontSize(10)
    .font("Helvetica")
    .text("Tel: 833-193-5768", 55, 52);

  // ==============================
  // 🔷 MARCA DE AGUA
  // ==============================
  doc.save();
  doc.opacity(0.08);
  doc.image(__dirname + "/logo.png", 146, 260, {
    width: 320,
    align: "center"
  });
  doc.restore();
  doc.opacity(1);

  // Título del documento
  const tituloY = 118;
  doc.moveTo(60, tituloY).lineTo(552, tituloY).stroke("#d4af37");

  doc.fillColor("#1e293b")
    .fontSize(13)
    .font("Helvetica-Bold")
    .text("CONTRATO DE PRESTACIÓN DE SERVICIOS", 0, 124, {
      width: 612,
      align: "center"
    });

  doc.moveTo(60, 142).lineTo(552, 142).stroke("#d4af37");

  // =========================
  // 🔷 FOLIO Y FECHA (Hora local México)
  // =========================
  const ahora = new Date();
  const fechaMexico = new Date(ahora.toLocaleString("en-US", { timeZone: "America/Monterrey" }));
  const yyyy = fechaMexico.getFullYear();
  const mm = String(fechaMexico.getMonth() + 1).padStart(2, "0");
  const dd = String(fechaMexico.getDate()).padStart(2, "0");
  const randNum = String(Math.floor(100 + Math.random() * 900));
  const folioOha = `OHA-${yyyy}${mm}${dd}-${randNum}`;

  const fechaEmisionTexto = formatearFechaEspanol(`${yyyy}-${mm}-${dd}`);
  const fechaEventoTexto = formatearFechaEspanol(fechaEvento);

  doc.font("Helvetica");
  doc.fillColor("#1e293b")
    .fontSize(8.5)
    .text(`Folio: ${folioOha}`, 60, 150);

  doc.text(`Fecha de emisión: ${fechaEmisionTexto}`, 60, 161);

  doc.fontSize(8)
    .text(
      'EL PRESENTE CONTRATO SE CELEBRA ENTRE OHANA SNACKS & TROLES, EN LO SUCESIVO "EL PRESTADOR", Y EL CLIENTE,
