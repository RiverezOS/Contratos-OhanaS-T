const express = require("express");
const cors = require("cors");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

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
    return `${dia} de ${meses[mesIndex]} de${anio}`;
  }
  return fechaStr;
}

// Iniciales en mayúscula
function capitalizarTexto(str) {
  if (!str) return "";
  return str.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());
}

app.post("/generate", (req, res) => {
  try {
    console.log("Datos recibidos:", req.body);

    const { nombre, servicio, fechaEvento, lugarEvento, precio, anticipo } = req.body;
    
    // Margen de 25 para garantizar 1 sola página
    const doc = new PDFDocument({ margin: 25, size: "LETTER" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=contrato.pdf");

    doc.pipe(res);

    // Ruta del logo
    const logoPath = path.join(__dirname, "logo.png");
    const existeLogo = fs.existsSync(logoPath);

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

    // Logo derecha (solo si el archivo existe para evitar caídas en el servidor)
    const logoWidth = 70;
    const logoX = 612 - logoWidth - 35;
    const logoY = 15;

    if (existeLogo) {
      doc.image(logoPath, logoX, logoY, { width: logoWidth });
    }

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
    if (existeLogo) {
      doc.save();
      doc.opacity(0.08);
      doc.image(logoPath, 146, 260, {
        width: 320,
        align: "center"
      });
      doc.restore();
      doc.opacity(1);
    }

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

    // =========================
    // 🔷 CUERPO DEL CONTRATO
    // =========================
    const nombreCliente = capitalizarTexto(nombre) || "CLIENTE NO ESPECIFICADO";
    const servicioTexto = servicio || "Snacks y Troles";
    const lugarTexto = lugarEvento || "Por definir";
    const precioNum = Number(precio) || 0;
    const anticipoNum = Number(anticipo) || 0;
    const saldoPendiente = Math.max(0, precioNum - anticipoNum);

    doc.fontSize(8)
      .text(
        `EL PRESENTE CONTRATO SE CELEBRA ENTRE OHANA SNACKS & TROLES, EN LO SUCESIVO "EL PRESTADOR", Y ${nombreCliente}, EN LO SUCESIVO "EL CLIENTE".`,
        60,
        178,
        { width: 492, align: "justify" }
      );

    // Detalles del servicio
    doc.moveDown(0.8);
    doc.font("Helvetica-Bold").text("DETALLES DEL SERVICIO:", 60, doc.y);
    doc.font("Helvetica");
    doc.text(`• Servicio contratado: ${servicioTexto}`, 70, doc.y + 4);
    doc.text(`• Fecha del evento: ${fechaEventoTexto || "Por confirmar"}`);
    doc.text(`• Lugar del evento: ${lugarTexto}`);
    doc.text(`• Costo total: $${precioNum.toFixed(2)} MXN`);
    doc.text(`• Anticipo entregado: $${anticipoNum.toFixed(2)} MXN`);
    doc.text(`• Saldo restante: $${saldoPendiente.toFixed(2)} MXN`);

    // Cláusulas básicas
    doc.moveDown(0.8);
    doc.font("Helvetica-Bold").text("TÉRMINOS Y CONDICIONES:", 60, doc.y);
    doc.font("Helvetica").fontSize(7.5).text(
      "1. El cliente se compromete a liquidar el saldo pendiente al momento de la llegada del personal al lugar del evento.\n" +
      "2. El anticipo garantiza la fecha y horario pactados y no es reembolsable en caso de cancelación por parte del cliente.\n" +
      "3. El prestador se compromete a llegar con la debida anticipación para el montaje del servicio acordado.",
      60,
      doc.y + 4,
      { width: 492, align: "justify", lineGap: 2 }
    );

    // Firmas
    const firmasY = 670;
    doc.lineWidth(1).strokeColor("#1e293b");
    doc.moveTo(90, firmasY).lineTo(230, firmasY).stroke();
    doc.moveTo(380, firmasY).lineTo(520, firmasY).stroke();

    doc.fontSize(8).fillColor("#1e293b");
    doc.text("OHANA SNACKS & TROLES", 90, firmasY + 6, { width: 140, align: "center" });
    doc.text("FIRMA DEL CLIENTE", 380, firmasY + 6, { width: 140, align: "center" });

    // Finalizar el PDF (crucial para que no se quede colgado)
    doc.end();

  } catch (error) {
    console.error("Error al generar PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "No se pudo generar el contrato." });
    }
  }
});

// Configuración de puerto para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
