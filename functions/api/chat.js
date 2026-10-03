// Cloudflare Pages Functions：/api/chat
// 小家话术转译后端：调用火山引擎方舟 doubao-seed 语言模型
// 环境变量：DOUBAO_API_KEY（在 Cloudflare Pages 项目设置中配置）
export async function onRequestPost(context) {
    const { request, env } = context;
    const cors = {
        'Content-Type': 'application/json; charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    let scene, content;
    try {
        const payload = await request.json();
        scene = payload.scene;
        content = payload.content;
    } catch (error) {
        return new Response(JSON.stringify({ error: '请求解析失败', detail: 'REQ_JSON_FAIL ' + String(error).slice(0, 120) }), { status: 400, headers: cors });
    }

    if (!content) {
        return new Response(JSON.stringify({ error: '内容为空' }), { status: 400, headers: cors });
    }

    const prompts = {
        peace: '你是亲密关系沟通助手，专门帮助情侣/夫妻把带情绪的狠话、气话，转化为温和、真诚、愿意沟通的和解话术。要求：口语化，像日常说话，不要书面；不指责对方，先讲自己的感受和在意；态度柔软但不卑微；简短自然，100字以内；只输出话术本身，不要多余解释。',
        soft: '你是亲密关系沟通助手，帮助用户把难以开口的需求、不满、拒绝，转化为委婉、不伤感情的表达。要求：语气柔和，先共情再讲想法；不生硬、不抱怨；口语化，自然真实；100字以内；只输出话术本身。',
        warm: '你是亲密关系沟通助手，生成日常里温暖、走心的关心话、小情话，不油腻、不刻意。要求：生活化，像随口说的话，不要土味情话；真诚有温度；简短自然；只输出话术本身。',
        sorry: '你是亲密关系沟通助手，帮助用户把道歉的话说得真诚、有担当，不敷衍、不卑微。要求：先承认错误，再讲反思；态度诚恳，不找借口；口语化，不生硬；100字以内；只输出话术本身。'
    };

    const sysPrompt = prompts[scene] || prompts.peace;

    let resp;
    try {
        resp = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (env.DOUBAO_API_KEY || '')
            },
            body: JSON.stringify({
                model: 'doubao-seed-2-0-mini-260428',
                messages: [
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: content }
                ],
                temperature: 0.7,
                max_tokens: 240
            })
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: '上游调用失败', detail: 'FETCH_FAIL ' + String(error).slice(0, 160) }), { status: 502, headers: cors });
    }

    if (!resp.ok) {
        const bodyText = await resp.text().catch(() => '');
        return new Response(JSON.stringify({ error: '上游返回异常', detail: 'UPSTREAM_HTTP ' + resp.status + ' ' + bodyText.slice(0, 200) }), { status: 502, headers: cors });
    }

    let data;
    try {
        data = await resp.json();
    } catch (error) {
        const bodyText = await resp.text().catch(() => '');
        return new Response(JSON.stringify({ error: '上游响应解析失败', detail: 'RESP_JSON_FAIL ' + String(error).slice(0, 120) + ' BODY:' + bodyText.slice(0, 200) }), { status: 502, headers: cors });
    }

    const result = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim();

    if (!result) {
        return new Response(JSON.stringify({ error: '生成结果为空', detail: 'EMPTY_RESULT' }), { status: 502, headers: cors });
    }

    return new Response(JSON.stringify({ result }), { status: 200, headers: cors });
}

export async function onRequestOptions() {
    return new Response('OK', {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
