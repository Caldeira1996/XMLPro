# XMLPro – Interface para Download de XMLs da SEFaz SP

## ℹ️ Sobre o Projeto

**XMLPro** é uma interface web moderna desenvolvida para permitir o **download e gerenciamento de documentos XML da SEFaz SP**, com suporte a certificados digitais, relatórios em Excel e painel de visualização interativo.

Desenvolvido por: **Lucas Caldeira**  
Contato: lucas@email.com

---

## 🚀 Tecnologias Utilizadas

- **React 18** – Framework principal
- **TypeScript** – Tipagem estática
- **Tailwind CSS** – Estilização moderna e responsiva
- **shadcn/ui** – Componentes de UI com design elegante
- **Lucide React** – Biblioteca de ícones
- **xlsx** – Geração de relatórios Excel
- **file-saver** – Manipulação de arquivos para download
- **Vite** – Ferramenta de build moderna e rápida

---

## 📦 Estrutura de Pastas

src/
├── components/
│ ├── XmlDashboard.tsx # Painel principal
│ ├── NotificationCenter.tsx # Sistema de alertas
│ └── ui/ # Componentes reutilizáveis
├── pages/
│ └── Index.tsx # Página inicial
├── hooks/
│ └── use-toast.ts # Notificações personalizadas
├── assets/
│ └── sefaz-logo.png # Logotipo da aplicação
└── App.css # Estilos gerais


---

## ⚙️ Como rodar localmente

Pré-requisitos:
- Node.js (versão 18 ou superior)
- npm (ou yarn)

### Passos:

```bash
# 1. Clone o repositório
git clone https://github.com/Caldeira1996/xmlpro.git

# 2. Acesse a pasta
cd xmlpro

# 3. Instale as dependências
npm install

# 4. Rode o projeto
npm run dev
