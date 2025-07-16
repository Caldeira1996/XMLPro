import { Handler } from '@netlify/functions';
import https from 'https';
import { sefazApi } from '../../src/services/sefazApi'; // ajuste o caminho conforme seu projeto
import forge from 'node-forge';
import { configurarCertificado } from '../../src/utils/certificadoConfig';

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

    // Opcional: criar https.Agent para testar certificado
    const agent = new https.Agent({
      pfx: pfxBuffer,
      passphrase: password,
      rejectUnauthorized: false, // cuidado em produção
    });

    // Extrai dados do certificado usando node-forge
    let issuer = '';
    let subject = '';
    let serialNumber = '';
    let validFrom = '';
    let validUntil = '';

    try {
      // Converte Buffer para string binária para forge
      const pfxDer = pfxBuffer.toString('binary');
      const pfxAsn1 = forge.asn1.fromDer(pfxDer);
      const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, false, password);

      // Pega o primeiro certificado (certBag)
      const bags = pfx.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = bags[forge.pki.oids.certBag]?.[0];
      if (!certBag) throw new Error('Certificado não encontrado no arquivo PFX');

      const cert = certBag.cert;

      // Monta strings legíveis para issuer e subject
      issuer = cert.issuer.attributes.map(attr => `${attr.shortName}=${attr.value}`).join(', ');
      subject = cert.subject.attributes.map(attr => `${attr.shortName}=${attr.value}`).join(', ');
      serialNumber = cert.serialNumber;
      validFrom = cert.validity.notBefore.toISOString().split('T')[0];
      validUntil = cert.validity.notAfter.toISOString().split('T')[0];
    } catch (err) {
      console.error('Erro ao extrair dados do certificado:', err);
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Certificado inválido ou senha incorreta' }),
      };
    }

    // Armazena o certificado na variável global
    currentCertificate = { pfxBuffer, password, name };

    // Ativa o certificado no sefazApi para as próximas requisições
    // sefazApi.setCertificate({
    //   pfxBuffer,
    //   password,
    // });

    configurarCertificado(pfxBuffer, password)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Certificado ${name} recebido e ativado com sucesso!`,
        data: {
          issuer,
          subject,
          serialNumber,
          validFrom,
          validUntil,
        },
      }),
    };
  } catch (error) {
    console.error('Erro no upload-cert:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Erro ao processar certificado' }),
    };
  }
};
