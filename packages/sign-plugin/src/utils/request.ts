import https, { RequestOptions } from 'https';
import { ProxyAgent } from 'proxy-agent';

import { URL } from 'url';

interface Headers {
  Authorization: string;
  [header: string]: string;
}

interface Response<R> {
  data: R;
  status: number;
}

const agent = new ProxyAgent();

export async function postData(urlString: string, data: unknown, headers: Headers): Promise<Response<string>> {
  return new Promise<Response<string>>((resolve, reject) => {
    const url = new URL(urlString);
    const postData = JSON.stringify(data);

    const options: RequestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      agent,
    };

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk: Buffer) => chunks.push(chunk));

      res.on('end', () => {
        const results = Buffer.concat(chunks);
        resolve({
          data: results.toString(),
          status: res.statusCode ?? 200,
        });
      });

      res.on('error', reject);
    });

    req.on('error', reject);

    req.write(postData);
    req.end();
  });
}
