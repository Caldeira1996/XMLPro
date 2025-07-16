import { sefazApi } from "@/services/sefazApi";

export function configurarCertificado(pfxBuffer: Buffer, password: string) {
  sefazApi.setCertificate({
    pfxBuffer,
    password,
  });
}