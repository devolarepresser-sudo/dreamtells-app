import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import {
    interpretDreamWithGPT5,
    analyzeLifeContextWithGPT5,
    generateDailyMessageWithGPT5,
    analyzeGlobalDreamsWithGPT5
} from './services/openAiService.js';
} from './services/openAiService.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Debug – listar rotas
app.get('/api/debug/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach(m => {
        if (m.route) {
            routes.push({
                path: m.route.path,
                methods: m.route.methods
            });
        }
    });
    res.json(routes);
});

// ======================================================
// ROTA 1 — Backend original: /api/interpretarSonho
// ======================================================
app.post('/api/interpretarSonho', async (req, res) => {
    try {
        const { uid, dreamText, premium } = req.body;

        if (!dreamText) {
            return res.status(400).json({
                success: false,
                error: 'Texto do sonho é obrigatório.'
            });
        }

        console.log(`[API] interpretando sonho (rota antiga) UID=${uid}`);

        const result = await interpretDreamWithGPT5(dreamText, uid, premium);

        return res.json({ success: true, data: result });

    } catch (error) {
        console.error('[API Error /api/interpretarSonho]', error);
        return res.status(500).json({
            success: false,
            error: 'Não consegui interpretar seu sonho agora. Tente novamente.'
        });
    }
});

// ======================================================
// ROTA 2 — Rota alternativa: /interpretarSonho
// ======================================================
app.post('/interpretarSonho', async (req, res) => {
    try {
        const { uid, dreamText, premium, text } = req.body;

        const finalText = dreamText || text;

        if (!finalText) {
            return res.status(400).json({
                error: 'Texto do sonho é obrigatório.'
            });
        }

        console.log(`[API] interpretando sonho (rota compatível) UID=${uid}`);

        const result = await interpretDreamWithGPT5(finalText, uid, premium);

        return res.json(result);

    } catch (error) {
        console.error('[API Error /interpretarSonho]', error);
        return res.status(500).json({
            error: 'Não consegui interpretar seu sonho agora. Tente novamente.'
        });
    }
});

// ======================================================
// 🚀 ROTA 3 — ESSA é a que o FRONTEND usa: /dreams/interpret
// ======================================================
app.post('/dreams/interpret', async (req, res) => {
    try {
        const { uid, dreamText, premium, text } = req.body;

        const finalText = dreamText || text;

        if (!finalText) {
            return res.status(400).json({
                error: 'Texto do sonho é obrigatório.'
            });
        }

        console.log(`[API] interpretando sonho (rota oficial do front) UID=${uid}`);

        const result = await interpretDreamWithGPT5(finalText, uid, premium);

        return res.json(result);

    } catch (error) {
        console.error('[API Error /dreams/interpret]', error);
        return res.status(500).json({
            error: 'Não consegui interpretar seu sonho agora. Tente novamente.'
        });
    }
});

// ======================================================
// Outras rotas
// ======================================================
app.post('/api/life-context', async (req, res) => {
    try {
        const { uid, lifeText, recentDreams, language = 'pt' } = req.body;

        if (!lifeText) {
            return res.status(400).json({
                success: false,
                error: 'Texto do contexto é obrigatório.'
            });
        }

        console.log(`[API] Analisando contexto — UID=${uid}`);

        const analysis = await analyzeLifeContextWithGPT5(
            lifeText,
            recentDreams,
            uid,
            language
        );

        return res.json({ success: true, message: analysis });

    } catch (error) {
        console.error('[API Error /api/life-context]', error);
        return res.status(500).json({ success: false, error: 'Erro ao analisar contexto.' });
    }
});

app.post('/api/daily-message', async (req, res) => {
    try {
        const { uid, recentDreams, language } = req.body;

        console.log(`[API] Mensagem do dia — UID=${uid}`);

        const message = await generateDailyMessageWithGPT5(
            recentDreams,
            uid,
            language
        );

        return res.json({ success: true, message });

    } catch (error) {
        console.error('[API Error /api/daily-message]', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao gerar mensagem do dia.'
        });
    }
});

// ======================================================
// ROTA 4 — Análise Global (Fase de Vida)
// ======================================================
app.post('/api/global-analysis', async (req, res) => {
    try {
        const { dreams, userId, language } = req.body;

        if (!dreams || !Array.isArray(dreams) || dreams.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'É necessário fornecer um histórico de sonhos para a análise.'
            });
        }

        console.log(`[API] Análise Global (Fase de Vida) — UID=${userId}`);

        const analysis = await analyzeGlobalDreamsWithGPT5(
            dreams,
            userId,
            language || 'pt'
        );

        return res.json({ success: true, analysis });

    } catch (error) {
        console.error('[API Error /api/global-analysis]', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao analisar fase de vida. Tente novamente.'
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`DreamTells Backend rodando em http://localhost:${port}`);
});
