
/**
 * ShareService.ts
 * Utilitários para geração de cards magnéticos (Canvas) e compartilhamento.
 */

export const generateStoryCard = async (data: {
    title: string;
    subtitle: string;
    mainValue: string;
    summary: string;
    footerText: string;
    ctaText: string;
    badgeText?: string;
    theme?: 'night' | 'sun';
}): Promise<Blob | null> => {
    return new Promise((resolve) => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(null);
                return;
            }

            // Formato 9:16 (Stories)
            canvas.width = 1080;
            canvas.height = 1920;

            // 1. Fundo Deep Social
            const grd = ctx.createLinearGradient(0, 0, 0, 1920);
            if (data.theme === 'sun') {
                grd.addColorStop(0, '#1E1B4B'); // Azul marinho profundo no topo
                grd.addColorStop(1, '#431407'); // Marrom avermelhado/laranja escuro na base
            } else {
                grd.addColorStop(0, '#0F172A');
                grd.addColorStop(1, '#020617');
            }
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 1080, 1920);

            // 2. Glows Sutis
            const drawGlow = (x: number, y: number, radius: number, color: string) => {
                const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
                glow.addColorStop(0, color);
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            };

            if (data.theme === 'sun') {
                drawGlow(540, 400, 900, 'rgba(246, 224, 94, 0.2)'); // Glow Amarelo topo
                drawGlow(900, 1600, 800, 'rgba(234, 88, 12, 0.15)'); // Glow Laranja base
            } else {
                drawGlow(540, 400, 800, 'rgba(99, 102, 241, 0.15)');
                drawGlow(100, 1600, 600, 'rgba(236, 72, 153, 0.1)');
            }

            // 3. Header Branding
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 50px sans-serif';
            ctx.fillText('✨ DreamTells ✨', 540, 180);

            ctx.fillStyle = '#94A3B8';
            ctx.font = 'bold 32px sans-serif';
            ctx.letterSpacing = '3px';
            ctx.fillText(data.title.toUpperCase(), 540, 260);
            ctx.letterSpacing = '0px';

            // 4. Card Central (Destaque do Título)
            const cardY = 320; // Subir o card para aproveitar o espaço superior
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
            ctx.lineWidth = 2;

            // @ts-ignore
            if (ctx.roundRect) {
                ctx.beginPath();
                // @ts-ignore
                ctx.roundRect(100, cardY, 880, 180, 40); // Card mais baixo já que não tem o texto do sonho
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.fillRect(100, cardY, 880, 180);
            }

            ctx.fillStyle = data.theme === 'sun' ? '#F6AD55' : '#818CF8';
            ctx.font = '800 32px sans-serif';
            ctx.fillText(data.subtitle.toUpperCase(), 540, cardY + 60);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 70px sans-serif';
            // O mainValue (Título da Interpretação) fica centralizado no card
            ctx.fillText(data.mainValue, 540, cardY + 135);

            // 5. Bloco de Conteúdo (Summary) - Começa mais cedo
            ctx.fillStyle = '#E2E8F0';
            ctx.font = 'italic 46px sans-serif';
            const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
                const words = text.split(' ');
                let line = '';
                let currentY = y;
                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    // Se for ultrapassar o limite inferior do card (badge), para de escrever.
                    if (currentY > 1450) {
                        ctx.fillText(line + '...', x, currentY);
                        return;
                    }
                    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
                        ctx.fillText(line, x, currentY);
                        line = words[n] + ' ';
                        currentY += lineHeight;
                    } else {
                        line = testLine;
                    }
                }
                ctx.fillText(line, x, currentY);
            };

            wrapText(`“${data.summary}”`, 540, 620, 840, 70);

            // 5b. Badge de "Escassez" (Curiosidade)
            if (data.badgeText) {
                const badgeY = 1550;
                ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
                const badgeWidth = ctx.measureText(data.badgeText.toUpperCase()).width + 60;

                // @ts-ignore
                if (ctx.roundRect) {
                    ctx.beginPath();
                    // @ts-ignore
                    ctx.roundRect(540 - badgeWidth / 2, badgeY - 35, badgeWidth, 70, 35);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
                    ctx.stroke();
                }

                ctx.fillStyle = '#A5B4FC';
                ctx.font = 'bold 24px sans-serif';
                ctx.letterSpacing = '1px';
                ctx.fillText(data.badgeText.toUpperCase(), 540, badgeY + 10);
                ctx.letterSpacing = '0px';
            }

            // 6. Rodapé Action
            ctx.fillStyle = data.theme === 'sun' ? '#F6E05E' : '#6366F1';
            ctx.font = 'bold 44px sans-serif';
            ctx.fillText(data.footerText.toUpperCase(), 540, 1680);

            ctx.fillStyle = '#94A3B8';
            ctx.font = '32px sans-serif';
            ctx.fillText('www.dreamtells.com', 540, 1750);

            ctx.fillStyle = '#475569';
            ctx.font = '28px sans-serif';
            ctx.fillText(data.ctaText, 540, 1810);

            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/png');

        } catch (err) {
            console.error('Canvas Generation Error:', err);
            resolve(null);
        }
    });
};
