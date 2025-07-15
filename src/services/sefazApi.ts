import axios, { AxiosInstance } from 'axios';
import { parseString } from 'xml2js';

interface SefazApiConfig {
  baseURL: string;
  timeout: number;
}

interface CertificateConfig {
  pfxPath: string;
  password: string;
  alias?: string;
}

interface XmlConsultaRequest {
  cnpj: string;
  dataInicial: string;
  dataFinal: string;
  modelo?: string;
  serie?: string;
  numeroInicial?: string;
  numeroFinal?: string;
}

interface XmlDownloadRequest {
  chaveAcesso: string;
}

interface SefazResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

class SefazApiService {
  private api: AxiosInstance;
  private certificate: CertificateConfig | null = null;
  private baseConfig: SefazApiConfig = {
    baseURL: 'https://nfe.fazenda.sp.gov.br/ws/nfedownload.asmx',
    timeout: 30000
  };

  constructor() {
    this.api = axios.create({
      baseURL: this.baseConfig.baseURL,
      timeout: this.baseConfig.timeout,
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
        'SOAPAction': ''
      }
    });

    // Interceptador para adicionar certificado nas requisições
    this.api.interceptors.request.use((config) => {
      if (this.certificate) {
        // Em um ambiente real, você configuraria o certificado aqui
        // config.httpsAgent = new https.Agent({ ... });
      }
      return config;
    });
  }

  public setCertificate(certificate: CertificateConfig): void {
    this.certificate = certificate;
  }

  public async consultarXMLs(request: XmlConsultaRequest): Promise<SefazResponse> {
    try {
      const soapEnvelope = this.buildConsultaSoapEnvelope(request);
      
      const response = await this.api.post('', soapEnvelope, {
        headers: {
          'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NfeDownload/nfeDownloadNF'
        }
      });

      return this.parseConsultaResponse(response.data);
    } catch (error) {
      console.error('Erro ao consultar XMLs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  public async downloadXML(request: XmlDownloadRequest): Promise<SefazResponse> {
    try {
      const soapEnvelope = this.buildDownloadSoapEnvelope(request);
      
      const response = await this.api.post('', soapEnvelope, {
        headers: {
          'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NfeDownload/nfeDownloadNF'
        }
      });

      return this.parseDownloadResponse(response.data);
    } catch (error) {
      console.error('Erro ao baixar XML:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  public async validarCertificado(certificatePath: string, password: string): Promise<SefazResponse> {
    try {
      // Simula validação do certificado
      // Em um ambiente real, isso seria feito com uma biblioteca de criptografia
      const mockValidation = {
        valid: true,
        subject: 'CN=EMPRESA TESTE:12345678000195, OU=Certificado PJ A1, O=ICP-Brasil, C=BR',
        issuer: 'AC CERTISIGN RFB G5',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2025-12-31'),
        serialNumber: '123456789'
      };

      return {
        success: true,
        data: mockValidation
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na validação do certificado'
      };
    }
  }

  private buildConsultaSoapEnvelope(request: XmlConsultaRequest): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:nfe="http://www.portalfiscal.inf.br/nfe/wsdl/NfeDownload">
  <soap:Header />
  <soap:Body>
    <nfe:nfeDistDFeInteresse>
      <nfe:nfeDadosMsg>
        <distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
          <tpAmb>1</tpAmb>
          <cUFAutor>35</cUFAutor>
          <CNPJ>${request.cnpj}</CNPJ>
          <distNSU>
            <ultNSU>000000000000000</ultNSU>
          </distNSU>
        </distDFeInt>
      </nfe:nfeDadosMsg>
    </nfe:nfeDistDFeInteresse>
  </soap:Body>
</soap:Envelope>`;
  }

  private buildDownloadSoapEnvelope(request: XmlDownloadRequest): string {
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
          <chNFe>${request.chaveAcesso}</chNFe>
        </downloadNFe>
      </nfe:nfeDadosMsg>
    </nfe:nfeDownloadNF>
  </soap:Body>
</soap:Envelope>`;
  }

  private parseConsultaResponse(xmlResponse: string): Promise<SefazResponse> {
    return new Promise((resolve) => {
      parseString(xmlResponse, (err, result) => {
        if (err) {
          resolve({
            success: false,
            error: 'Erro ao interpretar resposta da SEFaz'
          });
          return;
        }

        // Processa a resposta SOAP
        try {
          const soapBody = result['soap:Envelope']['soap:Body'][0];
          const nfeResponse = soapBody['nfe:nfeDistDFeInteresseResponse'][0];
          
          if (nfeResponse && nfeResponse['nfe:nfeDistDFeInteresseResult']) {
            resolve({
              success: true,
              data: nfeResponse['nfe:nfeDistDFeInteresseResult'][0]
            });
          } else {
            resolve({
              success: false,
              error: 'Resposta inválida da SEFaz'
            });
          }
        } catch (parseError) {
          resolve({
            success: false,
            error: 'Erro ao processar resposta da SEFaz'
          });
        }
      });
    });
  }

  private parseDownloadResponse(xmlResponse: string): Promise<SefazResponse> {
    return new Promise((resolve) => {
      parseString(xmlResponse, (err, result) => {
        if (err) {
          resolve({
            success: false,
            error: 'Erro ao interpretar resposta da SEFaz'
          });
          return;
        }

        try {
          const soapBody = result['soap:Envelope']['soap:Body'][0];
          const downloadResponse = soapBody['nfe:nfeDownloadNFResponse'][0];
          
          if (downloadResponse && downloadResponse['nfe:nfeDownloadNFResult']) {
            resolve({
              success: true,
              data: downloadResponse['nfe:nfeDownloadNFResult'][0]
            });
          } else {
            resolve({
              success: false,
              error: 'Resposta inválida da SEFaz'
            });
          }
        } catch (parseError) {
          resolve({
            success: false,
            error: 'Erro ao processar resposta da SEFaz'
          });
        }
      });
    });
  }

  public async testarConexao(): Promise<SefazResponse> {
    try {
      // Testa a conexão com a SEFaz
      const response = await this.api.get('/ping', { timeout: 5000 });
      
      return {
        success: true,
        message: 'Conexão estabelecida com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Falha na conexão com a SEFaz SP'
      };
    }
  }
}

export const sefazApi = new SefazApiService();
export type { CertificateConfig, XmlConsultaRequest, XmlDownloadRequest, SefazResponse };