exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { scene, content, gender, tone, length } = JSON.parse(event.body);

        // 场景 prompt（增强版：口语化、简短、只输出话术）
        const scenePrompts = {
            peace: '你是亲密关系沟通助手，专门帮助情侣/夫妻把带情绪的狠话、气话，转化为温和、真诚、愿意沟通的和解话术。要求：口语化，像日常发微信；不指责对方，先讲自己的感受和在意；态度柔软但不卑微；简短自然。',
            soft: '你是亲密关系沟通助手，帮助用户把难以开口的需求、不满、拒绝，转化为委婉、不伤感情的表达。要求：语气柔和，先共情再讲想法；不生硬、不抱怨；口语化，自然真实。',
            warm: '你是亲密关系沟通助手，生成日常里温暖、走心的关心话、小情话，不油腻、不刻意。要求：生活化，像随口说的话，不要土味情话；真诚有温度；简短自然。',
            sorry: '你是亲密关系沟通助手，帮助用户把道歉的话说得真诚、有担当，不敷衍、不卑微。要求：先承认错误，再讲反思；态度诚恳，不找借口；口语化，不生硬。'
        };

        // 性别
        const genderText = gender === 'male'
            ? '你以男生口吻说话，自然不油腻。'
            : '你以女生口吻说话，温柔不做作。';

        // 语气档位
        const toneLabels = {
            male: ['非常克制理性，字斟句酌', '沉稳温和，不紧不慢', '温柔体贴，善解人意', '带点幽默感，轻松自然', '活泼俏皮，会撒娇卖萌'],
            female: ['非常克制理性，字斟句酌', '温柔舒缓，轻声细语', '体贴入微，充满关怀', '俏皮可爱，带点小调皮', '撒娇黏人，甜度拉满']
        };
        const toneIdx = (tone || 3) - 1;
        const toneText = `语气要求：${toneLabels[gender || 'female'][toneIdx]}。`;

        // 长短档位
        const lengthLabels = [
            '控制在20字以内，一句话说完',
            '30-50字，两三句话',
            '80-120字，自然一段',
            '150-200字，小段落，有细节',
            '300字以上，像一封小情书，有场景有画面有情感'
        ];
        const lenIdx = (length || 2) - 1;
        const lengthText = `篇幅要求：${lengthLabels[lenIdx]}。`;

        const systemPrompt = scenePrompts[scene] + genderText + toneText + lengthText + '要求口语化，像日常发微信；只输出话术本身，不要任何解释、前缀或引号。';

        const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DOUBAO_API_KEY}`
            },
            body: JSON.stringify({
                model: 'doubao-seed-2-0-mini-260428',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: content }
                ],
                temperature: 0.8,
                max_tokens: 600
            })
        });

        const data = await response.json();

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
