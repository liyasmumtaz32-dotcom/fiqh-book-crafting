
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BookStructure, GenerationParams } from "../types";

const convertCitationsToFootnotes = (text: string, chapterIdx: number, sectionIdx: number): string => {
  const footnotes: string[] = [];
  // Replace [[Source]] with [1](#citation-c-s-1)
  const processedText = text.replace(/\[\[(.*?)\]\]/g, (match, content) => {
    footnotes.push(content.trim());
    const index = footnotes.length;
    // Generate a unique ID for the link: citation-{chapterIndex}-{sectionIndex}-{noteIndex}
    return ` [\[${index}\]](#citation-${chapterIdx}-${sectionIdx}-${index})`;
  });

  if (footnotes.length === 0) return text;

  // Add a hidden separator <!--NOTES_SECTION_START--> for the UI to split content and notes
  const footnotesSection = `\n\n<!--NOTES_SECTION_START-->\n\n**Notes:**\n` +
    footnotes.map((note, i) => `${i + 1}. ${note}`).join('\n');

  return processedText + footnotesSection;
};

export const generateBookContent = async (params: GenerationParams): Promise<BookStructure> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please connect to Google Gemini.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Calculate dynamic constraints based on user input
  const estimatedChapters = Math.max(3, Math.ceil(params.pageCount / 4)); 
  
  const wordCountPerSection = params.pageCount > 30 ? "800-1000" : "500-700";

  // Schema definition for the Book Structure
  const bookSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: `The academic title of the Fiqh book in ${params.language}` },
      subtitle: { type: Type.STRING, description: `A descriptive subtitle in ${params.language}` },
      author: { type: Type.STRING, description: "Name of the author" },
      abstract: { type: Type.STRING, description: `A detailed executive summary or abstract of the book (approx 300 words) in ${params.language}` },
      language: { type: Type.STRING, description: "The language code or name used for the content" },
      chapters: {
        type: Type.ARRAY,
        description: `List of chapters in the book. You MUST generate approx ${estimatedChapters} chapters.`,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: `Chapter title in ${params.language}` },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: `Section title in ${params.language}` },
                  content: { type: Type.STRING, description: `The content of the section in ${params.language}. Target length: ${wordCountPerSection} words. MUST include citations in [[Source]] format.` }
                },
                required: ["title", "content"]
              }
            }
          },
          required: ["title", "sections"]
        }
      },
      references: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: `A comprehensive bibliography listing exactly ${params.referenceCount} credible sources.`
      }
    },
    required: ["title", "subtitle", "author", "chapters", "references", "language"]
  };

  // Harakat Instruction
  const languageInstruction = params.language.toLowerCase().includes("arab") 
    ? `You MUST write the entire book in Arabic (العربية). **CRITICAL: You MUST include FULL HARAKAT (Diacritics/Tashkeel) on EVERY word to ensure correct pronunciation for Fiqh terminology.**`
    : `You MUST write the entire book in **${params.language}**.`;

  const systemInstruction = `
    You are 'FIQH BOOK CRAFTING', a world-class AI editor for Islamic Jurisprudence (Fiqh).
    Your goal is to author HIGH-QUALITY academic Fiqh books that are ready for publication.
    
    Adhere to these standards:
    1. **Language**: ${languageInstruction}
    2. **Volume**: The user has requested a book of approximately ${params.pageCount} pages.
    3. **Structure**: Follow strict academic structure (Definition -> Basis/Dalil -> Rulings -> Application/Fatwa -> Conclusion).
    4. **Credibility**: Cite valid sources (Qur'an with Surah/Verse, Hadith with narrator, Classical Kitabs).
    5. **Citations**: You MUST use citations in DOUBLE BRACKETS [[ ]]. Example: "Imam Al-Nawawi stated... [[Al-Majmu', 1/123]]". Do NOT use parentheses ( ) for citations.
    6. **References**: You MUST generate a bibliography list of ${params.referenceCount} distinct items.
    7. **Formatting**: Output pure JSON matching the provided schema.
  `;

  const textPrompt = `
    Create a comprehensive, publication-ready Fiqh book manuscript on the topic: "${params.topic}".
    Author Name: ${params.authorName}.
    Focus Madzhab: ${params.madzhab}.
    Target Audience: ${params.targetAudience}.
    Output Language: ${params.language}.
    ${params.specificChapters ? `\n    **USER SPECIFIED CONTENT/CHAPTERS:**\n    The user has explicitly requested the following content or chapter structure:\n    "${params.specificChapters}"\n    **IMPORTANT:** You MUST strictly incorporate these topics/chapters into the book structure.\n` : ''}
    
    **CRITICAL QUANTITY REQUIREMENTS:**
    1. **Target Length**: The user explicitly requested a ${params.pageCount}-page book. 
       - If the count is high (>40), generate many chapters (${estimatedChapters}+) with deep, extensive detailed text.
    2. **References**: Provide exactly ${params.referenceCount} unique references.
    
    **CONTENT REQUIREMENTS:**
    1. **Detail**: Each section must be detailed, explaining the 'Why' and 'How'.
    2. **Evidence**: Include exhaustive Dalil (Quranic verses, Hadith text/translation, Usul Fiqh maxims).
    3. **In-Notes**: Every Fiqh ruling must have a source citation in double brackets [[ ]] immediately following the statement.
  `;

  const imagePrompt = `
    Generate a photorealistic, high-quality book cover illustration for an Islamic Fiqh book titled "${params.topic}".
    Style: Elegant, Academic, Islamic Geometric Patterns, Calligraphy, Warm Lighting, Cinematic.
    No text on the image.
    Aspect Ratio: 16:9.
  `;

  try {
    // Run Text Generation and Image Generation in parallel
    const [textResponse, imageResponse] = await Promise.all([
        ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: textPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: bookSchema,
                temperature: 0.3,
            }
        }),
        ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: imagePrompt,
            // Note: responseMimeType is NOT supported for image generation models like gemini-2.5-flash-image
            // The image data is returned in the inlineData part.
        })
    ]);

    // Process Text
    const text = textResponse.text;
    if (!text) throw new Error("No response generated from AI");
    const bookData: BookStructure = JSON.parse(text);
    if (!bookData.language) bookData.language = params.language;

    // Process Citations into Footnotes with Indexing
    bookData.chapters.forEach((chapter, cIdx) => {
        chapter.sections.forEach((section, sIdx) => {
            section.content = convertCitationsToFootnotes(section.content, cIdx, sIdx);
        });
    });

    // Process Image
    let coverImageBase64 = "";
    if (imageResponse.candidates && imageResponse.candidates[0].content && imageResponse.candidates[0].content.parts) {
        for (const part of imageResponse.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                coverImageBase64 = part.inlineData.data;
                break;
            }
        }
    }
    
    if (coverImageBase64) {
        bookData.coverImage = `data:image/png;base64,${coverImageBase64}`;
    }

    return bookData;

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};