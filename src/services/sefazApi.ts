interface SefazApiConfig {
  backendUrl: string;
  timeout: number;
}

interface CertificateConfig {
  pfxBuffer?: Buffer; 
  pfxPath?: string;
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
  private certificate: CertificateConfig | null = null;
  private baseConfig: SefazApiConfig = {
    backendUrl: '/.netlify/functions',
    timeout: 30000
  };

  constructor() {
    // Frontend service - delega tudo para o backend
  }

  public setCertificate(certificate: CertificateConfig): void {
    this.certificate = certificate;
  }

  public async consultarXMLs(request: XmlConsultaRequest): Promise<SefazResponse> {
    try {
      if (!this.certificate) {
        return {
          success: false,
          error: 'Nenhum certificado configurado'
        };
      }

      const response = await fetch(`${this.baseConfig.backendUrl}/consultar-xmls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request,
          certificate: this.certificate
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
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
      if (!this.certificate) {
        return {
          success: false,
          error: 'Nenhum certificado configurado'
        };
      }

      const response = await fetch(`${this.baseConfig.backendUrl}/download-xml`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request,
          certificate: this.certificate
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao baixar XML:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  public async validarCertificado(certificateBase64: string, password: string): Promise<SefazResponse> {
    try {
      const response = await fetch(`${this.baseConfig.backendUrl}/validar-certificado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          certificateBase64,
          password
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao validar certificado:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na validação do certificado'
      };
    }
  }

  public async testarConexao(): Promise<SefazResponse> {
    try {
      if (!this.certificate) {
        return {
          success: false,
          error: 'Nenhum certificado configurado para teste'
        };
      }

      const response = await fetch(`${this.baseConfig.backendUrl}/testar-conexao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          certificate: this.certificate
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: result.success,
        message: result.success 
          ? 'Certificado configurado corretamente e conexão estabelecida com a SEFAZ'
          : 'Falha na conexão com a SEFAZ SP',
        error: result.error
      };
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      return {
        success: false,
        error: 'Erro ao estabelecer conexão com a SEFAZ: ' +
          (error instanceof Error ? error.message : 'erro desconhecido')
      };
    }
  }
}

export const sefazApi = new SefazApiService();
export type { CertificateConfig, XmlConsultaRequest, XmlDownloadRequest, SefazResponse };