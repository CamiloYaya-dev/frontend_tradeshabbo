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
    const hashtags = "#HabboHotelOrigins #Habbo #THOFansite";

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
            messages: [{ role: "user", content: `Eres el dueño o reportero de una fansite de Habbo Origins. Resume el siguiente contenido en menos de 1000 caracteres manteniendo el contexto de ser una fansite, omitiendo cualquier referencia a links u otros medios, debido a que estas referencias ya estas cubiertas: \n\n"${text}"` }],
            model: "gpt-4o-mini",
            max_tokens: 60,
        });
        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error al generar el resumen:', error);
        return text;
    }
}

export async function postTweetOficial(content, messageUrl, lenguage) {
    const hashtags = "#HabboHotelOrigins #Habbo #OriginsKingdom";
    content = await generateSummaryOfficial(content, lenguage);

    let additionalText;
    switch (lenguage.toLowerCase()) {
        case 'Español':
            additionalText = `🌐 Más información en nuestra fansite:\n👉 https://tradeshabbo.com\n\n💬 Únete a nuestro Discord:\n👉 ${messageUrl}`;
            break;
        case 'Ingles':
            additionalText = `🌐 More information on our fansite:\n👉 https://tradeshabbo.com\n\n💬 Join our Discord:\n👉 ${messageUrl}`;
            break;
        case 'Portugues de brasil':
            additionalText = `🌐 Mais informações em nosso fansite:\n👉 https://tradeshabbo.com\n\n💬 Entre no nosso Discord:\n👉 ${messageUrl}`;
            break;
        default:
            console.error('Idioma no reconocido, usando texto predeterminado en inglés.');
            additionalText = `🌐 More information on our fansite:\n👉 https://tradeshabbo.com\n\n💬 Join our Discord:\n👉 ${messageUrl}`;
            break;
    }    

    let tweetContent = `${content}\n${additionalText}\n${hashtags}`;

    try {
        await rwClient.v2.tweet(tweetContent);
        console.log(`Tweet publicado exitosamente en ${lenguage.toUpperCase()}.`);
    } catch (error) {
        console.error(`Error al publicar el tweet en ${lenguage.toUpperCase()}:`, error);
    }
}

async function generateSummaryOfficial(text, lenguage) {
    try {
        const response = await openaiClient.chat.completions.create({
            messages: [
                {
                  role: "user",
                  content: `Eres el dueño o reportero de una fansite de Habbo Origins. Resume el siguiente contenido en menos de 100 caracteres manteniendo el contexto de ser una fansite, omitiendo cualquier referencia a links u otros medios, debido a que estas referencias ya están cubiertas. Usa correctamente los saltos de línea y añade emojis relacionados con el tema para darle un estilo más dinámico y atractivo. 

                    IMPORTANTE:
                    1. SIEMPRE habla como si fueras un reportero de la fansite 'Origins Kingdom', refiriéndote a las acciones de Habbo en tercera persona.
                    2. No utilices pronombres posesivos como 'nuestro' o 'nosotros'.
                    3. Respetar el orden gramatical de las cosas y redactar todo como si fuera un reportaje.
                    4. El resumen tiene que iniciar con "✨ Origins Kingdom informa" y culminar con "🏨🌟 *(Este es un resumen de una noticia oficial de Habbo Hotel Origins)*".
                    5. Asegúrate de mencionar explícitamente que la información proviene de un anuncio oficial de Habbo Hotel Origins.
                    
                    Contenido a resumir:  
                    ${text}  
                    
                    La noticia debe redactarse en el lenguaje: ${lenguage}`
                }
              ],
            model: "gpt-3.5-turbo",
            max_tokens: 300,
        });
        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error al generar el resumen:', error);
        return text;
    }
}
