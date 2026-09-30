const { createCanvas } = require('@napi-rs/canvas');

exports.handler = async (event) => {
    try {
        const params = event.queryStringParameters || {};
        const text = params.text || '把你想说的话写在这里';
        const tag = params.tag || '日常暖心';

        const W = 750;
        const padding = 60;
        const tagH = 50;
        const lineHeight = 56;
        const fontSize = 32;
        const footerH = 60;

        // 先算文字行数
        const tempCanvas = createCanvas(W, 100);
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        const maxTextWidth = W - padding * 2;

        // 中文换行
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

        const textH = lines.length * lineHeight;
        const H = padding * 2 + tagH + 30 + textH + 40 + footerH;

        const canvas = createCanvas(W, H);
        const ctx = canvas.getContext('2d');

        // 背景
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#FFF9F5');
        grad.addColorStop(1, '#FFEDE4');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // 圆角裁剪
        // (保持矩形背景，卡片本身在网页里是圆角)

        // 装饰引号
        ctx.fillStyle = '#FFC9B5';
        ctx.font = 'bold 100px Georgia, serif';
        ctx.fillText('"', padding - 10, padding + 50);

        // 标签胶囊
        ctx.font = '24px "PingFang SC", sans-serif';
        const tagW = ctx.measureText(tag).width + 40;
        const tagX = padding;
        const tagY = padding + 10;
        const tagGrad = ctx.createLinearGradient(tagX, tagY, tagX + tagW, tagY + tagH);
        tagGrad.addColorStop(0, '#E8927C');
        tagGrad.addColorStop(1, '#D4755F');
        ctx.fillStyle = tagGrad;
        roundRect(ctx, tagX, tagY, tagW, tagH, 25);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'middle';
        ctx.fillText(tag, tagX + 20, tagY + tagH / 2 + 1);

        // 正文
        ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.fillStyle = '#5C4033';
        ctx.textBaseline = 'top';
        let y = tagY + tagH + 30;
        lines.forEach(l => {
            ctx.fillText(l, padding, y);
            y += lineHeight;
        });

        // 底部品牌
        ctx.font = '20px "PingFang SC", sans-serif';
        ctx.fillStyle = '#D4A89A';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('小 家 · 两 人 即 成 小 家', W / 2, H - 30);

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
