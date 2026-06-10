import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse large JSON bodies for base64 images
  app.use(express.json({ limit: '10mb' }));

  // API Route for analyzing product images
  app.post("/api/product/analyze", async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      if (!image) {
        console.log('❌ Nenhuma imagem fornecida');
        return res.status(400).json({ error: "No image provided" });
      }

      console.log('📸 Analisando imagem...');
      
      if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY não configurada!');
        return res.status(503).json({ 
          error: "Serviço de análise não configurado. Configure a chave GEMINI_API_KEY no arquivo .env.local",
          code: "GEMINI_API_KEY_NOT_SET"
        });
      }

      // Remove the prefix data:image/jpeg;base64, if present
      const base64Data = image.split(',')[1] || image;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType || "image/jpeg",
              },
            },
            {
              text: `Você é um assistente especializado em reconhecer produtos de varejo e extrair informações de embalagens.

Analise esta imagem de um produto e extraia os seguintes dados:
1. Nome completo do produto (incluindo marca)
2. Tamanho/volume/peso se visível
3. Código de barras (se visível)

Retorne APENAS um JSON válido, sem explicações adicionais:
{
  "name": "nome do produto",
  "quantity": "número",
  "unit": "unidade (ml, L, g, kg, un, etc)",
  "barcode": "código numérico ou vazio"
}`
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: "Complete product name including brand",
              },
              quantity: {
                type: Type.STRING,
                description: "Numeric quantity/volume value",
              },
              unit: {
                type: Type.STRING,
                description: "Unit of measurement (ml, L, g, kg, un, pç, etc)",
              },
              barcode: {
                type: Type.STRING,
                description: "Barcode number if visible, otherwise empty string",
              }
            },
            required: ["name", "quantity", "unit", "barcode"]
          }
        }
      });

      const textOutput = response.text;
      console.log('📝 Resposta bruta do Gemini:', textOutput);
      
      let parsed;
      try {
        parsed = JSON.parse(textOutput);
        console.log('✅ Análise concluída:', parsed);
      } catch(e) {
        console.error("❌ Erro ao fazer parse da resposta:", textOutput);
        return res.status(500).json({ error: "Failed to parse model response", raw: textOutput });
      }
      
      res.json(parsed);
    } catch (error: any) {
      console.error("❌ Erro no Gemini:", error);
      res.status(500).json({ error: error.message || "Error analyzing product image" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
