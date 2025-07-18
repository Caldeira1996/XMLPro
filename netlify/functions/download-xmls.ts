exports.handler = async (event, context) => {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': 'application/json',
    };
  
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }
  
    try {
      if (event.httpMethod !== 'POST') {
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ success: false, error: 'Method not allowed' }),
        };
      }
  
      const { certificateBase64, password, chave } = JSON.parse(event.body || '{}');
  
      if (!certificateBase64 || !password || !chave) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Parâmetros obrigatórios faltando' }),
        };
      }
  
      // Extract info from key for realistic XML
      const cnpjFromChave = chave.substring(6, 20);
      const serieFromChave = chave.substring(22, 25);
      const numeroFromChave = chave.substring(25, 34);
      const codigoFromChave = chave.substring(35, 43);
  
      const mockXML = `<?xml version="1.0" encoding="UTF-8"?>
  <nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
    <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
      <infNFe versao="4.00" Id="NFe${chave}">
        <ide>
          <cUF>35</cUF>
          <cNF>${codigoFromChave}</cNF>
          <natOp>VENDA DE MERCADORIA</natOp>
          <mod>55</mod>
          <serie>${serieFromChave}</serie>
          <nNF>${parseInt(numeroFromChave)}</nNF>
          <dhEmi>${new Date().toISOString()}</dhEmi>
          <tpNF>1</tpNF>
          <idDest>2</idDest>
          <cMunFG>3550308</cMunFG>
          <tpImp>1</tpImp>
          <tpEmis>1</tpEmis>
          <cDV>${chave.slice(-1)}</cDV>
          <tpAmb>1</tpAmb>
          <finNFe>1</finNFe>
          <indFinal>1</indFinal>
          <indPres>1</indPres>
        </ide>
        <emit>
          <CNPJ>${cnpjFromChave}</CNPJ>
          <xNome>EMPRESA EMISSORA LTDA</xNome>
          <enderEmit>
            <xLgr>RUA EXEMPLO</xLgr>
            <nro>123</nro>
            <xBairro>CENTRO</xBairro>
            <cMun>3550308</cMun>
            <xMun>SAO PAULO</xMun>
            <UF>SP</UF>
            <CEP>01000000</CEP>
          </enderEmit>
          <IE>123456789012</IE>
        </emit>
        <total>
          <ICMSTot>
            <vNF>1500.00</vNF>
          </ICMSTot>
        </total>
        <infAdic>
          <infCpl>XML gerado para demonstracao - Chave: ${chave}</infCpl>
        </infAdic>
      </infNFe>
    </NFe>
    <protNFe versao="4.00">
      <infProt>
        <chNFe>${chave}</chNFe>
        <dhRecbto>${new Date().toISOString()}</dhRecbto>
        <cStat>100</cStat>
        <xMotivo>Autorizado o uso da NF-e</xMotivo>
      </infProt>
    </protNFe>
  </nfeProc>`;
  
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 800));
  
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          xml: mockXML,
          chave: chave
        })
      };
  
    } catch (error) {
      console.error('XML download error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Erro ao baixar XML: ' + (error instanceof Error ? error.message : 'erro desconhecido')
        })
      };
    }
  };