import { Handler } from '@netlify/functions';
import https from 'https';

interface RequestBody {
  certFileBase64: string;
  password: string;
  name: string;
}

export const handler: Handler = async (event, context) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ success: false, error: 'Method not allowed' }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'No body found' }),
      };
    }

    const { certFileBase64, password, name } = JSON.parse(event.body) as RequestBody;

    if (!certFileBase64 || !password || !name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Missing cert, password or name' }),
      };
    }

    // Converte o base64 para buffer
    const pfxBuffer = Buffer.from(certFileBase64, 'base64');

    // Cria o https agent com o certificado e senha (exemplo, você pode fazer sua lógica aqui)
    const agent = new https.Agent({
      pfx: pfxBuffer,
      passphrase: password,
      rejectUnauthorized: false, // só para teste, cuidado em produção
    });

    // Aqui você poderia fazer uma requisição usando esse agent para validar o certificado

    // Resposta de sucesso
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: `Certificado ${name} recebido com sucesso!` }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Erro ao processar certificado' }),
    };
  }
};
