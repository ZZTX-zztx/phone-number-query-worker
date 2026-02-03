export default {
  async fetch(request, env, ctx) {
    // 解析请求URL
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 处理API请求
    if (path === '/api/queries') {
      if (request.method === 'GET') {
        // 获取所有查询记录
        try {
          const allKeys = await env.KV.list();
          const queries = [];
          
          for (const key of allKeys.keys) {
            const value = await env.KV.get(key.name);
            if (value) {
              try {
                queries.push(JSON.parse(value));
              } catch (e) {
                console.error('Failed to parse query:', e);
              }
            }
          }
          
          // 按时间戳降序排序
          queries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          
          return new Response(
            JSON.stringify(queries),
            {
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
              }
            }
          );
        } catch (e) {
          console.error('Failed to get queries:', e);
          return new Response(
            JSON.stringify({ success: false, message: '获取查询记录失败' }),
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
              }
            }
          );
        }
      } else if (request.method === 'POST') {
        // 保存新的查询记录
        try {
          const record = await request.json();
          
          // 获取当前KV中的总项数
          const allKeys = await env.KV.list();
          const totalCount = allKeys.keys.length;
          
          // 使用总项数+1作为新的KEY
          const key = (totalCount + 1).toString();
          
          // 保存到KV
          await env.KV.put(key, JSON.stringify(record));
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: '查询记录已保存',
              key: key
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
              }
            }
          );
        } catch (e) {
          console.error('Failed to save query:', e);
          return new Response(
            JSON.stringify({ success: false, message: '保存查询记录失败' }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
              }
            }
          );
        }
      } else if (request.method === 'OPTIONS') {
        // 处理CORS预检请求
        return new Response(
          null,
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type'
            }
          }
        );
      }
    }
    
    // 根路径返回欢迎信息
    return new Response(
      JSON.stringify({
        message: 'Cloudflare Worker for Phone Number Query',
        endpoints: {
          GET: '/api/queries - Get all query records',
          POST: '/api/queries - Save a new query record'
        }
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}