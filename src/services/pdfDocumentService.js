import {
  buildPdfFilename,
  formatAddress,
  formatContact,
  formatQuoteDate,
  quotePdfViewModel,
  quoteItemUnitPrice,
} from "../lib/quotePdf";
import { formatBRL } from "../lib/money";

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const MARGIN = 88;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const PDF_RASTER_SCALE = 0.72;
const PDF_RASTER_WIDTH = Math.round(PAGE_WIDTH * PDF_RASTER_SCALE);
const PDF_RASTER_HEIGHT = Math.round(PAGE_HEIGHT * PDF_RASTER_SCALE);
const PDF_JPEG_QUALITY = 0.78;

function asHexColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value : "#111827";
}

function createCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = PDF_RASTER_WIDTH;
  canvas.height = PDF_RASTER_HEIGHT;
  const ctx = canvas.getContext("2d");
  ctx.scale(PDF_RASTER_SCALE, PDF_RASTER_SCALE);
  return canvas;
}

function drawRoundedRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function textLines(ctx, text, maxWidth) {
  const result = [];
  const paragraphs = String(text || "").split(/\n/);

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) {
      result.push("");
      continue;
    }

    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth || !line) {
        line = candidate;
      } else {
        result.push(line);
        line = word;
      }
    }
    if (line) result.push(line);
  }

  return result;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
  const lines = textLines(ctx, text, maxWidth).slice(0, maxLines);
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function loadImage(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

function drawLogo(ctx, image, x, y, maxWidth, maxHeight) {
  if (!image) return false;

  const ratio = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
  const width = image.naturalWidth * ratio;
  const height = image.naturalHeight * ratio;
  ctx.drawImage(image, x, y, width, height);
  return true;
}

function canvasToJpeg(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível renderizar a página do PDF."));
          return;
        }
        resolve(new Uint8Array(await blob.arrayBuffer()));
      },
      "image/jpeg",
      PDF_JPEG_QUALITY,
    );
  });
}

function ascii(value) {
  return new TextEncoder().encode(value);
}

function concat(chunks) {
  const size = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(size);
  let offset = 0;
  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.length;
  });
  return output;
}

function buildJpegPdf(jpegs) {
  const pageWidthPt = 595.28;
  const pageHeightPt = 841.89;
  const objectCount = 2 + jpegs.length * 3;
  const objects = new Array(objectCount + 1);
  const kids = [];

  objects[1] = ascii("<< /Type /Catalog /Pages 2 0 R >>");

  jpegs.forEach((jpeg, index) => {
    const pageObject = 3 + index * 3;
    const imageObject = pageObject + 1;
    const contentObject = pageObject + 2;
    kids.push(`${pageObject} 0 R`);

    objects[pageObject] = ascii(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidthPt} ${pageHeightPt}] ` +
      `/Resources << /XObject << /Im0 ${imageObject} 0 R >> >> /Contents ${contentObject} 0 R >>`,
    );

    objects[imageObject] = concat([
      ascii(
        `<< /Type /XObject /Subtype /Image /Width ${PDF_RASTER_WIDTH} /Height ${PDF_RASTER_HEIGHT} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
      ),
      jpeg,
      ascii("\nendstream"),
    ]);

    const stream = `q\n${pageWidthPt} 0 0 ${pageHeightPt} 0 0 cm\n/Im0 Do\nQ\n`;
    objects[contentObject] = ascii(
      `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
    );
  });

  objects[2] = ascii(`<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${jpegs.length} >>`);

  const chunks = [ascii("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n")];
  const offsets = new Array(objectCount + 1).fill(0);
  let byteOffset = chunks[0].length;

  for (let index = 1; index <= objectCount; index += 1) {
    offsets[index] = byteOffset;
    const chunk = concat([
      ascii(`${index} 0 obj\n`),
      objects[index],
      ascii("\nendobj\n"),
    ]);
    chunks.push(chunk);
    byteOffset += chunk.length;
  }

  const xrefOffset = byteOffset;
  const xref = [
    `xref\n0 ${objectCount + 1}\n`,
    "0000000000 65535 f \n",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`),
    `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\n`,
    `startxref\n${xrefOffset}\n%%EOF\n`,
  ].join("");

  chunks.push(ascii(xref));
  return new Blob([concat(chunks)], { type: "application/pdf" });
}

function drawPageBase(ctx, business, quote, pageNumber, totalPagesHint, logoImage) {
  const vm = quotePdfViewModel(quote, business);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);

  const accent = asHexColor(vm.primaryColor);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, PAGE_WIDTH, 18);

  if (!drawLogo(ctx, logoImage, MARGIN, 62, 190, 92)) {
    drawRoundedRect(ctx, MARGIN, 62, 74, 74, 16, "#F3F4F6");
    ctx.fillStyle = accent;
    ctx.font = "800 32px Arial";
    ctx.fillText((vm.companyName || "O").slice(0, 1).toUpperCase(), MARGIN + 25, 111);
  }

  ctx.fillStyle = "#111827";
  ctx.font = "800 31px Arial";
  ctx.fillText(vm.companyName, MARGIN + 215, 85);
  ctx.font = "400 16px Arial";
  ctx.fillStyle = "#6B7280";

  let businessY = 111;
  for (const line of [vm.companyLegalName, vm.companyDocument, vm.companyContact].filter(Boolean)) {
    ctx.fillText(line, MARGIN + 215, businessY);
    businessY += 22;
  }

  ctx.textAlign = "right";
  ctx.fillStyle = "#6B7280";
  ctx.font = "700 14px Arial";
  ctx.fillText("ORÇAMENTO", PAGE_WIDTH - MARGIN, 78);
  ctx.fillStyle = "#111827";
  ctx.font = "900 31px Arial";
  ctx.fillText(vm.quoteNumber, PAGE_WIDTH - MARGIN, 112);
  ctx.textAlign = "left";

  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(MARGIN, 174);
  ctx.lineTo(PAGE_WIDTH - MARGIN, 174);
  ctx.stroke();

  ctx.fillStyle = "#9CA3AF";
  ctx.font = "400 13px Arial";
  ctx.fillText(`Página ${pageNumber}${totalPagesHint ? ` de ${totalPagesHint}` : ""}`, MARGIN, PAGE_HEIGHT - 44);
  ctx.textAlign = "right";
  ctx.fillText(vm.companyName, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 44);
  ctx.textAlign = "left";
}

function drawInfoCard(ctx, label, value, x, y, width) {
  drawRoundedRect(ctx, x, y, width, 104, 13, "#F9FAFB", "#E5E7EB");
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "700 12px Arial";
  ctx.fillText(label.toUpperCase(), x + 18, y + 25);
  ctx.fillStyle = "#111827";
  ctx.font = "800 18px Arial";
  drawWrappedText(ctx, value || "—", x + 18, y + 57, width - 36, 22, 2);
}

function drawParagraphBlock(ctx, title, value, x, y, width) {
  if (!value) return y;

  ctx.fillStyle = "#111827";
  ctx.font = "800 16px Arial";
  ctx.fillText(title, x, y);
  ctx.fillStyle = "#4B5563";
  ctx.font = "400 15px Arial";
  const end = drawWrappedText(ctx, value, x, y + 28, width, 22);
  return end + 22;
}

async function renderPdfPages({ quote, business, logoUrl }) {
  const logoImage = await loadImage(logoUrl);
  const pages = [];
  let canvas = createCanvas();
  let ctx = canvas.getContext("2d");
  drawPageBase(ctx, business, quote, 1, null, logoImage);

  const vm = quotePdfViewModel(quote, business);
  let y = 216;

  ctx.fillStyle = "#111827";
  ctx.font = "800 17px Arial";
  ctx.fillText("Cliente", MARGIN, y);

  ctx.font = "800 23px Arial";
  ctx.fillText(vm.clientName, MARGIN, y + 36);
  ctx.fillStyle = "#6B7280";
  ctx.font = "400 14px Arial";

  let clientY = y + 61;
  for (const line of [
    vm.clientTradeName,
    vm.clientDocument,
    vm.clientContact,
    vm.clientAddress,
  ].filter(Boolean)) {
    clientY = drawWrappedText(ctx, line, MARGIN, clientY, 650, 20) + 3;
  }

  const cardY = Math.max(y + 112, clientY + 12);
  const cardWidth = (CONTENT_WIDTH - 24) / 3;
  drawInfoCard(ctx, "Emissão", vm.issueDate, MARGIN, cardY, cardWidth);
  drawInfoCard(ctx, "Validade", vm.validUntil, MARGIN + cardWidth + 12, cardY, cardWidth);
  drawInfoCard(ctx, "Previsão", vm.expectedDeliveryDate, MARGIN + (cardWidth + 12) * 2, cardY, cardWidth);

  y = cardY + 144;

  const headerHeight = 44;
  const rowMinHeight = 62;
  const columns = {
    desc: MARGIN + 14,
    qty: MARGIN + 650,
    unit: MARGIN + 782,
    total: PAGE_WIDTH - MARGIN - 12,
  };

  function drawItemsHeader() {
    ctx.fillStyle = "#111827";
    ctx.font = "800 18px Arial";
    ctx.fillText("Itens do orçamento", MARGIN, y);
    y += 24;

    drawRoundedRect(ctx, MARGIN, y, CONTENT_WIDTH, headerHeight, 10, "#111827");
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 12px Arial";
    ctx.fillText("DESCRIÇÃO", columns.desc, y + 27);
    ctx.fillText("QTD.", columns.qty, y + 27);
    ctx.fillText("UNITÁRIO", columns.unit, y + 27);
    ctx.textAlign = "right";
    ctx.fillText("TOTAL", columns.total, y + 27);
    ctx.textAlign = "left";
    y += headerHeight;
  }

  drawItemsHeader();

  for (const item of quote.items || []) {
    ctx.font = "700 15px Arial";
    const descriptionLines = textLines(ctx, item.description, 585);
    ctx.font = "400 13px Arial";
    const metaText =
      item.calculation_mode === "square_meter" && item.area
        ? `${item.area} m²`
        : item.calculation_mode === "linear_meter" && item.linear_meters
          ? `${item.linear_meters} m`
          : "";
    const noteLines = textLines(ctx, [metaText, item.notes].filter(Boolean).join(" · "), 585);
    const rowHeight = Math.max(
      rowMinHeight,
      26 + descriptionLines.length * 19 + noteLines.length * 17,
    );

    if (y + rowHeight > PAGE_HEIGHT - 150) {
      pages.push(canvas);
      canvas = createCanvas();
      ctx = canvas.getContext("2d");
      drawPageBase(ctx, business, quote, pages.length + 1, null, logoImage);
      y = 216;
      drawItemsHeader();
    }

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(MARGIN, y, CONTENT_WIDTH, rowHeight);
    ctx.strokeStyle = "#E5E7EB";
    ctx.beginPath();
    ctx.moveTo(MARGIN, y + rowHeight);
    ctx.lineTo(PAGE_WIDTH - MARGIN, y + rowHeight);
    ctx.stroke();

    ctx.fillStyle = "#111827";
    ctx.font = "700 15px Arial";
    descriptionLines.forEach((line, index) => ctx.fillText(line, columns.desc, y + 24 + index * 19));

    if (noteLines.length) {
      ctx.fillStyle = "#6B7280";
      ctx.font = "400 13px Arial";
      const noteStart = y + 28 + descriptionLines.length * 19;
      noteLines.forEach((line, index) => ctx.fillText(line, columns.desc, noteStart + index * 17));
    }

    ctx.fillStyle = "#374151";
    ctx.font = "600 14px Arial";
    ctx.fillText(String(item.quantity || 1), columns.qty, y + 30);
    ctx.fillText(formatBRL(quoteItemUnitPrice(item)), columns.unit, y + 30);
    ctx.textAlign = "right";
    ctx.fillStyle = "#111827";
    ctx.font = "800 15px Arial";
    ctx.fillText(formatBRL(item.total_price), columns.total, y + 30);
    ctx.textAlign = "left";

    y += rowHeight;
  }

  const totalsHeight = 190;
  if (y + totalsHeight > PAGE_HEIGHT - 130) {
    pages.push(canvas);
    canvas = createCanvas();
    ctx = canvas.getContext("2d");
    drawPageBase(ctx, business, quote, pages.length + 1, null, logoImage);
    y = 216;
  }

  y += 28;
  const totalsX = PAGE_WIDTH - MARGIN - 430;
  drawRoundedRect(ctx, totalsX, y, 430, 166, 14, "#F9FAFB", "#E5E7EB");

  const rows = [
    ["Subtotal", vm.subtotal],
    ...(Number(quote.surcharge_total) > 0 ? [["Adicional", `+ ${vm.surcharge}`]] : []),
    ...(Number(quote.discount_total) > 0 ? [["Desconto", `- ${vm.discount}`]] : []),
  ];

  let ty = y + 30;
  ctx.font = "500 14px Arial";
  rows.forEach(([label, value]) => {
    ctx.fillStyle = "#6B7280";
    ctx.fillText(label, totalsX + 20, ty);
    ctx.textAlign = "right";
    ctx.fillStyle = "#111827";
    ctx.fillText(value, totalsX + 410, ty);
    ctx.textAlign = "left";
    ty += 27;
  });

  ctx.strokeStyle = "#D1D5DB";
  ctx.beginPath();
  ctx.moveTo(totalsX + 20, y + 115);
  ctx.lineTo(totalsX + 410, y + 115);
  ctx.stroke();

  ctx.fillStyle = "#111827";
  ctx.font = "900 19px Arial";
  ctx.fillText("Total", totalsX + 20, y + 145);
  ctx.textAlign = "right";
  ctx.font = "900 26px Arial";
  ctx.fillText(vm.total, totalsX + 410, y + 147);
  ctx.textAlign = "left";
  y += 202;

  const paragraphs = [
    ["Condição de pagamento", quote.payment_terms_snapshot],
    ["Mensagem", quote.message_snapshot],
    ["Observações", quote.notes_snapshot],
    ["Termos e condições", quote.terms_snapshot],
  ].filter(([, value]) => value);

  for (const [title, value] of paragraphs) {
    ctx.font = "400 15px Arial";
    const estimated = 58 + textLines(ctx, value, CONTENT_WIDTH).length * 22;

    if (y + estimated > PAGE_HEIGHT - 110) {
      pages.push(canvas);
      canvas = createCanvas();
      ctx = canvas.getContext("2d");
      drawPageBase(ctx, business, quote, pages.length + 1, null, logoImage);
      y = 216;
    }
    y = drawParagraphBlock(ctx, title, value, MARGIN, y, CONTENT_WIDTH);
  }

  pages.push(canvas);

  // Draw final page numbers after total page count is known.
  pages.forEach((page, index) => {
    const pageCtx = page.getContext("2d");
    pageCtx.fillStyle = "#FFFFFF";
    pageCtx.fillRect(MARGIN - 2, PAGE_HEIGHT - 62, 220, 30);
    pageCtx.fillStyle = "#9CA3AF";
    pageCtx.font = "400 13px Arial";
    pageCtx.fillText(`Página ${index + 1} de ${pages.length}`, MARGIN, PAGE_HEIGHT - 44);
  });

  return Promise.all(pages.map(canvasToJpeg));
}

export async function createQuotePdfBlob({ quote, business, logoUrl = "" }) {
  const jpegs = await renderPdfPages({ quote, business, logoUrl });
  return buildJpegPdf(jpegs);
}

export async function downloadQuotePdf({ quote, business, logoUrl = "" }) {
  const blob = await createQuotePdfBlob({ quote, business, logoUrl });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = buildPdfFilename(quote, business);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function shareQuotePdf({ quote, business, logoUrl = "" }) {
  const blob = await createQuotePdfBlob({ quote, business, logoUrl });
  const filename = buildPdfFilename(quote, business);
  const file = new File([blob], filename, { type: "application/pdf" });

  if (!navigator.share || !navigator.canShare?.({ files: [file] })) {
    throw new Error("Compartilhamento de arquivo não está disponível neste dispositivo. Use Baixar PDF.");
  }

  await navigator.share({
    title: `Orçamento ${quote.quote_number || ""}`,
    text: `Orçamento de ${business.trade_name || business.legal_name || "nossa empresa"}.`,
    files: [file],
  });
}
