# Interface SEFaz SP - Sistema de Download de XMLs

## Descrição do Projeto

Esta é uma interface moderna e funcional para download de XMLs diretamente da SEFaz de São Paulo. A aplicação permite o gerenciamento de certificados digitais, visualização de documentos XML e geração de relatórios em Excel.

## Funcionalidades Principais

### 🔐 Autenticação com Certificado Digital
- Seleção de certificados digitais A1 e A3
- Validação de status dos certificados
- Notificações sobre vencimento

### 📊 Dashboard Completo
- Estatísticas em tempo real de XMLs processados
- Filtros por status, emitente e chave de acesso
- Visualização de valores totais e métricas

### 📥 Download de XMLs
- Download individual de documentos XML
- Download em lote de múltiplos XMLs
- Barra de progresso para acompanhamento
- XMLs gerados com estrutura NFe válida

### 📋 Relatórios
- Geração de relatórios em Excel (.xlsx)
- Dados consolidados de todos os XMLs
- Formato compatível com análises posteriores

### 🔔 Sistema de Notificações
- Notificações em tempo real
- Alertas sobre certificados vencendo
- Confirmações de downloads concluídos

## Tecnologias Utilizadas

- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Shadcn/UI** - Componentes de interface
- **Lucide React** - Ícones
- **XLSX** - Geração de arquivos Excel
- **File-saver** - Download de arquivos
- **React Router** - Navegação
- **Vite** - Build tool

## Como Usar

### 1. Configuração de Certificado
1. Acesse a aba "Certificados"
2. Selecione o certificado digital desejado
3. Confirme a conexão (status ficará "Conectado")

### 2. Visualização de XMLs
1. No Dashboard, visualize as estatísticas
2. Use os filtros para encontrar XMLs específicos
3. Busque por chave de acesso, emitente ou destinatário

### 3. Download de XMLs
1. Clique em "Download" em um XML específico, ou
2. Use "Download Todos" para baixar em lote
3. Acompanhe o progresso na barra de download

### 4. Geração de Relatórios
1. Clique em "Gerar Relatório"
2. O arquivo Excel será baixado automaticamente
3. Contém todas as informações dos XMLs filtrados

### 5. Configurações
1. Acesse a aba "Configurações"
2. Configure diretório de download
3. Defina frequência de download automático
4. Personalize notificações

## Estrutura dos Arquivos

```
src/
├── components/
│   ├── XmlDashboard.tsx      # Componente principal
│   ├── NotificationCenter.tsx # Sistema de notificações
│   └── ui/                   # Componentes de interface
├── assets/
│   └── sefaz-logo.png       # Logo da aplicação
├── hooks/
│   └── use-toast.ts         # Hook para notificações
└── pages/
    └── Index.tsx            # Página inicial
```

## Dados de Exemplo

A aplicação inclui dados mockados para demonstração:

### Certificados
- Certificado A1 - Empresa XYZ (Válido)
- Certificado A3 - Empresa ABC (Expira em breve)

### XMLs de Exemplo
- NFe, NFCe e CTe
- Diferentes status (processado, pendente, erro)
- Valores e datas variados

## Recursos Técnicos

### Design System
- Cores semânticas definidas no `index.css`
- Tokens de design reutilizáveis
- Gradientes e sombras personalizadas
- Suporte a modo escuro

### Responsividade
- Layout adaptável para desktop e mobile
- Grids responsivos
- Componentes otimizados para telas pequenas

### Performance
- Lazy loading de componentes
- Otimização de re-renders
- Uso eficiente de estado

## Próximos Passos

Para implementação em produção, considere:

1. **Integração Real com SEFaz SP**
   - Implementar API calls para a SEFaz
   - Autenticação com certificados reais
   - Tratamento de erros específicos

2. **Backend**
   - Servidor para processar certificados
   - Banco de dados para armazenar XMLs
   - Sistema de cache para performance

3. **Segurança**
   - Criptografia de dados sensíveis
   - Validação de certificados
   - Logs de auditoria

4. **Monitoramento**
   - Métricas de uso
   - Alertas de sistema
   - Dashboard de administração

## Observações Importantes

- Esta é uma versão demonstrativa com dados mockados
- Para uso em produção, é necessário integração com APIs reais
- Certificados digitais requerem infraestrutura específica
- Compliance com normas da Receita Federal é essencial

## Suporte

Para dúvidas ou sugestões sobre este projeto de demonstração, consulte a documentação técnica ou entre em contato com a equipe de desenvolvimento.

---

*Este projeto foi desenvolvido como uma demonstração de funcionalidades para integração com a SEFaz SP.*