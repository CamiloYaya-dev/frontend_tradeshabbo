import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSummaryWeb(text, hotel) {
    let idioma = '';
    if (hotel == "es") {
        idioma = 'Español'
    } else if (hotel == "com") {
        idioma = 'Ingles'
    } else if (hotel == "com.br") {
        idioma = 'Portugues de brasil'
    }
    try {
        const response = await openaiClient.chat.completions.create({
            messages: [{ role: "user", content: `"${text} \n Es muy importante que el resumen esté en el idioma ${idioma}"` }],
            model: "gpt-4o-mini",
            max_tokens: 600,
        });
        const generatedText = response.choices[0]?.message?.content.trim();
        if (!generatedText) {
            throw new Error("Respuesta vacía de OpenAI.");
        }
        return generatedText;
    } catch (error) {
        console.error("Error al generar el resumen con OpenAI:", error);
        return null;
    }
}
