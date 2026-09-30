const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');

GlobalFonts.registerFromPath(path.join(__dirname, 'NotoSansSC.otf'), 'NotoSansSC');

exports.handler = async (event) => {
    try {
        const params = event.queryStringParameters || {};
        const text = params.text || '把你想说的话写在这里';
        const tag = params.tag || '日常暖心';

        const W = 750;
        const H = 1000;
        const padding = 70;
        const tagH = 52;
        const lineHeight = 58;
        const fontSize = 34;
        const fontFamily = 'NotoSansSC';

        // 算文字行数
        const tempCanvas = createCanvas(W, 100);
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.font = `${fontSize}px "${fontFamily}", sans-serif`;
        const maxTextWidth = W - padding * 2;

        const lines = [];
        let line = '';
        for (let i = 0; i < text.length; i++) {
            const test = line + text[i];
            if (tempCtx.measureText(test).width > maxTextWidth) {
                lines.push(line);
                line = text[i];
            } else {
                line = test;
            }
        }
        if (line) lines.push(line);

        const canvas = createCanvas(W, H);
        const ctx = canvas.getContext('2d');

        // 背景渐变
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#FFF9F5');
        grad.addColorStop(1, '#FFE8DE');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // 装饰引号（左上大）
        ctx.fillStyle = '#FFD4C4';
        ctx.font = `bold 120px Georgia, serif`;
        ctx.fillText('"', padding - 15, padding + 80);

        // 标签胶囊
        ctx.font = `24px "${fontFamily}", sans-serif`;
        const tagW = ctx.measureText(tag).width + 44;
        const tagX = padding;
        const tagY = padding + 30;
        const tagGrad = ctx.createLinearGradient(tagX, tagY, tagX + tagW, tagY + tagH);
        tagGrad.addColorStop(0, '#E8927C');
        tagGrad.addColorStop(1, '#D4755F');
        ctx.fillStyle = tagGrad;
        roundRect(ctx, tagX, tagY, tagW, tagH, 26);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'middle';
        ctx.fillText(tag, tagX + 22, tagY + tagH / 2 + 1);

        // 正文 - 从标签下方开始
        ctx.font = `${fontSize}px "${fontFamily}", sans-serif`;
        ctx.fillStyle = '#5C4033';
        ctx.textBaseline = 'top';
        let y = tagY + tagH + 50;
        lines.forEach(l => {
            ctx.fillText(l, padding, y);
            y += lineHeight;
        });

        // 底部品牌
        ctx.font = `22px "${fontFamily}", sans-serif`;
        ctx.fillStyle = '#D4A89A';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('小 家 · 两 人 即 成 小 家', W / 2, H - 60);

        // 底部装饰小爱心
        ctx.font = '28px serif';
        ctx.fillStyle = '#E8B4A0';
        ctx.textAlign = 'center';
        ctx.fillText('♥', W / 2, H - 30);

        const buffer = canvas.toBuffer('image/png');

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'no-cache'
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: String(error) })
        };
    }
};

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
