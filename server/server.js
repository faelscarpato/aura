
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

require('dotenv').config();
const express = require('express');
const fs = require('fs');
const axios = require('axios');
const https = require('https');
const path = require('path');
const WebSocket = require('ws');
const { URLSearchParams, URL } = require('url');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3000;
const externalApiBaseUrl = 'https://generativelanguage.googleapis.com';
const externalWsBaseUrl = 'wss://generativelanguage.googleapis.com';
// Support either API key env-var variant
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

// Adjusted paths to point to correct locations relative to server/ folder
const staticPath = path.join(__dirname, '../dist');
const publicPath = path.join(__dirname, '../public');

const searchApiKey = process.env.SEARCH_API_KEY;
const newsApiKey = process.env.NEWS_API_KEY;
// Use the provided key as fallback or env var
const weatherApiKey = process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY || 'df759af0fe252eac184917d8f056e3a8';


if (!apiKey) {
    // Only log an error, don't exit. The server will serve apps without proxy functionality
    console.error("Warning: GEMINI_API_KEY or API_KEY environment variable is not set! Proxy functionality will be disabled.");
}
else {
  console.log("API KEY FOUND (proxy will use this)")
}

// Limit body size to 50mb
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({extended: true, limit: '50mb'}));
app.set('trust proxy', 1 /* number of proxies between user and server */)

// Rate limiter for the proxy
const proxyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Set ratelimit window at 15min (in ms)
    max: 100, // Limit each IP to 100 requests per window
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // no `X-RateLimit-*` headers
    handler: (req, res, next, options) => {
        console.warn(`Rate limit exceeded for IP: ${req.ip}. Path: ${req.path}`);
        res.status(options.statusCode).send(options.message);
    }
});

// Apply the rate limiter to the /api-proxy route before the main proxy logic
app.use('/api-proxy', proxyLimiter);

// Search and News APIs (env: SEARCH_API_KEY, NEWS_API_KEY)
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Missing query param q' });
    }
    if (!searchApiKey) {
        // Fallback mock
        return res.json([
            { title: `${query} - Mock Result 1`, snippet: `Resultados simulados para ${query}`, url: 'http://example.com' },
            { title: `${query} - Mock Result 2`, snippet: 'Mais informações simuladas', url: 'http://example.com/2' },
        ]);
    }

    try {
        const searchRes = await axios.post(
            'https://api.serper.dev/search',
            { q: query, gl: 'br', hl: 'pt' },
            { headers: { 'X-API-KEY': searchApiKey, 'Content-Type': 'application/json' } },
        );
        const results = (searchRes.data?.organic || []).slice(0, 5).map((item) => ({
            title: item.title,
            snippet: item.snippet,
            url: item.link,
        }));
        res.json(results);
    } catch (err) {
        console.error('Search API error', err?.response?.data || err.message);
        res.status(500).json({ error: 'Search failed', details: err.message });
    }
});

app.get('/api/news', async (req, res) => {
    const topic = req.query.topic || 'tecnologia';
    if (!newsApiKey) {
       // Fallback Mock
       return res.json([
           { id: '1', title: 'Avanços em IA surpreendem mercado', source: 'TechNews', imageUrl: 'https://picsum.photos/400/200?random=1', summary: 'Novos modelos de linguagem mostram capacidades impressionantes de raciocínio.' },
           { id: '2', title: 'Energia solar bate recorde', source: 'EcoDaily', imageUrl: 'https://picsum.photos/400/200?random=2', summary: 'Uso de energia renovável atinge pico histórico neste mês.' },
       ]);
    }

    try {
        const newsUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(
            topic || 'destaques',
        )}&lang=pt&token=${newsApiKey}`;
        const newsRes = await axios.get(newsUrl);
        const items = (newsRes.data?.articles || []).slice(0, 6).map((article, idx) => ({
            id: article.url || String(idx),
            title: article.title,
            source: article.source?.name || 'Fonte',
            imageUrl: article.image || 'https://picsum.photos/400/200',
            summary: article.description || '',
            url: article.url,
        }));
        res.json(items);
    } catch (err) {
        console.error('News API error', err?.response?.data || err.message);
        res.status(500).json({ error: 'News fetch failed', details: err.message });
    }
});

app.get('/api/weather', async (req, res) => {
    const { q, lat, lon } = req.query;

    if (!weatherApiKey) {
        // Fallback Mock Data if no key
        return res.json({
            location: q || 'São Paulo (Simulado)',
            current: {
                temp: 26,
                feels_like: 28,
                humidity: 60,
                wind_speed: 12,
                condition: { main: 'Clear', description: 'Céu limpo', icon: '01d' }
            },
            hourly: [],
            daily: [],
            updatedAt: new Date().toISOString()
        });
    }

    try {
        let latitude = lat;
        let longitude = lon;
        let locationName = null;

        // 1. Geocoding se uma cidade foi fornecida (q)
        if (q) {
            const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${weatherApiKey}`;
            const geoRes = await axios.get(geoUrl);
            
            if (!geoRes.data || geoRes.data.length === 0) {
                return res.status(404).json({ error: 'Cidade não encontrada' });
            }
            
            latitude = geoRes.data[0].lat;
            longitude = geoRes.data[0].lon;
            locationName = `${geoRes.data[0].name}, ${geoRes.data[0].country}`;
        }

        if (!latitude || !longitude) {
             // Default location (Sao Paulo) if nothing provided
             latitude = -23.55;
             longitude = -46.63;
        }

        // 2. Buscar Dados do Clima
        // Nota: Usamos endpoints padrão (Current + Forecast) pois a chave fornecida é gratuita (Standard)
        // e não suporta a rota 'One Call 2.5' diretamente. Isso garante estabilidade.
        
        const commonParams = `lat=${latitude}&lon=${longitude}&units=metric&lang=pt_br&appid=${weatherApiKey}`;

        // Fetch Current Weather
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?${commonParams}`;
        const weatherRes = await axios.get(weatherUrl);
        
        // Fetch 5 Day / 3 Hour Forecast
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?${commonParams}`;
        const forecastRes = await axios.get(forecastUrl);

        const currentData = weatherRes.data;
        const forecastList = forecastRes.data.list;

        // Helpers de formatação
        const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
        
        // Formatar Hora (ex: "14:00")
        const formatTime = (dt) => {
            const date = new Date(dt * 1000);
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        };

        // Formatar Dia da Semana (ex: "Seg")
        const getDayName = (dt) => {
            const date = new Date(dt * 1000);
            const day = date.toLocaleDateString('pt-BR', { weekday: 'short' });
            return day.charAt(0).toUpperCase() + day.slice(1).replace('.', '');
        };

        // Processar Hourly: Pegar as próximas 8 previsões (24 horas, já que são intervalos de 3h)
        const hourly = forecastList.slice(0, 8).map(item => ({
            time: formatTime(item.dt),
            temp: Math.round(item.main.temp),
            condition: {
                main: item.weather[0].main,
                description: capitalize(item.weather[0].description),
                icon: item.weather[0].icon
            }
        }));

        // Processar Daily: Agregar dados por dia para encontrar min/max real
        const dailyMap = new Map();
        
        forecastList.forEach(item => {
            // Usamos a data (YYYY-MM-DD) para agrupar, mas o display é o nome do dia
            const dateObj = new Date(item.dt * 1000);
            const dayKey = dateObj.toISOString().split('T')[0];
            const dayName = getDayName(item.dt);

            if (!dailyMap.has(dayKey)) {
                dailyMap.set(dayKey, {
                    day: dayName,
                    min: item.main.temp_min,
                    max: item.main.temp_max,
                    condition: { // Pega a condição do meio do dia (aprox) ou a primeira disponível
                        main: item.weather[0].main,
                        description: capitalize(item.weather[0].description),
                        icon: item.weather[0].icon
                    }
                });
            } else {
                const entry = dailyMap.get(dayKey);
                entry.min = Math.min(entry.min, item.main.temp_min);
                entry.max = Math.max(entry.max, item.main.temp_max);
                
                // Lógica simples para pegar ícone do meio do dia (ex: 12h-15h) para representar o dia
                const hour = dateObj.getHours();
                if (hour >= 11 && hour <= 14) {
                     entry.condition = {
                        main: item.weather[0].main,
                        description: capitalize(item.weather[0].description),
                        icon: item.weather[0].icon
                    };
                }
            }
        });

        // Converter mapa para array e pegar os próximos 5 dias
        const daily = Array.from(dailyMap.values()).slice(0, 5).map(d => ({
            day: d.day,
            min: Math.round(d.min),
            max: Math.round(d.max),
            condition: d.condition
        }));

        // Nome da localização: Se veio do Geo, usa o formatado. Se veio de lat/lon, usa o retornado pela API weather
        const finalLocation = locationName || `${currentData.name}, ${currentData.sys.country}`;

        const responseData = {
            location: finalLocation,
            current: {
                temp: Math.round(currentData.main.temp),
                feels_like: Math.round(currentData.main.feels_like),
                humidity: currentData.main.humidity,
                wind_speed: Math.round(currentData.wind.speed * 3.6), // m/s para km/h
                condition: {
                    main: currentData.weather[0].main,
                    description: capitalize(currentData.weather[0].description),
                    icon: currentData.weather[0].icon
                }
            },
            hourly,
            daily,
            updatedAt: new Date().toISOString()
        };

        res.json(responseData);

    } catch (error) {
        console.error('Weather API Error:', error.response?.data || error.message);
        
        if (error.response?.status === 404) {
            return res.status(404).json({ error: 'Cidade ou dados não encontrados' });
        }
        
        // Return simple mock data on failure to keep UI working
        res.json({
            location: 'Modo Offline',
            current: { temp: 0, feels_like: 0, humidity: 0, wind_speed: 0, condition: { main: 'Clear', description: 'Indisponível', icon: '' } },
            hourly: [],
            daily: [],
            updatedAt: new Date().toISOString()
        });
    }
});

// Proxy route for Gemini API calls (HTTP)
app.use('/api-proxy', async (req, res, next) => {
    console.log(req.ip);
    // If the request is an upgrade request, it's for WebSockets, so pass to next middleware/handler
    if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
        return next(); // Pass to the WebSocket upgrade handler
    }

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust as needed for security
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Goog-Api-Key');
        res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight response for 1 day
        return res.sendStatus(200);
    }

    if (req.body) { // Only log body if it exists
        console.log("  Request Body (from frontend):", req.body);
    }
    try {
        // Construct the target URL by taking the part of the path after /api-proxy/
        const targetPath = req.url.startsWith('/') ? req.url.substring(1) : req.url;
        const apiUrl = `${externalApiBaseUrl}/${targetPath}`;
        console.log(`HTTP Proxy: Forwarding request to ${apiUrl}`);

        // Prepare headers for the outgoing request
        const outgoingHeaders = {};
        // Copy most headers from the incoming request
        for (const header in req.headers) {
            // Exclude host-specific headers and others that might cause issues upstream
            if (!['host', 'connection', 'content-length', 'transfer-encoding', 'upgrade', 'sec-websocket-key', 'sec-websocket-version', 'sec-websocket-extensions'].includes(header.toLowerCase())) {
                outgoingHeaders[header] = req.headers[header];
            }
        }

        // Set the actual API key in the appropriate header
        outgoingHeaders['X-Goog-Api-Key'] = apiKey;

        // Set Content-Type from original request if present (for relevant methods)
        if (req.headers['content-type'] && ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())) {
            outgoingHeaders['Content-Type'] = req.headers['content-type'];
        } else if (['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())) {
            // Default Content-Type to application/json if no content type for post/put/patch
            outgoingHeaders['Content-Type'] = 'application/json';
        }

        // For GET or DELETE requests, ensure Content-Type is NOT sent,
        // even if the client erroneously included it.
        if (['GET', 'DELETE'].includes(req.method.toUpperCase())) {
            delete outgoingHeaders['Content-Type']; // Case-sensitive common practice
            delete outgoingHeaders['content-type']; // Just in case
        }

        // Ensure 'accept' is reasonable if not set
        if (!outgoingHeaders['accept']) {
            outgoingHeaders['accept'] = '*/*';
        }


        const axiosConfig = {
            method: req.method,
            url: apiUrl,
            headers: outgoingHeaders,
            responseType: 'stream',
            validateStatus: function (status) {
                return true; // Accept any status code, we'll pipe it through
            },
        };

        if (['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())) {
            axiosConfig.data = req.body;
        }
        // For GET, DELETE, etc., axiosConfig.data will remain undefined,
        // and axios will not send a request body.

        const apiResponse = await axios(axiosConfig);

        // Pass through response headers from Gemini API to the client
        for (const header in apiResponse.headers) {
            res.setHeader(header, apiResponse.headers[header]);
        }
        res.status(apiResponse.status);


        apiResponse.data.on('data', (chunk) => {
            res.write(chunk);
        });

        apiResponse.data.on('end', () => {
            res.end();
        });

        apiResponse.data.on('error', (err) => {
            console.error('Error during streaming data from target API:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Proxy error during streaming from target' });
            } else {
                // If headers already sent, we can't send a JSON error, just end the response.
                res.end();
            }
        });

    } catch (error) {
        console.error('Proxy error before request to target API:', error);
        if (!res.headersSent) {
            if (error.response) {
                const errorData = {
                    status: error.response.status,
                    message: error.response.data?.error?.message || 'Proxy error from upstream API',
                    details: error.response.data?.error?.details || null
                };
                res.status(error.response.status).json(errorData);
            } else {
                res.status(500).json({ error: 'Proxy setup error', message: error.message });
            }
        }
    }
});

const webSocketInterceptorScriptTag = `<script src="/public/websocket-interceptor.js" defer></script>`;

// Prepare service worker registration script content
const serviceWorkerRegistrationScript = `
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load' , () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('Service Worker registered successfully with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
} else {
  console.log('Service workers are not supported in this browser.');
}
</script>
`;

// Serve index.html or placeholder based on API key and file availability
app.get('/', (req, res) => {
    const placeholderPath = path.join(publicPath, 'placeholder.html');

    // Try to serve index.html
    console.log("LOG: Route '/' accessed. Attempting to serve index.html.");
    const indexPath = path.join(staticPath, 'index.html');

    fs.readFile(indexPath, 'utf8', (err, indexHtmlData) => {
        if (err) {
            // index.html not found or unreadable, serve the original placeholder
            console.log('LOG: index.html not found or unreadable. Falling back to original placeholder.');
            return res.sendFile(placeholderPath);
        }

        // If API key is not set, serve original HTML without injection
        if (!apiKey) {
          console.log("LOG: API key not set. Serving original index.html without script injections.");
          return res.sendFile(indexPath);
        }

        // index.html found and apiKey set, inject scripts
        console.log("LOG: index.html read successfully. Injecting scripts.");
        let injectedHtml = indexHtmlData;


        if (injectedHtml.includes('<head>')) {
            // Inject WebSocket interceptor first, then service worker script
            injectedHtml = injectedHtml.replace(
                '<head>',
                `<head>${webSocketInterceptorScriptTag}${serviceWorkerRegistrationScript}`
            );
            console.log("LOG: Scripts injected into <head>.");
        } else {
            console.warn("WARNING: <head> tag not found in index.html. Prepending scripts to the beginning of the file as a fallback.");
            injectedHtml = `${webSocketInterceptorScriptTag}${serviceWorkerRegistrationScript}${indexHtmlData}`;
        }
        res.send(injectedHtml);
    });
});

app.get('/service-worker.js', (req, res) => {
   return res.sendFile(path.join(publicPath, 'service-worker.js'));
});

app.use('/public', express.static(publicPath));
app.use(express.static(staticPath));

// Start the HTTP server
const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    console.log(`HTTP proxy active on /api-proxy/**`);
    console.log(`WebSocket proxy active on /api-proxy/**`);
});

// Create WebSocket server and attach it to the HTTP server
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const pathname = requestUrl.pathname;

    if (pathname.startsWith('/api-proxy/')) {
        if (!apiKey) {
            console.error("WebSocket proxy: API key not configured. Closing connection.");
            socket.destroy();
            return;
        }

        wss.handleUpgrade(request, socket, head, (clientWs) => {
            console.log('Client WebSocket connected to proxy for path:', pathname);

            const targetPathSegment = pathname.substring('/api-proxy'.length);
            const clientQuery = new URLSearchParams(requestUrl.search);
            clientQuery.set('key', apiKey);
            const targetGeminiWsUrl = `${externalWsBaseUrl}${targetPathSegment}?${clientQuery.toString()}`;
            console.log(`Attempting to connect to target WebSocket: ${targetGeminiWsUrl}`);

            const geminiWs = new WebSocket(targetGeminiWsUrl, {
                protocol: request.headers['sec-websocket-protocol'],
            });

            const messageQueue = [];

            geminiWs.on('open', () => {
                console.log('Proxy connected to Gemini WebSocket');
                // Send any queued messages
                while (messageQueue.length > 0) {
                    const message = messageQueue.shift();
                    if (geminiWs.readyState === WebSocket.OPEN) {
                        // console.log('Sending queued message from client -> Gemini');
                        geminiWs.send(message);
                    } else {
                        // Should not happen if we are in 'open' event, but good for safety
                        console.warn('Gemini WebSocket not open when trying to send queued message. Re-queuing.');
                        messageQueue.unshift(message); // Add it back to the front
                        break; // Stop processing queue for now
                    }
                }
            });

            geminiWs.on('message', (message) => {
                // console.log('Message from Gemini -> client');
                if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(message);
                }
            });

            geminiWs.on('close', (code, reason) => {
                console.log(`Gemini WebSocket closed: ${code} ${reason.toString()}`);
                if (clientWs.readyState === WebSocket.OPEN || clientWs.readyState === WebSocket.CONNECTING) {
                    clientWs.close(code, reason.toString());
                }
            });

            geminiWs.on('error', (error) => {
                console.error('Error on Gemini WebSocket connection:', error);
                if (clientWs.readyState === WebSocket.OPEN || clientWs.readyState === WebSocket.CONNECTING) {
                    clientWs.close(1011, 'Upstream WebSocket error');
                }
            });

            clientWs.on('message', (message) => {
                if (geminiWs.readyState === WebSocket.OPEN) {
                    // console.log('Message from client -> Gemini');
                    geminiWs.send(message);
                } else if (geminiWs.readyState === WebSocket.CONNECTING) {
                    // console.log('Queueing message from client -> Gemini (Gemini still connecting)');
                    messageQueue.push(message);
                } else {
                    console.warn('Client sent message but Gemini WebSocket is not open or connecting. Message dropped.');
                }
            });

            clientWs.on('close', (code, reason) => {
                console.log(`Client WebSocket closed: ${code} ${reason.toString()}`);
                if (geminiWs.readyState === WebSocket.OPEN || geminiWs.readyState === WebSocket.CONNECTING) {
                    geminiWs.close(code, reason.toString());
                }
            });

            clientWs.on('error', (error) => {
                console.error('Error on client WebSocket connection:', error);
                if (geminiWs.readyState === WebSocket.OPEN || geminiWs.readyState === WebSocket.CONNECTING) {
                    geminiWs.close(1011, 'Client WebSocket error');
                }
            });
        });
    } else {
        console.log(`WebSocket upgrade request for non-proxy path: ${pathname}. Closing connection.`);
        socket.destroy();
    }
});
