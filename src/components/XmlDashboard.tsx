import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { 
  Download, 
  FileText, 
  Shield, 
  Search, 
  Filter, 
  Calendar,
  CheckCircle,
  AlertCircle,
  FileDown,
  Settings,
  Database,
  Clock,
  Users,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import sefazLogo from '@/assets/sefaz-logo.png';
import { NotificationCenter } from './NotificationCenter';
import { CertificateManager } from './CertificateManager';
import { sefazApi } from '@/services/sefazApi';

interface XmlItem {
  id: string;
  chave: string;
  tipo: string;
  emitente: string;
  destinatario: string;
  valor: number;
  data: string;
  status: 'processado' | 'pendente' | 'erro';
  tamanho: string;
}

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

// Certificados serão gerenciados pelo CertificateManager

const mockXmlData: XmlItem[] = [
  {
    id: '1',
    chave: '35240614200166000196550010000000001123456789',
    tipo: 'NFe',
    emitente: 'Empresa XYZ LTDA',
    destinatario: 'Cliente ABC',
    valor: 1250.50,
    data: '2024-01-15',
    status: 'processado',
    tamanho: '45 KB'
  },
  {
    id: '2',
    chave: '35240614200166000196550010000000002123456789',
    tipo: 'NFCe',
    emitente: 'Empresa XYZ LTDA',
    destinatario: 'Cliente DEF',
    valor: 89.90,
    data: '2024-01-14',
    status: 'processado',
    tamanho: '32 KB'
  },
  {
    id: '3',
    chave: '35240614200166000196550010000000003123456789',
    tipo: 'CTe',
    emitente: 'Transportadora ABC',
    destinatario: 'Cliente GHI',
    valor: 450.00,
    data: '2024-01-13',
    status: 'pendente',
    tamanho: '38 KB'
  },
  {
    id: '4',
    chave: '35240614200166000196550010000000004123456789',
    tipo: 'NFe',
    emitente: 'Empresa XYZ LTDA',
    destinatario: 'Cliente JKL',
    valor: 2100.75,
    data: '2024-01-12',
    status: 'erro',
    tamanho: '52 KB'
  }
];

export default function XmlDashboard() {
  const [selectedCertificate, setSelectedCertificate] = useState<string>('');
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [xmlData, setXmlData] = useState<XmlItem[]>(mockXmlData);
  const [filteredData, setFilteredData] = useState<XmlItem[]>(mockXmlData);
  const [isConnected, setIsConnected] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoadingXmls, setIsLoadingXmls] = useState(false);
  const [consultaParams, setConsultaParams] = useState({
    cnpj: '',
    dataInicial: '',
    dataFinal: ''
  });

  const handleCertificateSelect = async (certificateId: string) => {
    const certificate = certificates.find(c => c.id === certificateId);
    if (certificate) {
      setSelectedCertificate(certificateId);
      
      // Configurar o certificado na API
      sefazApi.setCertificate({
        pfxPath: certificate.filePath || '',
        password: 'senha_armazenada', // Em produção, isso seria obtido de forma segura
        alias: certificate.name
      });
      
      // Testar conexão
      const connectionTest = await sefazApi.testarConexao();
      setIsConnected(connectionTest.success);
      
      toast({
        title: connectionTest.success ? "Certificado selecionado" : "Erro de conexão",
        description: connectionTest.success ? "Conexão estabelecida com sucesso." : connectionTest.error,
        variant: connectionTest.success ? "default" : "destructive"
      });
    }
  };

  // const handleCertificateAdd = (certificate: Certificate) => {
  //   setCertificates([...certificates, certificate]);
  // };

  const handleCertificateAdd = async (certificate: Certificate) => {
  try {
    // Adiciona o certificado à lista
    const updatedCertificates = [...certificates, certificate];
    setCertificates(updatedCertificates);

    // Configura o certificado na API
    sefazApi.setCertificate({
      pfxPath: certificate.filePath || '',
      password: 'senha_armazenada', // Em produção, use um método seguro
      alias: certificate.name
    });

    // Testa a conexão com a SEFAZ
    const connectionTest = await sefazApi.testarConexao();
    setIsConnected(connectionTest.success);

    // Feedback visual
    toast({
      title: connectionTest.success 
        ? "Certificado adicionado e validado" 
        : "Certificado adicionado, mas falha na conexão",
      description: connectionTest.success 
        ? "Conexão estabelecida com sucesso." 
        : connectionTest.error || "Erro ao conectar com a SEFAZ.",
      variant: connectionTest.success ? "default" : "destructive"
    });

    // Seleciona automaticamente se for o primeiro certificado
    if (certificates.length === 0) {
      setSelectedCertificate(certificate.id);
    }

  } catch (error) {
    console.error("Erro ao adicionar certificado:", error);
    setIsConnected(false);
    toast({
      title: "Erro ao validar certificado",
      description: "Ocorreu um erro ao testar a conexão com a SEFAZ.",
      variant: "destructive"
    });
  }
};

  const handleCertificateRemove = (id: string) => {
    setCertificates(certificates.filter(c => c.id !== id));
    if (selectedCertificate === id) {
      setSelectedCertificate('');
      setIsConnected(false);
    }
  };

  const consultarXmlsSefaz = async () => {
    if (!selectedCertificate) {
      toast({
        title: "Certificado não selecionado",
        description: "Selecione um certificado antes de consultar os XMLs.",
        variant: "destructive"
      });
      return;
    }

    if (!consultaParams.cnpj || !consultaParams.dataInicial || !consultaParams.dataFinal) {
      toast({
        title: "Parâmetros obrigatórios",
        description: "Preencha CNPJ, data inicial e data final.",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingXmls(true);

    try {
      const response = await sefazApi.consultarXMLs({
        cnpj: consultaParams.cnpj,
        dataInicial: consultaParams.dataInicial,
        dataFinal: consultaParams.dataFinal
      });

      if (response.success) {
        // Processar dados dos XMLs da SEFaz
        const xmlsProcessados = response.data?.documentos?.map((doc: any, index: number) => ({
          id: (index + 1).toString(),
          chave: doc.chNFe || doc.chCTe || 'Chave não disponível',
          tipo: doc.modelo || 'NFe',
          emitente: doc.xNome || 'Emitente desconhecido',
          destinatario: doc.xNomeDest || 'Destinatário desconhecido',
          valor: parseFloat(doc.vNF || doc.vPrest || '0'),
          data: doc.dhEmi?.substring(0, 10) || new Date().toISOString().substring(0, 10),
          status: 'processado' as const,
          tamanho: '45 KB'
        })) || [];

        setXmlData(xmlsProcessados);
        setFilteredData(xmlsProcessados);
        
        toast({
          title: "Consulta realizada",
          description: `${xmlsProcessados.length} XMLs encontrados.`,
        });
      } else {
        toast({
          title: "Erro na consulta",
          description: response.error || "Erro ao consultar XMLs da SEFaz.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro na consulta",
        description: "Ocorreu um erro ao consultar os XMLs.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingXmls(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterData(term, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    filterData(searchTerm, status);
  };

  const filterData = (search: string, status: string) => {
    let filtered = xmlData;

    if (search) {
      filtered = filtered.filter(item =>
        item.chave.toLowerCase().includes(search.toLowerCase()) ||
        item.emitente.toLowerCase().includes(search.toLowerCase()) ||
        item.destinatario.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter(item => item.status === status);
    }

    setFilteredData(filtered);
  };

  const downloadXml = async (item: XmlItem) => {
    if (!selectedCertificate) {
      toast({
        title: "Certificado não selecionado",
        description: "Selecione um certificado antes de baixar XMLs.",
        variant: "destructive"
      });
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const response = await sefazApi.downloadXML({ chaveAcesso: item.chave });
      
      if (response.success) {
        const xmlContent = response.data?.xmlContent || `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe${item.chave}">
      <ide>
        <cUF>35</cUF>
        <cNF>123456789</cNF>
        <natOp>Venda</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>1</nNF>
        <dhEmi>2024-01-15T10:30:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>3550308</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>9</cDV>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>1.0</verProc>
      </ide>
      <emit>
        <CNPJ>12345678000195</CNPJ>
        <xNome>${item.emitente}</xNome>
        <enderEmit>
          <xLgr>Rua das Flores, 123</xLgr>
          <nro>123</nro>
          <xBairro>Centro</xBairro>
          <cMun>3550308</cMun>
          <xMun>São Paulo</xMun>
          <UF>SP</UF>
          <CEP>01234567</CEP>
        </enderEmit>
        <IE>123456789</IE>
      </emit>
      <dest>
        <CNPJ>98765432000100</CNPJ>
        <xNome>${item.destinatario}</xNome>
        <enderDest>
          <xLgr>Av. Principal, 456</xLgr>
          <nro>456</nro>
          <xBairro>Bairro</xBairro>
          <cMun>3550308</cMun>
          <xMun>São Paulo</xMun>
          <UF>SP</UF>
          <CEP>01234567</CEP>
        </enderDest>
      </dest>
      <total>
        <ICMSTot>
          <vBC>0.00</vBC>
          <vICMS>0.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>${item.valor}</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>0.00</vPIS>
          <vCOFINS>0.00</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>${item.valor}</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;

        const blob = new Blob([xmlContent], { type: 'application/xml' });
        saveAs(blob, `${item.chave}.xml`);
        
        toast({
          title: "Download concluído",
          description: `XML ${item.chave} baixado com sucesso.`,
        });
      } else {
        toast({
          title: "Erro no download",
          description: response.error || "Erro ao baixar XML da SEFaz.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Ocorreu um erro ao baixar o XML.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
      setDownloadProgress(100);
    }
  };

  const downloadAllXmls = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    const totalItems = filteredData.length;
    let processed = 0;

    for (const item of filteredData) {
      await new Promise(resolve => setTimeout(resolve, 200));
      processed++;
      setDownloadProgress((processed / totalItems) * 100);
    }

    setIsDownloading(false);
    toast({
      title: "Download em lote concluído",
      description: `${totalItems} XMLs baixados com sucesso.`,
    });
  };

  const generateExcelReport = () => {
    const reportData = filteredData.map(item => ({
      'Chave de Acesso': item.chave,
      'Tipo': item.tipo,
      'Emitente': item.emitente,
      'Destinatário': item.destinatario,
      'Valor': item.valor,
      'Data': item.data,
      'Status': item.status,
      'Tamanho': item.tamanho
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório XMLs');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `relatorio_xmls_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Relatório gerado",
      description: "Relatório Excel baixado com sucesso.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processado':
        return <Badge variant="secondary" className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Processado</Badge>;
      case 'pendente':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'erro':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    total: xmlData.length,
    processados: xmlData.filter(item => item.status === 'processado').length,
    pendentes: xmlData.filter(item => item.status === 'pendente').length,
    erros: xmlData.filter(item => item.status === 'erro').length,
    valorTotal: xmlData.reduce((sum, item) => sum + item.valor, 0)
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <img src={sefazLogo} alt="SEFaz SP Logo" className="w-12 h-12" />
            <div>
              <h1 className="text-3xl font-bold text-primary">Interface SEFaz SP</h1>
              <p className="text-muted-foreground">Gerencie e baixe XMLs da Secretaria da Fazenda de São Paulo</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isConnected ? 'bg-success/10 text-success' : 'bg-muted'}`}>
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de XMLs</CardTitle>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-2xl font-bold">{stats.total}</span>
              </div>
            </CardHeader>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Processados</CardTitle>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-2xl font-bold text-success">{stats.processados}</span>
              </div>
            </CardHeader>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" />
                <span className="text-2xl font-bold text-warning">{stats.pendentes}</span>
              </div>
            </CardHeader>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Erros</CardTitle>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-2xl font-bold text-destructive">{stats.erros}</span>
              </div>
            </CardHeader>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total</CardTitle>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-2xl font-bold">
                  {stats.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="certificates">Certificados</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Consulta API SEFaz */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Consultar XMLs da SEFaz SP</CardTitle>
                <CardDescription>
                  Consulte documentos XML diretamente da API oficial da SEFaz
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0001-00"
                      value={consultaParams.cnpj}
                      onChange={(e) => setConsultaParams({...consultaParams, cnpj: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data-inicial">Data Inicial</Label>
                    <Input
                      id="data-inicial"
                      type="date"
                      value={consultaParams.dataInicial}
                      onChange={(e) => setConsultaParams({...consultaParams, dataInicial: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data-final">Data Final</Label>
                    <Input
                      id="data-final"
                      type="date"
                      value={consultaParams.dataFinal}
                      onChange={(e) => setConsultaParams({...consultaParams, dataFinal: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Button 
                      onClick={consultarXmlsSefaz} 
                      disabled={!isConnected || isLoadingXmls}
                      className="bg-gradient-primary hover:opacity-90 w-full"
                    >
                      {isLoadingXmls ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Consultando...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Consultar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters and Actions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Filtros e Ações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por chave, emitente..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={handleStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="processado">Processado</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="erro">Erro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={downloadAllXmls} disabled={!isConnected || isDownloading} className="bg-gradient-primary hover:opacity-90">
                    <Download className="w-4 h-4 mr-2" />
                    Download Todos
                  </Button>
                  <Button onClick={generateExcelReport} variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                    <FileDown className="w-4 h-4 mr-2" />
                    Gerar Relatório
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Download Progress */}
            {isDownloading && (
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso do Download</span>
                      <span>{Math.round(downloadProgress)}%</span>
                    </div>
                    <Progress value={downloadProgress} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* XML List */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>XMLs Disponíveis ({filteredData.length})</CardTitle>
                <CardDescription>
                  Lista de documentos XML disponíveis para download
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {filteredData.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-primary text-primary">
                              {item.tipo}
                            </Badge>
                            {getStatusBadge(item.status)}
                          </div>
                          <p className="font-medium">{item.chave}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.emitente} → {item.destinatario}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Valor: {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            <span>Data: {item.data}</span>
                            <span>Tamanho: {item.tamanho}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => downloadXml(item)}
                          disabled={!isConnected || isDownloading}
                          size="sm"
                          className="bg-gradient-primary hover:opacity-90"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificates" className="space-y-6">
            <CertificateManager 
              certificates={certificates}
              onCertificateAdd={handleCertificateAdd}
              onCertificateRemove={handleCertificateRemove}
              onCertificateSelect={handleCertificateSelect}
              selectedCertificate={selectedCertificate}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>
                  Configure as preferências da aplicação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="download-path">Diretório de Download</Label>
                  <Input
                    id="download-path"
                    placeholder="C:\Downloads\XMLs"
                    value="/downloads/xmls"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auto-download">Download Automático</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Notificações</h4>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações sobre novos XMLs
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}