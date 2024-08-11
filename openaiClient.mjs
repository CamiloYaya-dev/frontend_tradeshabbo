import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSummaryWeb(text) {
    try {
        const response = await openaiClient.chat.completions.create({
            messages: [{ role: "user", content: `"${text}"` }],
            model: "gpt-3.5-turbo",
            max_tokens: 600,
        });
        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error al generar el resumen:', error);
        return text; // Si falla, devuelve el texto original
    }
}
