import { jsPDF } from "jspdf";
import * as Papa from "papaparse";
import dayjs from "dayjs";

// --------------------- Utility Functions ---------------------
function normalizeKeys(obj: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  for (const key in obj) {
    const camel = toCamelCase(key);

    // Map directly to expected placeholders with better pattern matching
    if (camel.includes("recipient") || camel.includes("name")) {
      normalized["recipientName"] = obj[key];
    } else if (camel.includes("intern") && camel.includes("id")) {
      normalized["internId"] = obj[key];
    } else if (camel.includes("course") && !camel.includes("code")) {
      normalized["courseName"] = obj[key];
    } else if (camel.includes("project") || camel.includes("title")) {
      normalized["projectTitle"] = obj[key];
    } else if (camel.includes("start") && camel.includes("date")) {
      normalized["startDate"] = obj[key];
    } else if (camel.includes("end") && camel.includes("date")) {
      normalized["endDate"] = obj[key];
    } else if (camel.includes("department")) {
      normalized["department"] = obj[key];
    } else if (camel.includes("college")) {
      normalized["college"] = obj[key];
    } else if (camel.includes("duration")) {
      normalized["duration"] = obj[key];
    } else if (camel.includes("position")) {
      normalized["position"] = obj[key];
    } else {
      normalized[camel] = obj[key];
    }
  }
  return normalized;
}

function parseCSV(csvString: string): Promise<LetterData[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvString, {
      header: true,
      transformHeader: (header) => toCamelCase(header.trim()),
      skipEmptyLines: true,
      dynamicTyping: false, // Keep everything as strings
      complete: (results) => {
        if (results.errors.length) {
          reject(results.errors);
        } else {
          // Normalize each row
          const normalizedData = results.data.map((row) => normalizeKeys(row));
          resolve(normalizedData as LetterData[]);
        }
      },
    });
  });
}

// Utility to convert any string to camelCase
function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""));
}

// Interface for your letter data
interface LetterData {
  recipientName: string;
  internId: string;
  courseName: string;
  projectTitle: string;
  startDate: string;
  endDate: string;
  department?: string;
  college?: string;
  duration?: string;
  position?: string;
}

// ✅ NEW: Centralized data formatting function
function formatLetterData(letter: any): Record<string, string> {
  // Ensure all required fields exist with fallbacks
  const formatted = {
    recipientName: letter.recipientName || letter.name || "",
    internId: letter.internId || letter.id || "",
    courseName: letter.courseName || letter.course || "",
    projectTitle: letter.projectTitle || letter.project || "",
    department: letter.department || "",
    college: letter.college || "",
    duration: letter.duration || "",
    position: letter.position || letter.courseName || "Intern",
    date: letter.date || dayjs().format("DD/MM/YYYY")
  };

  // ✅ Format dates consistently
  if (letter.startDate) {
    // Handle various date formats
    const startDate = dayjs(letter.startDate);
    if (startDate.isValid()) {
      formatted.startDate = startDate.format("MMMM D, YYYY");
    } else {
      formatted.startDate = letter.startDate;
    }
  } else {
    formatted.startDate = "";
  }

  if (letter.endDate) {
    const endDate = dayjs(letter.endDate);
    if (endDate.isValid()) {
      formatted.endDate = endDate.format("MMMM D, YYYY");
    } else {
      formatted.endDate = letter.endDate;
    }
  } else {
    formatted.endDate = "";
  }

  return formatted;
}

// ---------------- Perfect Justified Text Renderer ----------------
function renderTemplateText(
  pdf: jsPDF,
  template: string,
  data: Record<string, string>,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  paragraphGap: number = 4
): number {
  const paragraphs = template.split(/\n\s*\n/); // split on blank lines

  paragraphs.forEach((para, pIdx) => {
    // Parse placeholders inside each paragraph
    const regex = /{{(.*?)}}/g;
    const tokens: { text: string; bold?: boolean }[] = [];

    let lastIndex = 0;
    let match;
    while ((match = regex.exec(para)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({ text: para.substring(lastIndex, match.index) });
      }
      const key = match[1].trim();
      const value = data[key] || `[${key}]`; // Show missing keys for debugging
      tokens.push({ text: value, bold: true });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < para.length) {
      tokens.push({ text: para.substring(lastIndex) });
    }

    // Break into words while preserving formatting
    const words: { text: string; bold?: boolean; isSpace?: boolean }[] = [];
    tokens.forEach((token) => {
      if (!token.text) return;

      const parts = token.text.split(/(\s+)/); // Split but keep spaces
      parts.forEach((part) => {
        if (part.match(/^\s+$/)) {
          // It's whitespace
          words.push({ text: part, isSpace: true });
        } else if (part.trim()) {
          // It's a word
          words.push({ text: part, bold: token.bold });
        }
      });
    });

    // Remove leading/trailing spaces and normalize internal spaces
    const cleanWords = words.filter(w => !(w.isSpace && (words.indexOf(w) === 0 || words.indexOf(w) === words.length - 1)));

    // Group consecutive spaces into single spaces
    const finalWords: { text: string; bold?: boolean; isSpace?: boolean }[] = [];
    for (let i = 0; i < cleanWords.length; i++) {
      const word = cleanWords[i];
      if (word.isSpace) {
        // Only add one space, skip consecutive spaces
        if (finalWords.length === 0 || !finalWords[finalWords.length - 1].isSpace) {
          finalWords.push({ text: " ", isSpace: true });
        }
      } else {
        finalWords.push(word);
      }
    }

    // Render lines with perfect justification
    let line: { text: string; bold?: boolean; isSpace?: boolean }[] = [];
    let currentY = y;

    const flushLine = (isLastLine: boolean) => {
      if (line.length === 0) return;

      // Separate words and spaces
      const textWords = line.filter(w => !w.isSpace);
      const spaceCount = line.filter(w => w.isSpace).length;

      if (textWords.length === 0) return;

      // Calculate total width of text without spaces
      let totalTextWidth = 0;
      textWords.forEach(word => {
        pdf.setFont("Courier", word.bold ? "bold" : "normal");
        totalTextWidth += pdf.getTextWidth(word.text);
      });

      // Calculate space distribution for perfect justification
      let spaceWidth = pdf.getTextWidth(" "); // Default space width

      if (!isLastLine && spaceCount > 0 && totalTextWidth < maxWidth) {
        // Distribute extra space evenly among all spaces
        const extraSpace = maxWidth - totalTextWidth;
        spaceWidth = extraSpace / spaceCount;
      }

      // Render the line
      let cursorX = x;
      line.forEach(item => {
        if (item.isSpace) {
          cursorX += spaceWidth;
        } else {
          pdf.setFont("Courier", item.bold ? "bold" : "normal");
          pdf.text(item.text, cursorX, currentY);
          cursorX += pdf.getTextWidth(item.text);
        }
      });

      currentY += lineHeight;
      line = [];
    };

    // Build lines word by word
    for (let i = 0; i < finalWords.length; i++) {
      const word = finalWords[i];

      // Calculate width if we add this word to current line
      let lineWidth = 0;
      const testLine = [...line, word];

      testLine.forEach(item => {
        if (item.isSpace) {
          lineWidth += pdf.getTextWidth(" ");
        } else {
          pdf.setFont("Courier", item.bold ? "bold" : "normal");
          lineWidth += pdf.getTextWidth(item.text);
        }
      });

      // If adding this word exceeds max width and we have content, flush the line
      if (lineWidth > maxWidth && line.length > 0) {
        flushLine(false);

        // Start new line with current word (unless it's just a space)
        if (!word.isSpace) {
          line = [word];
        }
      } else {
        line.push(word);
      }
    }

    // Flush remaining line
    if (line.length > 0) {
      flushLine(true); // Last line is left-aligned
    }

    y = currentY;

    // Add paragraph gap
    if (pIdx < paragraphs.length - 1) {
      y += paragraphGap;
    }
  });

  return y;
}

// --------------------- Main PDF Generator ---------------------

export const generateLetterPDF = async (letter: any): Promise<Blob> => {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const type = (letter.letterType || "").toLowerCase();
  const backgroundImageUrl = type === "offer" ? "/IOL-1.png" : "/ICL-1.png";

  // Load background image
  const loadImageAsBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  try {
    const backgroundBase64 = await loadImageAsBase64(backgroundImageUrl);
    pdf.addImage(backgroundBase64, "PNG", 0, 0, pageWidth, pageHeight);
  } catch (error) {
    console.warn("Could not load background image:", error);
  }

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont("Courier", "normal");

  // ✅ Format the data consistently for both bulk and individual generation
  const formattedData = formatLetterData(letter);
  
  console.log("Formatted letter data:", formattedData);

  let yPosition = 65;

  // ---------------- OFFER LETTER ----------------
  if (type === "offer") {
    pdf.setFont("Courier", "bold");
    pdf.text(`Date: ${formattedData.date}`, 20, yPosition);

    yPosition += 6;
    pdf.setFont("Courier", "bold");
    pdf.text(`Dear ${formattedData.recipientName},`, 20, yPosition);

    yPosition += 8;
    pdf.setFont("helvetica", "bold");
    pdf.text(
      `SUB: Our offer for the position of ${formattedData.position}`,
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );

    yPosition += 10;
    pdf.setFont("Courier", "normal");

    const bodyWidth = 170;
    const leftMargin = 20;

    const body = `
We are excited to offer you the {{courseName}} intern position at Tarcin Robotic LLP. 
If you accept, your internship will commence on {{startDate}}, with a requirement of at least 30 hours per week. 
The internship is scheduled to run from {{startDate}} to {{endDate}}, and there is a possibility of an extension based on your performance, engagement, contribution, and overall well-being.

As an intern you will have the opportunity to work on cutting-edge projects in the field of {{courseName}}. 
We encourage you to take full advantage of this opportunity by actively participating in all assigned tasks and projects. 
Your contributions will be valued, and we look forward to seeing your growth and development throughout the internship.

By accepting this Intern offer, you agree to maintain confidentiality regarding all company information and to refrain from using it for personal gain or disclosing it to external parties. 
Please indicate your acceptance of this offer by signing below and returning it to us. 
If you have any questions, please do not hesitate to contact us. We look forward to your positive response!
`;

    yPosition = renderTemplateText(
      pdf,
      body.trim(),
      formattedData, // ✅ Use consistently formatted data
      leftMargin,
      yPosition,
      bodyWidth,
      6,
      10
    );
  }

  // ---------------- COMPLETION LETTER ----------------
  else if (type === "completion") {
    yPosition = 30;
    pdf.setFont("Courier", "bold");
    pdf.setFontSize(10);

    const rightMargin = pageWidth - 20;
    pdf.setFont("Courier", "bold");
    pdf.text(`Date: ${formattedData.date}`, rightMargin, yPosition, {
      align: "right",
    });

    yPosition += 20;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("TO WHOM SO EVER IT MAY CONCERN", pageWidth / 2, yPosition, {
      align: "center",
    });

    yPosition += 20;

    pdf.setFont("Courier", "normal");
    pdf.setFontSize(10);

    const body = `
This is to certify that {{recipientName}}  has successfully completed the internship at Tarcin Robotics in the field of {{courseName}}, during which the intern undertook a project titled '{{projectTitle}}' from {{startDate}} to {{endDate}}.

Throughout the internship, {{recipientName}} displayed exceptional performance and dedication. 
The intern actively engaged in various real-time projects, demonstrating the ability to apply theoretical knowledge to practical scenarios.

The final internship report reflects a thorough understanding of the projects worked on, and the concepts learned. 
Contributions have been valuable, and all the requirements of the internship program have been successfully met.

We commend the hard work and wish all the best for a successful future.
`;

    const bodyWidth = 170;
    const leftMargin = 20;

    yPosition = renderTemplateText(
      pdf,
      body.trim(),
      formattedData, // ✅ Use consistently formatted data
      leftMargin,
      yPosition,
      bodyWidth,
      7,
      10
    );
  }

  return pdf.output("blob");
};