import { jsPDF } from "jspdf";
import dayjs from "dayjs";

import { defaultCertificateTemplate, type CertificateData, type CertificateTemplate } from '../templates/certificate-template';

export const generateCertificatePDF = async (
  certificate: CertificateData,
  template: CertificateTemplate = defaultCertificateTemplate
): Promise<Blob> => {
  const pdf = new jsPDF({
    orientation: template.orientation,
    unit: "pt",
    format: template.pageFormat,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const backgroundImage = "/BGF.png";


  const loadImage = (
    src: string,
    maxWidth?: number,
    maxHeight?: number,
    quality: number = 0.7,
    format: "jpeg" | "png" = "jpeg"
  ): Promise<{ dataUrl: string; width: number; height: number }> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (maxWidth && width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (maxHeight && height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas context not found");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl =
          format === "png"
            ? canvas.toDataURL("image/png")
            : canvas.toDataURL("image/jpeg", quality);

        resolve({ dataUrl, width, height });
      };
      img.onerror = () => reject(`Failed to load image: ${src}`);
      img.src = src;
    });

  try {
    const [bg] = await Promise.all([
      loadImage(backgroundImage, 1200, 850, 0.7, "jpeg"), // background as jpeg

    ]);
    pdf.addImage(bg.dataUrl, "JPEG", 0, 0, pageWidth, pageHeight);

    // const borderMargin = 40;



    const outerMargin = 11;
    const innerMargin = 27;

    pdf.setDrawColor(18, 24, 66);
    pdf.setLineWidth(10);
    pdf.rect(
      outerMargin,                  // x
      outerMargin,                  // y
      pageWidth - 2 * outerMargin,  // width
      pageHeight - 2 * outerMargin  // height
    );

    pdf.setDrawColor(2, 132, 199);
    pdf.setLineWidth(1.5);
    pdf.rect(
      innerMargin,
      innerMargin,
      pageWidth - 2 * innerMargin,
      pageHeight - 2 * innerMargin
    );



    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(18, 24, 66);
    pdf.setFontSize(28);
    const title = "CERTIFICATE OF COMPLETION";
    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, (pageWidth - titleWidth) / 2, 180);

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 116, 139);
    pdf.text("This is to certify that", pageWidth / 2, 210, { align: "center" });



    pdf.text("This is to certify that", pageWidth / 2, 210, { align: "center" });

    // Move everything below further down
    const yOffset = 22; // 👈 adjust spacing here

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(36);
    pdf.setTextColor(4, 40, 91);
    pdf.text(certificate.recipientName, pageWidth / 2, 250 + yOffset, { align: "center" });

    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(2);
    pdf.line(pageWidth / 2 - 175, 260 + yOffset, pageWidth / 2 + 175, 260 + yOffset);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(16);
    pdf.setTextColor(51, 65, 85);

    // ✅ Decide what to print
    const certificateText =
      certificate.content && certificate.content.trim().length > 0
        ? certificate.content
        : `Successfully completed internship on ${certificate.course}`;

    // ✅ Auto-wrap if text is long
    // const textWidth = pageWidth - 170; // margins
    // const splitText = pdf.splitTextToSize(certificateText, textWidth);

    // pdf.text(splitText, pageWidth / 2, 290 + yOffset, { align: "center" });
    // ✅ Auto-wrap if text is long
    const textWidth = pageWidth - 170; // margins
    const splitText = pdf.splitTextToSize(certificateText, textWidth);

    // ✅ Add custom spacing between lines
    const lineHeight = 25; // <-- increase for more gap
    let startY = 290 + yOffset;

    pdf.setFontSize(16);
    pdf.setTextColor(51, 65, 85);

    splitText.forEach((line, i) => {
      pdf.text(line, pageWidth / 2, startY + i * lineHeight, { align: "center" });
    });



    // pdf.setFontSize(14);
    // pdf.text(
    //   `Duration: ${certificate.duration} | Department: ${certificate.department}`,
    //   pageWidth / 2,
    //   315 + yOffset,
    //   { align: "center" }
    // );



    pdf.setFont("courier", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Certificate ID: ${certificate.certificateId}`, 40, pageHeight - 70);
    pdf.text(
      `Issue Date: ${dayjs(certificate.createdAt ?? Date.now()).format("DD/MM/YYYY")}`,
      40,
      pageHeight - 55
    );

    return pdf.output("blob");
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new Blob(); // fallback empty blob
  }
};
