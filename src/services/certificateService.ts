import { sefazApi } from './sefazApi';

interface CertificateValidationResult {
  success: boolean;
  data?: {
    subject: string;
    issuer: string;
    validFrom: string;
    validTo: string;
    serialNumber: string;
  };
  error?: string;
}

export class CertificateService {
  /**
   * Configura o certificado no serviço da SEFAZ
   */
  public static configurarCertificado(certificateBase64: string, password: string): void {
    // No frontend, só armazenamos a referência
    sefazApi.setCertificate({
      pfxBuffer: Buffer.from(certificateBase64, 'base64'),
      password
    });
  }

  /**
   * Valida um certificado PFX via backend
   */
  public static async validarCertificado(
    certificateBase64: string, 
    password: string
  ): Promise<CertificateValidationResult> {
    try {
      const response = await sefazApi.validarCertificado(certificateBase64, password);
      
      return {
        success: response.success,
        data: response.data,
        error: response.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Converte File para Base64 (utilitário)
   */
  public static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }
}

export default CertificateService;