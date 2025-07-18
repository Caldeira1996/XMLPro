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
  
      const { certificateBase64, password, cnpj, dataInicio, dataFim } = JSON.parse(event.body || '{}');
  
      if (!certificateBase64 || !password || !cnpj || !dataInicio || !dataFim) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Parâmetros obrigatórios faltando' }),
        };
      }
  
      // Mock NFes data
      const mockNFes = [
        {
          chave: '35' + new Date().getFullYear() + cnpj.replace(/\D/g, '').substring(0, 8) + '55001000000000112345678' + Math.floor(Math.random() * 10),
          serie: '001',
          numero: '000000001',
          dataEmissao: dataInicio,
          valor: '1500.00',
          destinatario: 'EMPRESA EXEMPLO LTDA',
          status: 'Autorizada'
        },
        {
          chave: '35' + new Date().getFullYear() + cnpj.replace(/\D/g, '').substring(0, 8) + '55001000000000212345679' + Math.floor(Math.random() * 10),
          serie: '001', 
          numero: '000000002',
          dataEmissao: new Date(new Date(dataInicio).getTime() + 24*60*60*1000).toISOString().split('T')[0],
          valor: '2300.50',
          destinatario: 'CLIENTE TESTE S/A',
          status: 'Autorizada'
        }
      ];
  
      // Filter by date range
      const startDate = new Date(dataInicio);
      const endDate = new Date(dataFim);
      
      const filteredNFes = mockNFes.filter(nfe => {
        const nfeDate = new Date(nfe.dataEmissao);
        return nfeDate >= startDate && nfeDate <= endDate;
      });
  
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1500));
  
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: filteredNFes,
          message: `Consulta realizada para CNPJ ${cnpj} no período de ${dataInicio} a ${dataFim}`
        })
      };
  
    } catch (error) {
      console.error('Server error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Erro interno do servidor: ' + (error instanceof Error ? error.message : 'erro desconhecido')
        })
      };
    }
  };