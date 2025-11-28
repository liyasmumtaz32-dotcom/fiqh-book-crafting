
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  Footer, 
  PageNumber, 
  TableOfContents, 
  PageBreak, 
  BorderStyle,
  SectionType,
} from "docx";
import FileSaver from "file-saver";
import { BookStructure } from "../types";

/**
 * Aggressively sanitizes text to be XML-safe for Word.
 * Removes any control characters that could cause corruption.
 */
const cleanText = (text: string | null | undefined): string => {
  if (!text) return "";
  
  // 1. Basic regex to allow only valid characters.
  // We keep tabs, newlines, basic punctuation, and all unicode letters/numbers.
  // We strip out low ASCII control chars (0-31) except \t, \n, \r.
  let safeText = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 2. Remove zero-width characters that often break XML parsers
  safeText = safeText.replace(/[\u200B-\u200D\uFEFF]/g, "");

  // 3. Remove the internal UI separator for footnotes
  safeText = safeText.replace(/<!--NOTES_SECTION_START-->/g, "");

  // 4. Simple Markdown stripping for Word compatibility
  safeText = safeText
    .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
    .replace(/\*(.*?)\*/g, "$1")     // Italic
    .replace(/#{1,6}\s/g, "")        // Headers
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Links
    .replace(/`/g, "");              // Code

  return safeText.trim();
};

/**
 * Converts text lines to Docx Paragraphs.
 * Handles RTL logic and empty lines safely.
 */
const markdownToParagraphs = (text: string, isRtl: boolean = false, styleId?: string): Paragraph[] => {
    const cleaned = cleanText(text);
    const lines = cleaned.split(/\n+/);
    
    return lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) {
            // Return an empty paragraph to maintain spacing without breaking XML
            return new Paragraph({ children: [new TextRun("")] }); 
        }
        
        return new Paragraph({
            children: [
                new TextRun({
                    text: trimmed,
                    font: isRtl ? "Traditional Arabic" : "Times New Roman",
                    size: 24, // 12pt
                    rightToLeft: isRtl, // Essential for TextRun
                })
            ],
            style: styleId,
            bidirectional: isRtl, // Essential for Paragraph
            alignment: isRtl ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
            spacing: { line: 360, after: 200 } // 1.5 line spacing
        });
    });
};

/**
 * Generates a professional Word document from the BookStructure.
 */
export const downloadWordDocument = async (book: BookStructure) => {
  
  const isRtl = book.language === 'Arabic';
  const titleFont = isRtl ? "Traditional Arabic" : "Cambria";
  const bodyFont = isRtl ? "Traditional Arabic" : "Times New Roman";
  
  const doc = new Document({
    styles: {
      default: {
          document: {
              run: {
                  font: bodyFont,
                  size: 24,
              },
              paragraph: {
                  spacing: { line: 360 },
              }
          }
      },
      paragraphStyles: [
        {
          id: "CustomTitle",
          name: "Custom Title",
          basedOn: "Normal",
          next: "Normal",
          run: {
            font: titleFont,
            size: 64, // 32pt
            bold: true,
            color: "064E3B",
            rightToLeft: isRtl,
          },
          paragraph: {
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 240 },
            bidirectional: isRtl
          }
        },
        {
            id: "CustomSubtitle",
            name: "Custom Subtitle",
            basedOn: "Normal",
            next: "Normal",
            run: {
              font: titleFont,
              size: 28, // 14pt
              italics: true,
              color: "555555",
              rightToLeft: isRtl,
            },
            paragraph: {
              alignment: AlignmentType.CENTER,
              spacing: { after: 480 },
              bidirectional: isRtl
            }
          }
      ],
    },
    sections: [{
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          margin: {
            top: 1440, // 2.54 cm
            bottom: 1440,
            left: 1440,
            right: 1440,
          },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: {
                  top: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "CCCCCC" }
              },
              children: [
                new TextRun({
                    text: "Page ",
                    font: bodyFont,
                }),
                // PageNumber.CURRENT works as a child of Paragraph
                PageNumber.CURRENT, 
                new TextRun({
                    text: " of ",
                    font: bodyFont,
                }),
                PageNumber.TOTAL_PAGES,
              ],
            }),
          ],
        }),
      },
      children: [
        // --- COVER PAGE ---
        new Paragraph({
          text: "ANTONI'S BOOK CRAFT",
          alignment: AlignmentType.CENTER,
          spacing: { before: 2000, after: 2000 },
          border: {
             bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "D97706" }
          },
          run: {
            font: "Inter",
            size: 20,
            color: "999999",
            allCaps: true,
          }
        }),
        new Paragraph({
            children: [new TextRun("")],
            spacing: { after: 2000 }
        }),
        new Paragraph({
          text: cleanText(book.title),
          style: "CustomTitle", 
        }),
        new Paragraph({
          text: cleanText(book.subtitle),
          style: "CustomSubtitle",
        }),
        new Paragraph({
            children: [new TextRun("")],
            spacing: { after: 2000 }
        }),
        new Paragraph({
          text: "Written by",
          alignment: AlignmentType.CENTER,
          run: { size: 24, font: bodyFont }
        }),
        new Paragraph({
          text: cleanText(book.author),
          alignment: AlignmentType.CENTER,
          run: { size: 32, bold: true, font: bodyFont },
          spacing: { after: 4000 }
        }),
        new Paragraph({
            text: new Date().getFullYear().toString(),
            alignment: AlignmentType.CENTER,
            run: { size: 24, font: bodyFont }
        }),
        // FIX: PageBreak must be wrapped in a Paragraph
        new Paragraph({ children: [new PageBreak()] }),

        // --- TABLE OF CONTENTS ---
        new Paragraph({
          text: isRtl ? "Daftar Isi" : "Table of Contents",
          heading: HeadingLevel.HEADING_1,
          alignment: isRtl ? AlignmentType.RIGHT : AlignmentType.CENTER,
          bidirectional: isRtl,
          run: { 
              font: titleFont, 
              bold: true, 
              size: 48,
              color: "064E3B",
              rightToLeft: isRtl
          }
        }),
        new TableOfContents("Summary", {
          hyperlink: true,
          headingStyleRange: "1-5",
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // --- ABSTRACT ---
        new Paragraph({
          text: "Abstract",
          heading: HeadingLevel.HEADING_1,
          bidirectional: isRtl,
          alignment: isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
          run: { 
            font: titleFont, 
            bold: true, 
            size: 48,
            color: "064E3B",
            rightToLeft: isRtl
        }
        }),
        ...markdownToParagraphs(book.abstract, isRtl),
        new Paragraph({ children: [new PageBreak()] }),

        // --- CONTENT LOOP ---
        ...book.chapters.flatMap((chapter) => [
          new Paragraph({
            text: cleanText(chapter.title),
            heading: HeadingLevel.HEADING_1,
            pageBreakBefore: true,
            bidirectional: isRtl,
            alignment: isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
            spacing: { before: 400, after: 200 },
            run: { 
                font: titleFont, 
                bold: true, 
                size: 48,
                color: "064E3B",
                rightToLeft: isRtl
            }
          }),
          ...chapter.sections.flatMap((section) => [
            new Paragraph({
              text: cleanText(section.title),
              heading: HeadingLevel.HEADING_2,
              bidirectional: isRtl,
              alignment: isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
              spacing: { before: 300, after: 150 },
              run: { 
                font: titleFont, 
                bold: true, 
                size: 36,
                color: "D97706",
                rightToLeft: isRtl
            }
            }),
            ...markdownToParagraphs(section.content, isRtl)
          ]),
        ]),

        // --- REFERENCES ---
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({
          text: "References",
          heading: HeadingLevel.HEADING_1,
          bidirectional: isRtl,
          alignment: isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
          run: { 
            font: titleFont, 
            bold: true, 
            size: 48,
            color: "064E3B",
            rightToLeft: isRtl
        }
        }),
        ...book.references.map(ref => new Paragraph({
            children: [
                new TextRun({
                    text: cleanText(ref),
                    font: bodyFont,
                    rightToLeft: isRtl
                })
            ],
            bullet: { level: 0 },
            bidirectional: isRtl,
            alignment: isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT
        }))
      ],
    }],
  });

  // 2. Pack and Download
  try {
      const blob = await Packer.toBlob(doc);
      const saveAs = (FileSaver as any).saveAs || FileSaver;
      saveAs(blob, `${cleanText(book.title).replace(/[\s\W]+/g, "_")}_AntoniBookCraft.docx`);
  } catch (error) {
      console.error("Error generating Word document:", error);
      alert("Could not generate Word document. Please check console for details.");
  }
};