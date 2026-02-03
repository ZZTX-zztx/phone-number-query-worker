// cloudflare-worker/index.js
export default {
  async fetch(request, env, ctx) {
    // 处理CORS
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    // 处理OPTIONS请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }
    
    // 解析请求URL
    const url = new URL(request.url);
    
    // 处理GET请求 - 获取所有记录
    if (request.method === 'GET') {
      try {
        const records = [];
        let cursor = null;
        
        // 分批获取所有记录
        do {
          try {
            const listResult = await env.KV.list({ cursor });
            for (const key of listResult.keys) {
              try {
                const value = await env.KV.get(key.name);
                if (value) {
                  try {
                    records.push(JSON.parse(value));
                  } catch (e) {
                    console.error('Failed to parse record:', e);
                  }
                }
              } catch (e) {
                console.error('Failed to get record:', e);
              }
            }
            cursor = listResult.cursor;
          } catch (e) {
            console.error('Failed to list records:', e);
            break;
          }
        } while (cursor);
        
        // 按时间戳排序
        records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return new Response(JSON.stringify(records), {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        });
      } catch (e) {
        console.error('GET error:', e);
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    
    // 处理POST请求 - 保存记录
    if (request.method === 'POST') {
      try {
        const record = await request.json();
        const key = Date.now().toString(); // 使用时间戳作为键
        
        await env.KV.put(key, JSON.stringify(record));
        
        return new Response(JSON.stringify({ 
          success: true,
          key: key
        }), {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        });
      } catch (e) {
        console.error('POST error:', e);
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    
    // 默认响应
    return new Response(JSON.stringify({
      message: 'Phone Backup Worker',
      endpoints: {
        get: 'GET / - Get all records',
        post: 'POST / - Save a record'
      }
    }), {
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    });
  }
}