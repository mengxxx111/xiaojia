exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { scene, content } = JSON.parse(event.body);

        const prompts = {
            peace: '你是亲密关系沟通助手，专门帮助情侣/夫妻把带情绪的狠话、气话，转化为温和、真诚、愿意沟通的和解话术。要求：口语化，像日常说话，不要书面；不指责对方，先讲自己的感受和在意；态度柔软但不卑微；简短自然，100字以内；只输出话术本身，不要多余解释。',
            soft: '你是亲密关系沟通助手，帮助用户把难以开口的需求、不满、拒绝，转化为委婉、不伤感情的表达。要求：语气柔和，先共情再讲想法；不生硬、不抱怨；口语化，自然真实；100字以内；只输出话术本身。',
            warm: '你是亲密关系沟通助手，生成日常里温暖、走心的关心话、小情话，不油腻、不刻意。要求：生活化，像随口说的话，不要土味情话；真诚有温度；简短自然；只输出话术本身。',
            sorry: '你是亲密关系沟通助手，帮助用户把道歉的话说得真诚、有担当，不敷衍、不卑微。要求：先承认错误，再讲反思；态度诚恳，不找借口；口语化，不生硬；100字以内；只输出话术本身。'
        };

        const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DOUBAO_API_KEY}`
            },
            body: JSON.stringify({
                model: 'doubao-seed-2-0-mini-260428',
                messages: [
                    { role: 'system', content: prompts[scene] },
                    { role: 'user', content: content }
                ],
                temperature: 0.7,
                max_tokens: 200
            })
        });

        const data = await response.json();

        // 关键：把火山引擎的具体错误返回出来
        if (!response.ok) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: '火山API错误', status: response.status, detail: JSON.stringify(data) })
            };
        }

        const result = data.choices[0].message.content.trim();

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ result })
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: '函数异常', detail: String(error) })
        };
    }
};
