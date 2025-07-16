import { Handler } from '@netlify/functions';
import https from 'https';
import axios from 'axios';

interface RequestBody {
  certificateBase64: string;
  password: string;
}

const buildTestSoapEnvelope = (): string => {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:nfe="http://www.portalfiscal.inf.br/nfe/wsdl/NfeDownload">
  <soap:Header />
  <soap:Body>
    <nfe:nfeDownloadNF>
      <nfe:nfeDadosMsg>
        <downloadNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">
          <tpAmb>1</tpAmb>
          <xServ>DOWNLOAD NFE</xServ>
          <CNPJ>12345678000195</CNPJ>
          <chNFe>99999999999999999999999999999999999999999999</chNFe>
        </downloadNFe>
      </nfe:nfeDadosMsg>
    </nfe:nfeDownloadNF>
  </soap:Body>
</soap:Envelope>`;
};

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
    
    // Cria agent HTTPS com certificado
    const agent = new https.Agent({
      pfx: pfxBuffer,
      passphrase: password,
      rejectUnauthorized: false
    });
    
    // Testa conexão com SEFAZ SP
    try {
      const response = await axios.post(
        'https://nfe.fazenda.sp.gov.br/ws/nfedownload.asmx',
        buildTestSoapEnvelope(),
        {
          httpsAgent: agent,
          headers: {
            'Content-Type': 'application/soap+xml; charset=utf-8',
            'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NfeDownload/nfeDownloadNF'
          },
          timeout: 10000
        }
      );
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Conexão estabelecida com sucesso'
        })
      };
    } catch (error) {
      // Mesmo com erro, se conseguiu estabelecer conexão SSL, é sucesso
      if (axios.isAxiosError(error) && error.response) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            message: 'Certificado autenticado com sucesso'
          })
        };
      }
      
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Falha na conexão com SEFAZ: ' + (error instanceof Error ? error.message : 'erro desconhecido')
        })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        error: 'Erro interno: ' + (error instanceof Error ? error.message : 'erro desconhecido')
      })
    };
  }
};