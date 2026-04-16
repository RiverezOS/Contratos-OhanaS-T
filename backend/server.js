const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/generate", (req, res) => {

  console.log(req.body);

  const { nombre, servicio, fechaEvento, lugarEvento, precio, anticipo } = req.body;
  const doc = new PDFDocument({ margin: 70 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=contrato.pdf");

  doc.pipe(res);

  // =========================
  // 🔷 HEADER
  // =========================
  

// HEADER
doc.rect(0, 0, 612, 100).fill("#1e293b");

// ==============================
// 🔶 MARCO AJUSTADO (NO TOCA HEADER)
// ==============================

doc.strokeColor("#d4af37");

// Inicia debajo del header (header mide 100px aprox)
const topMargin = 110;

// Marco exterior
doc.lineWidth(2);
doc.rect(40, topMargin, 532, 742 - (topMargin - 40)).stroke();


// Marco interior
doc.lineWidth(0.5);
doc.rect(50, topMargin + 10, 512, 722 - (topMargin - 40)).stroke();

// Esquinas decorativas ajustadas
doc.lineWidth(1);

// Superior izquierda
doc.moveTo(40, topMargin + 40).lineTo(80, topMargin).stroke();

// Superior derecha
doc.moveTo(552, topMargin).lineTo(572, topMargin + 40).stroke();

// Inferior izquierda
doc.moveTo(40, 742).lineTo(80, 782).stroke();

// Inferior derecha
doc.moveTo(552, 782).lineTo(572, 742).stroke();

  
// Logo derecha
  const logoWidth = 70;
  const logoX = 612 - logoWidth - 30;
  const logoY = 15;

  doc.image(__dirname + "/logo.png", logoX, logoY, {
    width: logoWidth,
  });

  // Texto empresa
  doc.fillColor("white")
    .fontSize(14)
    .text("OHANA SNACKS & TROLES", 50, 30);

  doc.fontSize(10)
    .text("Tel: 833-193-5768", 50, 50);

  // =========================
  // 🔥 MARCA DE AGUA
  // =========================
 // ============================
// ◇ MARCA DE AGUA PREMIUM
// ============================
// ==============================
// 🔷 MARCA DE AGUA CENTRADA PRO
// ==============================

doc.save();

// Opacidad más visible pero elegante
doc.opacity(0.18);

// Imagen centrada (ajustada a hoja carta)
doc.image(__dirname + "/logo.png", 130, 220, {
  width: 350,
  align: "center"
});

// Restaurar estado normal
doc.restore();
doc.opacity(1);

 doc.moveDown(2);
// Línea superior
doc.moveTo(100, 90)
  .lineTo(512, 90)
  .stroke("#d4af37");

const tituloY = 130;

doc.moveTo(80, tituloY)
   .lineTo(530, tituloY)
   .stroke("#d4af37");

doc.fillColor("#1e293b")
  .fontSize(16)
  .text("CONTRATO DE PRESTACIÓN DE SERVICIOS", 0, 118, {
    width: 612,
    align: "center"
  });

doc.moveTo(80, 145)
   .lineTo(530, 145)
   .stroke("#d4af37");

doc.y = tituloY + 60;

doc.moveDown();

  // =========================
  // 🔷 DATOS
  // =========================
  const fecha = new Date().toLocaleDateString();

  doc.fillColor("black")
  .fontSize(10)
  .text(`Folio: ${Date.now()}`, 60, 150);

doc.text(`Fecha: ${fecha}`, 60, doc.y);

  doc.moveDown();

doc.text(
`EL PRESENTE CONTRATO SE CELEBRA ENTRE OHANA SNACKS&TROLES, EN LO SUCESIVO "EL PRESTADOR", Y EL CLIENTE, BAJO LOS SIGUIENTES TÉRMINOS:`
);

  doc.moveDown();
doc.text("Cliente: " + nombre, 60, doc.y);
doc.text("Servicio: " + servicio, 60, doc.y);
doc.text("Fecha del evento: " + fechaEvento, 60, doc.y);
doc.text("Lugar del evento: " + lugarEvento, 60, doc.y);
const precioMXN = Number(precio).toLocaleString('es-MX');
const anticipoMXN = Number(anticipo).toLocaleString('es-MX');
const restante = Number(precio) - Number(anticipo);
const restanteMXN = Number(restante).toLocaleString('es-MX');

doc.text("Precio total: $" + precio, 60, doc.y);
doc.text("Anticipo: $" + anticipo, 60, doc.y);
doc.text(`Pendiente por liquidar: $${restanteMXN}`);

doc.moveDown();

  doc.fontSize(10);

  doc.text("PRIMERA. OBJETO");
  doc.text("EL PRESTADOR se compromete a brindar el servicio contratado.");
  doc.moveDown();

  doc.text("SEGUNDA. FECHA Y LUGAR");
  doc.text("El servicio se realizará en la fecha y ubicación acordadas.");
  doc.moveDown();

  doc.text("TERCERA. ANTICIPO");
  doc.text("El cliente deberá pagar un anticipo para reservar la fecha.");
  doc.moveDown();

  // ============================
// ◇ CUARTA
// ============================
doc.moveDown();

doc.fontSize(11).text("CUARTA. PAGO RESTANTE");

doc.fontSize(10).text(
"El saldo restante deberá ser liquidado conforme a las siguientes condiciones:",
{ width: 500, align: "justify" }
);

doc.text(
"a) En caso de pago en efectivo, deberá cubrirse en su totalidad antes del inicio del evento.",
{ width: 500, align: "justify" }
);
doc.moveDown(0.5);
doc.text(
"b) En caso de pago mediante transferencia electrónica, el monto total deberá liquidarse con al menos un (1) día hábil de anticipación a la fecha del evento, considerando posibles tiempos de procesamiento o retención por parte de las instituciones bancarias.",
{ width: 500, align: "justify" }
);

doc.text(
"El incumplimiento de estas condiciones podrá dar lugar a la suspensión o cancelación del servicio por parte de EL PRESTADOR.",
{ width: 500, align: "justify" }
);


// ============================
// ◇ QUINTA
// ============================
doc.moveDown();

doc.fontSize(11).text("QUINTA. CANCELACIONES Y CAMBIOS");

doc.fontSize(10).text(
"En caso de cancelación por parte del CLIENTE, el anticipo no será reembolsado.",
{ width: 500, align: "justify" }
);

doc.text(
"Cualquier cambio de fecha estará sujeto a disponibilidad.",
{ width: 500, align: "justify" }
);

  doc.text("SEXTA. RESPONSABILIDAD");
  doc.moveDown();
  doc.text("El prestador no se hace responsable por causas externas.");
  doc.moveDown(0,5);

  doc.text("SÉPTIMA. ACEPTACIÓN");
  doc.text("Ambas partes aceptan los términos del presente contrato.");
  doc.moveDown(0,5);

 
  // =========================
  // 🔷 FIRMAS
  // =========================
  doc.fontSize(10).text("FIRMAS", { underline: true });

  doc.moveDown(2);

  doc.text("EL PRESTADOR: ____________________________", 50);
  doc.moveDown();
  doc.text("EL CLIENTE: _______________________________", 50);

  // =========================
  // FINAL
  // =========================
  doc.end();
});

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});