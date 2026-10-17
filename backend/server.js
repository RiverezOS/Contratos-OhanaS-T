const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

function formatearFechaEspanol(f) {
  if (!f) return "";
  const m = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const p = f.split("-");
  return p.length === 3 ? `${parseInt(p[2],10)} de ${m[parseInt(p[1],10)-1]} de ${p[0]}` : f;
}

function capitalizarTexto(s) {
  return s ? s.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase()) : "";
}

app.post("/generate", (req, res) => {
  const { nombre, servicio, fechaEvento, lugarEvento, precio, anticipo } = req.body;
  const doc = new PDFDocument({ margin: 25, size: "LETTER" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=contrato.pdf");
  doc.pipe(res);

  // Header azul y marco dorado
  doc.rect(0, 0, 612, 100).fill("#1e293b");
  doc.strokeColor("#d4af37").lineWidth(2).rect(40, 108, 532, 646).stroke();
  doc.lineWidth(0.5).rect(48, 116, 516, 630).stroke();

  // Esquinas decorativas
  doc.lineWidth(1);
  doc.moveTo(40, 138).lineTo(70, 108).stroke();
  doc.moveTo(542, 108).lineTo(572, 138).stroke();
  doc.moveTo(40, 724).lineTo(70, 754).stroke();
  doc.moveTo(542, 754).lineTo(572, 724).stroke();

  // Logo y texto encabezado
  doc.image(__dirname + "/logo.png", 507, 15, { width: 70 });
  doc.fillColor("white").fontSize(14).font("Helvetica-Bold").text("OHANA SNACKS & TROLES", 55, 32);
  doc.fontSize(10).font("Helvetica").text("Tel: 833-193-5768", 55, 52);

  // Marca de agua
  doc.save();
  doc.opacity(0.08).image(__dirname + "/logo.png", 146, 260, { width: 320, align: "center" });
  doc.restore();

  // Título
  doc.moveTo(60, 118).lineTo(552, 118).stroke("#d4af37");
  doc.fillColor("#1e293b").fontSize(13).font("Helvetica-Bold").text("CONTRATO DE PRESTACIÓN DE SERVICIOS", 0, 124, { width: 612, align: "center" });
  doc.moveTo(60, 142).lineTo(552, 142).stroke("#d4af37");

  // Folio y Fecha
  const ahora = new Date();
  const fMex = new Date(ahora.toLocaleString("en-US", { timeZone: "America/Monterrey" }));
  const yyyy = fMex.getFullYear();
  const mm = String(fMex.getMonth() + 1).padStart(2, "0");
  const dd = String(fMex.getDate()).padStart(2, "0");
  const randNum = String(Math.floor(100 + Math.random() * 900));

  doc.font("Helvetica").fillColor("#1e293b").fontSize(8.5).text(`Folio: OHA-${yyyy}${mm}${dd}-${randNum}`, 60, 150);
  doc.text(`Fecha de emisión: ${formatearFechaEspanol(`${yyyy}-${mm}-${dd}`)}`, 60, 161);
  doc.fontSize(8).text('EL PRESENTE CONTRATO SE CELEBRA ENTRE OHANA SNACKS & TROLES, EN LO SUCESIVO "EL PRESTADOR", Y EL CLIENTE, BAJO LOS SIGUIENTES TÉRMINOS:', 60, 173, { width: 492, align: "justify" });

  // Datos del Cliente
  const pNum = Number(precio) || 0;
  const aNum = Number(anticipo) || 0;
  const rNum = Math.max(0, pNum - aNum);
  const pFmt = pNum.toLocaleString("es-MX", { minimumFractionDigits: 2 });
  const aFmt = aNum.toLocaleString("es-MX", { minimumFractionDigits: 2 });
  const rFmt = rNum.toLocaleString("es-MX", { minimumFractionDigits: 2 });

  doc.y = 190;
  doc.fontSize(8.5);
  doc.font("Helvetica-Bold").text("Cliente: ", 60, doc.y, { continued: true }).font("Helvetica").text(capitalizarTexto(nombre));
  doc.font("Helvetica-Bold").text("Servicio: ", 60, doc.y, { continued: true }).font("Helvetica").text(servicio);
  doc.font("Helvetica-Bold").text("Fecha del evento: ", 60, doc.y, { continued: true }).font("Helvetica").text(formatearFechaEspanol(fechaEvento));
  doc.font("Helvetica-Bold").text("Lugar del evento: ", 60, doc.y, { continued: true }).font("Helvetica").text(lugarEvento);

  // Caja de saldo
  const boxY = doc.y + 5;
  doc.save();
  doc.lineWidth(1).roundedRect(60, boxY, 492, 32, 4).fillAndStroke("#fcfaf4", "#d4af37");
  doc.fillColor("#715814").fontSize(7.5).font("Helvetica-Bold").text("PRECIO TOTAL", 75, boxY + 5, { width: 130, lineBreak: false });
  doc.fillColor("#1e293b").fontSize(9).font("Helvetica-Bold").text(`$${pFmt} MXN`, 75, boxY + 16, { width: 130, lineBreak: false });
  doc.fillColor("#715814").fontSize(7.5).font("Helvetica-Bold").text("ANTICIPO RECIBIDO", 235, boxY + 5, { width: 130, lineBreak: false });
  doc.fillColor("#1e293b").fontSize(9).font("Helvetica-Bold").text(`$${aFmt} MXN`, 235, boxY + 16, { width: 130, lineBreak: false });
  doc.fillColor("#b45309").fontSize(7.5).font("Helvetica-Bold").text("PENDIENTE POR LIQUIDAR", 395, boxY + 5, { width: 140, lineBreak: false });
  doc.fillColor("#b45309").fontSize(9).font("Helvetica-Bold").text(`$${rFmt} MXN`, 395, boxY + 16, { width: 140, lineBreak: false });
  doc.restore();

  // Cláusulas alineadas
  let cY = boxY + 38;
  doc.fillColor("#1e293b");
  function poner(t, txt) {
    doc.font("Helvetica-Bold").fontSize(8).text(t, 60, cY, { width: 492 });
    cY = doc.y + 1;
    doc.font("Helvetica").fontSize(7.6).text(txt, 60, cY, { width: 492, align: "justify" });
    cY = doc.y + 4;
  }

  poner("PRIMERA. OBJETO", "EL PRESTADOR se compromete a brindar el servicio contratado en las condiciones pactadas.");
  poner("SEGUNDA. FECHA Y LUGAR", "El servicio se realizará en la fecha, horario y ubicación acordadas por ambas partes.");
  poner("TERCERA. REQUERIMIENTOS DE INSTALACIÓN Y SERVICIO", "Para garantizar la óptima calidad, temperatura y adecuada operación del carrito, EL CLIENTE se compromete a proporcionar:\na) Espacio físico: Área mínima de 2 x 2 metros, nivelada, despejada y de fácil acceso para el montaje e instalación.\nb) Suministro eléctrico: Una toma de corriente (110V) funcional y cercana al área de servicio para mantener el producto caliente.\nEL PRESTADOR no será responsable por variaciones en la temperatura del producto ante fallas o falta de suministro eléctrico en el recinto.");
  poner("CUARTA. ANTICIPO", "El cliente deberá cubrir un anticipo para reservar formalmente la fecha del evento.");
  poner("QUINTA. PAGO RESTANTE", "El saldo restante deberá liquidarse conforme a lo siguiente: en efectivo antes de iniciar el evento, o por transferencia electrónica con al menos un (1) día hábil de anticipación. El incumplimiento dará lugar a la suspensión del servicio por parte de EL PRESTADOR.");
  poner("SEXTA. CANCELACIONES Y CAMBIOS", "En caso de cancelación por parte de EL CLIENTE, el anticipo no será reembolsado. Cualquier cambio de fecha estará sujeto a disponibilidad de agenda.");
  poner("SÉPTIMA. RESPONSABILIDAD Y CASO FORTUITO", "EL PRESTADOR no será responsable por retrasos o interrupciones atribuibles a causas de fuerza mayor (fallas generales de energía eléctrica del salón, condiciones climáticas extremas o restricciones de acceso al inmueble).");
  poner("OCTAVA. ACEPTACIÓN", "Ambas partes aceptan y se comprometen a cumplir los términos del presente contrato.");

  // Firmas
  doc.font("Helvetica-Bold").fontSize(8.5).text("FIRMAS DE CONFORMIDAD", 0, cY + 6, { align: "center", width: 612 });
  const fY = cY + 28;
  doc.font("Helvetica").fontSize(8);
  doc.text("___________________________________", 80, fY, { width: 200, align: "center" });
  doc.text("EL PRESTADOR", 80, fY + 11, { width: 200, align: "center" });
  doc.text("___________________________________", 332, fY, { width: 200, align: "center" });
  doc.text("EL CLIENTE", 332, fY + 11, { width: 200, align: "center" });

  // Pie de página
  doc.fontSize(7.5).font("Helvetica").fillColor("#64748b").text("Tampico • Cd. Madero • Altamira   |   WhatsApp: 833-193-5768   |   Ohana Snacks & Troles", 0, 732, { align: "center", width: 612 });

  doc.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
