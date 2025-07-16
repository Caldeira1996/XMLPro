import express from 'express';
import multer from 'multer';
import fs from 'fs';
import https from 'https';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/api/upload-cert', upload.single('certFile'), async (req, res) => {
  try {
    const password = req.body.password;
    const filePath = req.file?.path;

    if (!filePath || !password) {
      return res.status(400).json({ success: false, error: 'Arquivo ou senha ausente' });
    }

    // Lê o certificado
    const pfx = fs.readFileSync(filePath);

    // Cria o agent (você pode fazer requisição SEFAZ aqui)
    const agent = new https.Agent({
      pfx,
      passphrase: password,
      rejectUnauthorized: false // apenas para teste
    });

    // Teste simples
    res.json({ success: true, message: 'Certificado recebido com sucesso!' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro ao processar certificado' });
  }
});

app.listen(8080, () => {
  console.log('Servidor rodando em http://localhost:8080');
});
