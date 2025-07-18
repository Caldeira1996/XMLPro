import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Upload, 
  Shield, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  Clock,
  FileKey
} from 'lucide-react';
import { sefazApi } from '@/services/sefazApi';

interface Certificate {
  id: string;
  name: string;
  issuer: string;
  validUntil: string;
  validFrom: string;
  status: 'valid' | 'expired' | 'warning';
  subject: string;
  serialNumber: string;
  filePath?: string;
}

interface CertificateManagerProps {
  certificates: Certificate[];
  onCertificateAdd: (certificate: Certificate) => Promise<void>;
  onCertificateRemove: (id: string) => void;
  onCertificateSelect: (id: string) => void;
  selectedCertificate: string;
}

export function CertificateManager({ 
  certificates, 
  onCertificateAdd, 
  onCertificateRemove, 
  onCertificateSelect, 
  selectedCertificate 
}: CertificateManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [newCertificate, setNewCertificate] = useState({
    name: '',
    filePath: '',
    password: ''
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileObject(file);
      setNewCertificate({
        ...newCertificate,
        filePath: file.name,
        name: newCertificate.name || file.name.replace('.pfx', '').replace('.p12', '')
      });
    }
  };

  // Converte arquivo para base64 (sem o prefixo data:...)
  const fileToBase64 = (file: File): Promise<string> => {
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
  };

  const validateAndAddCertificate = async () => {
    if (!newCertificate.name || !fileObject || !newCertificate.password) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);

    try {
      const certBase64 = await fileToBase64(fileObject);
      const validation = await sefazApi.validarCertificado(certBase64, newCertificate.password);
      
      if (validation.success && validation.data) {
        const certData = validation.data;
        const now = new Date();
        const validUntil = new Date(certData.validTo);
        const daysUntilExpiry = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        let status: 'valid' | 'expired' | 'warning' = 'valid';
        if (validUntil < now) {
          status = 'expired';
        } else if (daysUntilExpiry <= 30) {
          status = 'warning';
        }

        // Testa conexão com SEFAZ
        const connectionResult = await sefazApi.testarConexao();

        const certificate: Certificate = {
          id: Date.now().toString(),
          name: newCertificate.name,
          issuer: certData.issuer,
          validUntil: validUntil.toLocaleDateString('pt-BR'),
          validFrom: new Date(certData.validFrom).toLocaleDateString('pt-BR'),
          status: connectionResult.success ? status : 'expired',
          subject: certData.subject,
          serialNumber: certData.serialNumber,
          filePath: newCertificate.filePath
        };

        // Configura o certificado no sefazApi
        sefazApi.setCertificate({
          pfxBuffer: Buffer.from(certBase64, 'base64'),
          password: newCertificate.password
        });

        onCertificateAdd(certificate);
        setNewCertificate({ name: '', filePath: '', password: '' });
        setFileObject(null);
        setIsDialogOpen(false);
        
        toast({
          title: connectionResult.success ? "Certificado adicionado" : "Certificado adicionado com aviso",
          description: connectionResult.success 
            ? `Certificado ${certificate.name} validado e conectado à SEFAZ`
            : `Certificado ${certificate.name} válido, mas houve problema na conexão com SEFAZ`,
          variant: connectionResult.success ? 'default' : 'destructive'
        });
      } else {
        toast({
          title: "Erro na validação",
          description: validation.error || "Não foi possível validar o certificado.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao validar o certificado: " + (error instanceof Error ? error.message : 'erro desconhecido'),
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCertificate = (id: string) => {
    onCertificateRemove(id);
    toast({
      title: "Certificado removido",
      description: "O certificado foi removido com sucesso.",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'expired':
        return <Clock className="w-4 h-4 text-destructive" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge variant="secondary" className="bg-success text-success-foreground">Válido</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Expira em breve</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Certificados Digitais</CardTitle>
              <CardDescription>
                Gerencie seus certificados digitais para autenticação com a SEFaz
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Certificado
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Certificado Digital</DialogTitle>
                  <DialogDescription>
                    Selecione um arquivo de certificado (.pfx ou .p12) e forneça a senha
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cert-name">Nome do Certificado</Label>
                    <Input
                      id="cert-name"
                      value={newCertificate.name}
                      onChange={(e) => setNewCertificate({...newCertificate, name: e.target.value})}
                      placeholder="Ex: Certificado da Empresa XYZ"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cert-file">Arquivo do Certificado</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="cert-file"
                        type="file"
                        accept=".pfx,.p12"
                        onChange={handleFileUpload}
                        className="file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                      />
                      <Upload className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {newCertificate.filePath && (
                      <p className="text-sm text-muted-foreground">
                        Arquivo selecionado: {newCertificate.filePath}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cert-password">Senha do Certificado</Label>
                    <Input
                      id="cert-password"
                      type="password"
                      value={newCertificate.password}
                      onChange={(e) => setNewCertificate({...newCertificate, password: e.target.value})}
                      placeholder="Digite a senha do certificado"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={validateAndAddCertificate} disabled={isValidating}>
                    {isValidating ? 'Validando...' : 'Adicionar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="text-center py-8">
              <FileKey className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum certificado encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Adicione um certificado digital para começar a usar a integração com a SEFaz
              </p>
              <Button onClick={() => setIsDialogOpen(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Certificado
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {certificates.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(cert.status)}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium">{cert.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Emissor: {cert.issuer}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Válido de {cert.validFrom} até {cert.validUntil}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Série: {cert.serialNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(cert.status)}
                    <Button
                      onClick={() => onCertificateSelect(cert.id)}
                      variant={selectedCertificate === cert.id ? 'default' : 'outline'}
                      size="sm"
                    >
                      {selectedCertificate === cert.id ? 'Selecionado' : 'Selecionar'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza de que deseja remover o certificado "{cert.name}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemoveCertificate(cert.id)}>
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}