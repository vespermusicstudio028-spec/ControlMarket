# 🚀 ControlMarket — Guia de Deploy

## Visão Geral

Este projeto possui deploy automatizado para **GitHub**, **Vercel** e **Supabase**.

---

## ▶️ Como Fazer Deploy Manualmente (PowerShell)

Abra o terminal na pasta do projeto e execute:

```powershell
# Deploy padrão
.\deploy.ps1

# Deploy com mensagem personalizada
.\deploy.ps1 -Mensagem "feat: nova funcionalidade de vendas"
```

O script faz automaticamente:
1. ✅ Build do projeto (`npm run build`)
2. ✅ Commit e Push para o GitHub
3. ✅ Deploy na Vercel (se o Vercel CLI estiver instalado)
4. ✅ Aplica migrations no Supabase (se o Supabase CLI estiver instalado)

---

## 🤖 Deploy Automático (GitHub Actions)

Todo `push` nas branches `main` ou `master` dispara o deploy automático via GitHub Actions.

### Configuração dos Secrets no GitHub

Acesse: `https://github.com/vespermusicstudio028-spec/ControlMarket/settings/secrets/actions`

Adicione os seguintes secrets:

| Secret | Onde Obter |
|--------|-----------|
| `VITE_SUPABASE_URL` | Dashboard Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Dashboard Supabase → Project Settings → API |
| `VERCEL_TOKEN` | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Vercel Dashboard → Settings → General |
| `VERCEL_PROJECT_ID` | Vercel Dashboard → Project → Settings → General |

---

## 🔧 Pré-requisitos para Deploy Manual

### Git
- Baixe em: https://git-scm.com

### Vercel CLI (opcional, recomendado)
```powershell
npm install -g vercel
vercel login
```

### Supabase CLI (opcional, para migrations)
```powershell
npm install -g supabase
supabase login
supabase link --project-ref zjwpoxqymtvpttoswzhj
```

---

## 🔗 Links do Projeto

| Serviço | URL |
|---------|-----|
| **GitHub** | https://github.com/vespermusicstudio028-spec/ControlMarket |
| **Vercel (Produção)** | https://control-market-kohl.vercel.app |
| **Supabase** | https://supabase.com/dashboard/project/zjwpoxqymtvpttoswzhj |

---

## 📁 Arquivos de Deploy

```
ControlMarket/
├── deploy.ps1                    ← Script de deploy manual
├── vercel.json                   ← Configuração da Vercel
└── .github/
    └── workflows/
        └── deploy.yml            ← CI/CD automático via GitHub Actions
```
