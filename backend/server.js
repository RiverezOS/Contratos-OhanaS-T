const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// Formatear fechas a español formal (ej. "2026-11-05" -> "5 de noviembre de 2026")
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
  const doc = new PDFDocument({ margin: 70, size: "LETTER" });

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
  doc.rect(40, topMargin, 532, 650).stroke();

  // Marco interior
  doc.lineWidth(0.5);
  doc.rect(48, topMargin + 8, 516, 634).stroke();

  // Esquinas decorativas
  doc.lineWidth(1);
  doc.moveTo(40, topMargin + 30).lineTo(70, topMargin).stroke();
  doc.moveTo(542, topMargin).lineTo(572, topMargin + 30).stroke();
  doc.moveTo(40, 728).lineTo(70, 758).stroke();
  doc.moveTo(542, 758).lineTo(572, 728).stroke();

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
  doc.image(__dirname + "/logo.png", 146, 275, {
    width: 320,
    align: "center"
  });
  doc.restore();
  doc.opacity(1);

  // Título del documento
  const tituloY = 118;
  doc.moveTo(70, tituloY).lineTo(542, tituloY).stroke("#d4af37");

  doc.fillColor("#1e293b")
    .fontSize(13)
    .font("Helvetica-Bold")
    .text("CONTRATO DE PRESTACIÓN DE SERVICIOS", 0, 124, {
      width: 612,
      align: "center"
    });

  doc.moveTo(70, 142).lineTo(542, 142).stroke("#d4af37");

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
      'EL PRESENTE CONTRATO SE CELEBRA ENTRE OHANA SNACKS & TROLES, EN LO SUCESIVO "EL PRESTADOR", Y EL CLIENTE, BAJO LOS SIGUIENTES TÉRMINOS:',
      60,
      174,
      { width: 492, align: "justify" }
    );

  // Datos del Cliente y Servicio
  const clienteFormateado = capitalizarTexto(nombre);
  const precioNum = Number(precio) || 0;
  const anticipoNum = Number(anticipo) || 0;
  const restanteNum = Math.max(0, precioNum - anticipoNum);

  const precioMXN = precioNum.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const anticipoMXN = anticipoNum.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const restanteMXN = restanteNum.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  doc.y = 191;
  doc.fontSize(8.5);

  doc.font("Helvetica-Bold").text("Cliente: ", 60, doc.y, { continued: true }).font("Helvetica").text(clienteFormateado);
  doc.font("Helvetica-Bold").text("Servicio: ", 60, doc.y, { continued: true }).font("Helvetica").text(servicio);
  doc.font("Helvetica-Bold").text("Fecha del evento: ", 60, doc.y, { continued: true }).font("Helvetica").text(fechaEventoTexto);
  doc.font("Helvetica-Bold").text("Lugar del evento: ", 60, doc.y, { continued: true }).font("Helvetica").text(lugarEvento);

  // ==========================================
  // 🔶 CAJA DESTACADA DE RESUMEN ECONÓMICO
  // ==========================================
  const boxY = doc.y + 6;
  doc.save();
  doc.lineWidth(1);
  doc.roundedRect(60, boxY, 492, 34, 4).fillAndStroke("#fcfaf4", "#d4af37");

  // Columna 1: Precio Total
  doc.fillColor("#715814").fontSize(7.5).font("Helvetica-Bold").text("PRECIO TOTAL", 75, boxY + 6);
  doc.fillColor("#1e293b").fontSize(9.5).font("Helvetica-Bold").text(`$${precioMXN} MXN`, 75, boxY + 18);

  // Columna 2: Anticipo Pagado
  doc.fillColor("#715814").fontSize(7.5).font("Helvetica-Bold").text("ANTICIPO RECIBIDO", 235, boxY + 6);
  doc.fillColor("#1e293b").fontSize(9.5).font("Helvetica-Bold").text(`$${anticipoMXN} MXN`, 235, boxY + 18);

  // Columna 3: Saldo Pendiente
  doc.fillColor("#b45309").fontSize(7.5).font("Helvetica-Bold").text("PENDIENTE POR LIQUIDAR", 395, boxY + 6);
  doc.fillColor("#b45309").fontSize(9.5).font("Helvetica-Bold").text(`$${restanteMXN} MXN`, 395, boxY + 18);
  doc.restore();

  doc.y = boxY + 42;

  // =========================
  // 🔷 CLÁUSULAS
  // =========================
  doc.fontSize(8.2);

  doc.font("Helvetica-Bold").text("PRIMERA. OBJETO");
  doc.font("Helvetica").text("EL PRESTADOR se compromete a brindar el servicio contratado en las condiciones pactadas.", { width: 492, align: "justify" });
  doc.moveDown(0.2);

  doc.font("Helvetica-Bold").text("SEGUNDA. FECHA Y LUGAR");
  doc.font("Helvetica").text("El servicio se realizará en la fecha, horario y ubicación acordadas por ambas partes.", { width: 492, align: "justify" });
  doc.moveDown(0.2);

  doc.font("Helvetica-Bold").text("TERCERA. REQUERIMIENTOS DE INSTALACIÓN Y SERVICIO");
  doc.font("Helvetica").text(
    "Para garantizar la óptima calidad, temperatura y adecuada operación del carrito, EL CLIENTE se compromete a proporcionar:\n" +
    "a) Espacio físico: Área mínima de 2 x 2 metros, nivelada, despejada y de fácil acceso para el montaje e instalación.\n" +
    "b) Suministro eléctrico: Una toma de corriente (110V) funcional y cercana al área de servicio para mantener el producto caliente.\n" +
    "EL PRESTADOR no será responsable por variaciones en la temperatura del producto ante fallas o falta de suministro eléctrico en el recinto.",
    { width: 492, align: "justify" }
  );
  doc.moveDown(0.2);

  doc.font("Helvetica-Bold").text("CUARTA. ANTICIPO");
  doc.font("Helvetica").text("El cliente deberá cubrir un anticipo para reservar formalmente la fecha del evento.", { width: 492, align: "justify" });
  doc.moveDown(0.2);

  doc.font("Helvetica-Bold").text("QUINTA. PAGO RESTANTE");
  doc.font("Helvetica").text(
    "El saldo restante deberá liquidarse conforme a lo siguiente: en efectivo antes de iniciar el evento, o por transferencia electrónica con al menos un (1) día hábil de anticipación. El incumplimiento dará lugar a la suspensión del servicio por parte de EL PRESTADOR.",
    { width: 492, align: "justify" }
  );
  doc.moveDown(0.2);

  doc.font("Helvetica-Bold").text("SEXTA. CANCELACIONES Y CAMBIOS");
  doc.font("Helvetica").text(
    "En caso de cancelación por parte de EL CLIENTE, el anticipo no será reembolsado. Cualquier cambio de fecha estará sujeto a disponibilidad de agenda.",
    { width: 492, align: "justify" }
  );
  doc.moveDown(0.2);

  doc.font("Helvetica-Bold").text("SÉPTIMA. RESPONSABILIDAD Y CASO FORTUITO");
  doc.font("Helvetica").text(
    "EL PRESTADOR no será responsable por retrasos o interrupciones atribuibles a causas de fuerza mayor (fallas generales de energía eléctrica del salón, condiciones climáticas extremas o restricciones de acceso al inmueble).",
    { width: 492, align: "justify" }
  );
  doc.moveDown(0.2);

  doc.font("Helvetica-Bold").text("OCTAVA. ACEPTACIÓN");
  doc.font("Helvetica").text("Ambas partes aceptan y se comprometen a cumplir los términos del presente contrato.", { width: 492, align: "justify" });
  doc.moveDown(0.6);

  // =========================
  // 🔷 FIRMAS
  // =========================
  doc.font("Helvetica-Bold").fontSize(8.5).text("FIRMAS DE CONFORMIDAD", { align: "center", width: 612 });
  doc.moveDown(1.1);

  const firmasY = doc.y;
  doc.font("Helvetica").fontSize(8);

  // Firma Prestador (Izquierda)
  doc.text("___________________________________", 80, firmasY, { width: 200, align: "center" });
  doc.text("EL PRESTADOR", 80, firmasY + 12, { width: 200, align: "center" });

  // Firma Cliente (Derecha)
  doc.text("___________________________________", 332, firmasY, { width: 200, align: "center" });
  doc.text("EL CLIENTE", 332, firmasY + 12, { width: 200, align: "center" });

  // ==========================================
  // 🔶 PIE DE PÁGINA INSTITUCIONAL
  // ==========================================
  doc.fontSize(7.5)
    .font("Helvetica")
    .fillColor("#64748b")
    .text(
      "Tampico • Cd. Madero • Altamira   |   WhatsApp: 833-193-5768   |   Ohana Snacks & Troles",
      0,
      742,
      { align: "center", width: 612 }
    );

  doc.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
