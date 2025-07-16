import { Handler } from '@netlify/functions';
import https from 'https';
import { sefazApi } from '../../src/services/sefazApi'; // ajuste o caminho conforme seu projeto

interface RequestBody {
  certFileBase64: string;
  password: string;
  name: string;
}

// Variável global para armazenar o certificado em memória (exemplo simples)
let currentCertificate: { pfxBuffer: Buffer; password: string; name: string } | null = null;

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

    // Converte base64 para Buffer
    const pfxBuffer = Buffer.from(certFileBase64, 'base64');

    // Criar https.Agent só pra testar certificado (opcional)
    const agent = new https.Agent({
      pfx: pfxBuffer,
      passphrase: password,
      rejectUnauthorized: false, // cuidado em produção
    });

    // Aqui você poderia fazer uma requisição teste à SEFAZ usando esse agent pra validar certificado
    // Por enquanto, vamos assumir que está válido se chegou aqui

    // Armazena o certificado na variável global
    currentCertificate = { pfxBuffer, password, name };

    // Ativa o certificado no sefazApi para as próximas requisições
    sefazApi.setCertificate({
      pfxBuffer,
      password,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: `Certificado ${name} recebido e ativado com sucesso!` }),
    };
  } catch (error) {
    console.error('Erro no upload-cert:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Erro ao processar certificado' }),
    };
  }
};
