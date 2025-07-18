exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    console.log('Function called with method:', event.httpMethod);
    
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ success: false, error: 'Method not allowed' }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'No body found' }),
      };
    }

    console.log('Request body received, parsing...');
    const { certificateBase64, password } = JSON.parse(event.body);

    if (!certificateBase64 || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Missing certificate or password' }),
      };
    }

    console.log('Certificate base64 length:', certificateBase64.length);
    console.log('Password provided:', !!password);

    // Mock certificate data for testing connectivity
    const mockCertificateData = {
      subject: 'CN=EMPRESA TESTE LTDA:12345678000195, OU=AC CERTISIGN RFB G5, O=ICP-BRASIL, C=BR',
      issuer: 'CN=AC CERTISIGN RFB G5, O=ICP-BRASIL, C=BR',
      validFrom: new Date(Date.now() - 30*24*60*60*1000).toISOString(),
      validTo: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
      serialNumber: '1234567890ABCDEF',
    };

    console.log('Returning mock certificate data');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: mockCertificateData,
        message: 'Certificado validado com sucesso (modo desenvolvimento)'
      })
    };

  } catch (error) {
    console.error('Function error:', error);
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