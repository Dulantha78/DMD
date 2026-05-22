const axios = require('axios');

const API_KEY = 'lakiya_4a2682823c3f3a7d3dd8621706332cfc8b983c26f3dc0827ab978f68db4b7dce';
const BASE_URL = 'https://nexora-api-site-new.vercel.app/cinesubz';

module.exports = {
    name: "cinesubz",
    alias: ["movie", "cine"],
    category: "download",
    desc: "Search, download and send movies from Cinesubz as document.",
    use: ".cinesubz <film_name>",
    async run(conn, mek, msg, args, { from, reply }) {
        try {
            const query = args.join(' ');
            if (!query) return reply("❌ Please provide a movie name to search!\n\n*Example:* .cinesubz Spiderman");

            await reply("🔍 *DULANTHA-MD* is searching for your movie. Please wait...");

            // 1. SEARCH MOVIE
            const searchRes = await axios.get(`${BASE_URL}/search?query=${encodeURIComponent(query)}&api_key=${API_KEY}`);
            
            if (!searchRes.data || !searchRes.data.status || searchRes.data.result.length === 0) {
                return reply("❌ Sorry! No movies found with that name.");
            }

            const firstMovie = searchRes.data.result[0];

            // 2. GET DETAILS
            const detailsRes = await axios.get(`${BASE_URL}/details?url=${encodeURIComponent(firstMovie.link)}&api_key=${API_KEY}`);
            
            if (!detailsRes.data || !detailsRes.data.status) {
                return reply("❌ Failed to fetch movie details. Please try again.");
            }

            const movie = detailsRes.data.result;

            let movieInfo = `🎬 *${movie.title || 'Unknown Title'}* \n\n`;
            if (movie.date) movieInfo += `📅 *Released:* ${movie.date}\n`;
            if (movie.rating) movieInfo += `⭐ *Rating:* ${movie.rating}\n`;
            if (movie.runtime) movieInfo += `⏱️ *Duration:* ${movie.runtime}\n`;
            movieInfo += `📝 *Description:* ${movie.sin_title || 'Sinhala Subtitles'}\n\n`;
            movieInfo += `⏳ Fetching the best quality download link and uploading the file. This may take a few minutes depending on the file size...`;

            if (movie.image) {
                await conn.sendMessage(from, { image: { url: movie.image }, caption: movieInfo }, { quoted: mek });
            } else {
                await reply(movieInfo);
            }

            // 3. GET DIRECT LINK & SEND AS DOCUMENT
            if (movie.dl_links && movie.dl_links.length > 0) {
                

                const dlItem = movie.dl_links[0]; 
                
                
                const directRes = await axios.get(`${BASE_URL}/dl?url=${encodeURIComponent(dlItem.link)}&api_key=${API_KEY}`);
                
                if (directRes.data && directRes.data.status && directRes.data.result.url) {
                    const finalDownloadLink = directRes.data.result.url;
                    const fileName = `${movie.title || 'Movie'}_${dlItem.quality || 'Video'}.mp4`;

                    
                    await conn.sendMessage(from, { 
                        document: { url: finalDownloadLink }, 
                        mimetype: 'video/mp4', 
                        fileName: fileName,
                        caption: `🎬 *${movie.title}*\n💿 Quality: ${dlItem.quality || 'N/A'}\n📁 Size: ${dlItem.size || 'N/A'}\n\n*Powered by DULANTHA-MD*`
                    }, { quoted: mek });

                } else {
                    return reply("❌ Failed to generate a direct download link for the file.");
                }
            } else {
                await reply("❌ No download links found for this movie.");
            }

        } catch (error) {
            console.error("Cinesubz Command Error:", error);
            reply("❌ An internal error occurred or the file is too large to download! Please try again later.");
        }
    }
};
