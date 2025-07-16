import { Handler } from '@netlify/functions';
import forge from 'node-forge';
import https from 'https';
import axios from 'axios';

interface RequestBody {
  certificateBase64: string;
  password: string;
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

    const { certificateBase64, password } = JSON.parse(event.body) as RequestBody;

    if (!certificateBase64 || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Missing certificate or password' }),
      };
    }

    // Converte base64 para Buffer
    const pfxBuffer = Buffer.from(certificateBase64, 'base64');

    // Valida certificado usando node-forge
    try {
      const pfxDer = pfxBuffer.toString('binary');
      const pfxAsn1 = forge.asn1.fromDer(pfxDer);
      const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, false, password);

      const bags = pfx.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = bags[forge.pki.oids.certBag]?.[0];
      
      if (!certBag?.cert) {
        throw new Error('Certificado não encontrado no PFX');
      }
      
      const cert = certBag.cert;
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: {
            subject: cert.subject.attributes.map(attr => `${attr.shortName}=${attr.value}`).join(', '),
            issuer: cert.issuer.attributes.map(attr => `${attr.shortName}=${attr.value}`).join(', '),
            validFrom: cert.validity.notBefore.toISOString(),
            validTo: cert.validity.notAfter.toISOString(),
            serialNumber: cert.serialNumber
          }
        })
      };
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Certificado inválido ou senha incorreta: ' + (error instanceof Error ? error.message : 'erro desconhecido')
        })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor: ' + (error instanceof Error ? error.message : 'erro desconhecido')
      })
    };
  }
};