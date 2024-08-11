import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET_KEY,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const rwClient = client.readWrite;

export async function postTweet(content, messageUrl) {
    // Añadir las menciones y hashtags predeterminados
    const hashtags = "@HabboOrigins #HabboHotelOrigins #Habbo #THOFansite";

    content = await generateSummary(content);
    let tweetContent = `${content}\nMás información en nuestra fansite: https://www.tradeshabbo.com o en nuestro Discord: ${messageUrl}\n${hashtags}`;

    try {
        await rwClient.v2.tweet(tweetContent);
        console.log('Tweet publicado exitosamente en Twitter.');
    } catch (error) {
        console.error('Error al publicar el tweet:', error);
    }
}

async function generateSummary(text) {
    try {
        const response = await openaiClient.chat.completions.create({
            messages: [{ role: "user", content: `Eres el dueño o reportero de una fansite de Habbo Origins. Resume el siguiente contenido en menos de 200 caracteres manteniendo el contexto de ser una fansite, omitiendo cualquier referencia a links u otros medios, debido a que estas referencias ya estas cubiertas: \n\n"${text}"` }],
            model: "gpt-3.5-turbo",
            max_tokens: 60,
        });
        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error al generar el resumen:', error);
        return text; // Si falla, devuelve el texto original
    }
}
