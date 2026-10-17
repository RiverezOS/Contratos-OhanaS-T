const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// Helper para formatear fecha a español (ej. "2026-09-20" -> "20 de septiembre de 2026")
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

// Helper para poner mayúsculas iniciales a nombres
function capitalizarTexto(str) {
  if (!str) return "";
  return str.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());
}

app.post("/generate", (req, res) => {
  console.log(req.body);

  const { nombre, servicio, fechaEvento, lugarEvento, precio, anticipo } = req.body;
  const doc = new PDFDocument({ margin: 70, size: "LETTER" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=contrato.pdf");

  doc.pipe(res);

  // =========================
  // 🔷 HEADER
  // =========================
  doc.rect(0, 0, 612, 100).fill("#1e293b");

  // ==============================
  // 🔶 MARCO AJUSTADO
  // ==============================
  doc.strokeColor("#d4af37");
  const topMargin = 110;

  // Marco exterior
  doc.lineWidth(2);
  doc.rect(40, topMargin, 532, 645).stroke();

  // Marco interior
  doc.lineWidth(0.5);
  doc.rect(48, topMargin + 8, 516, 629).stroke();

  // Esquinas decorativas ajustadas
  doc.lineWidth(1);
  doc.moveTo(40, topMargin + 30).lineTo(70, topMargin).stroke();
  doc.moveTo(542, topMargin).lineTo(572, topMargin + 30).stroke();
  doc.moveTo(40, 725).lineTo(70, 755).stroke();
  doc.moveTo(542, 755).lineTo(572, 725).stroke();

  // Logo derecha
  const logoWidth = 70;
  const logoX = 612 - logoWidth - 35;
  const logoY = 15;

  doc.image(__dirname + "/logo.png", logoX, logoY, {
    width: logoWidth,
  });

  // Texto empresa en header
  doc.fillColor("white")
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("OHANA SNACKS & TROLES", 55, 32);

  doc.fontSize(10)
    .font("Helvetica")
    .text("Tel: 833-193-5768", 55, 52);

  // ==============================
  // 🔷 MARCA DE AGUA ELEGANTE
  // ==============================
  doc.save();
  doc.opacity(0.10);
  doc.image(__dirname + "/logo.png", 146, 260, {
    width: 320,
    align: "center"
  });
  doc.restore();
  doc.opacity(1);

  // Título del documento
  const tituloY = 125;
  doc.moveTo(70, tituloY)
    .lineTo(542, tituloY)
    .stroke("#d4af37");

  doc.fillColor("#1e293b")
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("CONTRATO DE PRESTACIÓN DE SERVICIOS", 0, 132, {
      width: 612,
      align: "center"
    });

  doc.moveTo(70, 152)
    .lineTo(542, 152)
    .stroke("#d4af37");

  // =========================
  // 🔷 FOLIO Y FECHA FORMAL
  // =========================
  const ahora = new Date();
  const yyyy = ahora.getFullYear();
  const mm = String(ahora.getMonth() + 1).padStart(2, "0");
  const dd = String(ahora.getDate()).padStart(2, "0");
  const randNum = String(Math.floor(100 + Math.random() * 900));
  const folioOha = `OHA-${yyyy}${mm}${dd}-${randNum}`;

  const fechaEmisionTexto = formatearFechaEspanol(`${yyyy}-${mm}-${dd}`);
  const fechaEventoTexto = formatearFechaEspanol(fechaEvento);

  doc.font("Helvetica");
  doc.fillColor("#1e293b")
    .fontSize(9)
    .text(`Folio: ${folioOha}`, 60, 165);

  doc.text(`Fecha de emisión: ${fechaEmisionTexto}`, 60, 178);

  doc.moveDown(0.8);

  doc.fontSize(8.5)
    .text(
      'EL PRESENTE CONTRATO SE CELEBRA ENTRE OHANA SNACKS & TROLES, EN LO SUCESIVO "EL PRESTADOR", Y EL CLIENTE, BAJO LOS SIGUIENTES TÉRMINOS:',
      60,
      doc.y,
      { width: 492, align: "justify" }
    );

  doc.moveDown(0.6);

  // Datos del Cliente y Servicio
  const clienteFormateado = capitalizarTexto(nombre);
  const precioNum = Number(precio) || 0;
  const anticipoNum = Number(anticipo) || 0;
  const restanteNum = Math.max(0, precioNum - anticipoNum);

  const precioMXN = precioNum.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const anticipoMXN = anticipoNum.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const restanteMXN = restanteNum.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  doc.fontSize(9);
  doc.font("Helvetica-Bold").text("Cliente: ", 60, doc.y, { continued: true })
     .font("Helvetica").text(clienteFormateado);

  doc.font("Helvetica-Bold").text("Servicio: ", 60, doc.y, { continued: true })
     .font("Helvetica").text(servicio);

  doc.font("Helvetica-Bold").text("Fecha del evento: ", 60, doc.y, { continued: true })
     .font("Helvetica").text(fechaEventoTexto);

  doc.font("Helvetica-Bold").text("Lugar del evento: ", 60, doc.y, { continued: true })
     .font("Helvetica").text(lugarEvento);

  doc.font("Helvetica-Bold").text("Precio total: ", 60, doc.y, { continued: true })
     .font("Helvetica").text(`$${precioMXN} MXN`);

  doc.font("Helvetica-Bold").text("Anticipo: ", 60, doc.y, { continued: true })
     .font("Helvetica").text(`$${anticipoMXN} MXN`);

  doc.font("Helvetica-Bold").text("Pendiente por liquidar: ", 60, doc.y, { continued: true })
     .font("Helvetica").text(`$${restanteMXN} MXN`);

  doc.moveDown(0.8);

  // =========================
  // 🔷 CLÁUSULAS
  // =========================
  doc.fontSize(9);

  doc.font("Helvetica-Bold").text("PRIMERA. OBJETO");
  doc.font("Helvetica").text("EL PRESTADOR se compromete a brindar el servicio contratado en las condiciones pactadas.", { width: 492, align: "justify" });
  doc.moveDown(0.4);

  doc.font("Helvetica-Bold").text("SEGUNDA. FECHA Y LUGAR");
  doc.font("Helvetica").text("El servicio se realizará en la fecha, horario y ubicación acordadas por ambas partes.", { width: 492, align: "justify" });
  doc.moveDown(0.4);

  doc.font("Helvetica-Bold").text("TERCERA. ANTICIPO");
  doc.font("Helvetica").text("El cliente deberá cubrir un anticipo para reservar formalmente la fecha del evento.", { width: 492, align: "justify" });
  doc.moveDown(0.4);

  doc.font("Helvetica-Bold").text("CUARTA. PAGO RESTANTE");
  doc.font("Helvetica").text(
    "El saldo restante deberá ser liquidado conforme a las siguientes condiciones:\n" +
    "a) En efectivo: deberá cubrirse en su totalidad antes del inicio del evento.\n" +
    "b) Por transferencia electrónica: deberá liquidarse con al menos un (1) día hábil de anticipación al evento.\n" +
    "El incumplimiento dará lugar a la suspensión o cancelación del servicio por parte de EL PRESTADOR.",
    { width: 492, align: "justify" }
  );
  doc.moveDown(0.4);

  doc.font("Helvetica-Bold").text("QUINTA. CANCELACIONES Y CAMBIOS");
  doc.font("Helvetica").text(
    "En caso de cancelación por parte de EL CLIENTE, el anticipo no será reembolsado. Cualquier cambio de fecha estará estrictamente sujeto a disponibilidad de agenda.",
    { width: 492, align: "justify" }
  );
  doc.moveDown(0.4);

  doc.font("Helvetica-Bold").text("SEXTA. RESPONSABILIDAD Y CASO FORTUITO");
  doc.font("Helvetica").text(
    "EL PRESTADOR no será responsable por interrupciones o retrasos debidos a causas de fuerza mayor o ajenas a su control (tales como fallas en el suministro eléctrico del salón o inmueble, condiciones meteorológicas extremas o impedimentos de acceso al recinto).",
    { width: 492, align: "justify" }
  );
  doc.moveDown(0.4);

  doc.font("Helvetica-Bold").text("SÉPTIMA. ACEPTACIÓN");
  doc.font("Helvetica").text("Ambas partes aceptan y se comprometen a cumplir los términos del presente contrato.", { width: 492, align: "justify" });
  doc.moveDown(0.8);

  // =========================
  // 🔷 FIRMAS
  // =========================
  doc.font("Helvetica-Bold").fontSize(9).text("FIRMAS DE CONFORMIDAD", { align: "center", width: 612 });
  doc.moveDown(1.5);

  const firmasY = doc.y;
  doc.font("Helvetica").fontSize(8.5);

  // Firma Prestador (Izquierda)
  doc.text("___________________________________", 80, firmasY, { width: 200, align: "center" });
  doc.text("EL PRESTADOR", 80, firmasY + 14, { width: 200, align: "center" });

  // Firma Cliente (Derecha)
  doc.text("___________________________________", 332, firmasY, { width: 200, align: "center" });
  doc.text("EL CLIENTE", 332, firmasY + 14, { width: 200, align: "center" });

  doc.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
