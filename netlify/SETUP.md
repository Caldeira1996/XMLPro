# Setup das Netlify Functions

## Pré-requisitos

1. **Instale as dependências**:
```bash
cd netlify
npm install
```

2. **Configure o build** no `netlify.toml` (raiz do projeto):
```toml
[build]
  functions = "netlify/functions"
  
[build.environment]
  NODE_VERSION = "18"
```

## Functions Criadas

### 1. `/api/validar-certificado` 
- **Método**: POST
- **Payload**: `{ certificateBase64, password }`
- **Resposta**: Dados do certificado (subject, issuer, datas, etc.)

### 2. `/api/testar-conexao`
- **Método**: POST  
- **Payload**: `{ certificateBase64, password }`
- **Resposta**: Status da conexão com SEFAZ SP

## Como usar

Sua aplicação React já está configurada para usar essas functions. Basta:

1. Fazer upload de um certificado .pfx/.p12 real
2. Inserir a senha correta
3. O sistema automaticamente:
   - Valida o certificado
   - Testa conexão com SEFAZ SP
   - Exibe status na interface

## Segurança

- Certificados são processados em memória (não salvos em disco)
- Use HTTPS sempre em produção
- Considere variáveis de ambiente para configurações sensíveis

## Troubleshooting

- **Erro 405**: Verifique se está usando POST
- **Erro de certificado**: Verifique senha e arquivo .pfx
- **Erro de conexão**: Verifique conectividade com SEFAZ SP

## Deploy

As functions são automaticamente deployadas com seu site Netlify.