import { sefazApi } from "@/services/sefazApi";
import forge from 'node-forge';

export function configurarCertificado(pfxBuffer: Buffer, password: string) {
  sefazApi.setCertificate({
    pfxBuffer,
    password,
  });
}

interface CertificadoExtraido {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  serialNumber: string;
}

export function validarCertificadoPfx(pfxBuffer: Buffer, password: string): CertificadoExtraido {
  try {
    const pfxDer = pfxBuffer.toString('binary');
    const pfxAsn1 = forge.asn1.fromDer(pfxDer);
    const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, false, password);

    const bags = pfx.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = bags[forge.pki.oids.certBag]?.[0];

    if (!certBag || !certBag.cert) {
      throw new Error('Certificado não encontrado no PFX');
    }

    const cert = certBag.cert;

    const subject = cert.subject.attributes.map(attr => `${attr.shortName}=${attr.value}`).join(', ');
    const issuer = cert.issuer.attributes.map(attr => `${attr.shortName}=${attr.value}`).join(', ');
    const validFrom = cert.validity.notBefore.toISOString();
    const validTo = cert.validity.notAfter.toISOString();
    const serialNumber = cert.serialNumber;

    return {
      subject,
      issuer,
      validFrom,
      validTo,
      serialNumber
    };
  } catch (error) {
    throw new Error('Falha ao validar certificado: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
}