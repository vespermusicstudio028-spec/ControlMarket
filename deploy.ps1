# ============================================================
#  ControlMarket - Script de Deploy Automatizado
#  GitHub -> Vercel -> Supabase
#  Uso: .\deploy.ps1 -Mensagem "Descrição das mudanças"
#  Uso com SQL: .\deploy.ps1 -AplicarSQL
# ============================================================

param(
    [string]$Mensagem = "deploy: atualização automática $(Get-Date -Format 'dd/MM/yyyy HH:mm')",
    [switch]$AplicarSQL
)

# --- CONFIGURAÇÕES ---
$GITHUB_REPO    = "vespermusicstudio028-spec/ControlMarket"
$VERCEL_URL     = "https://control-market-kohl.vercel.app"
$SUPABASE_REF   = "zjwpoxqymtvpttoswzhj"
$SUPABASE_URL   = "https://supabase.com/dashboard/project/$SUPABASE_REF"
$SUPABASE_SQL   = "$SUPABASE_URL/sql/new"
$SQL_FILE       = ".\supabase\setup_completo.sql"

# Cores para output
function Write-Passo { param($texto) Write-Host "`n[>] $texto" -ForegroundColor Cyan }
function Write-Ok    { param($texto) Write-Host "    [OK] $texto" -ForegroundColor Green }
function Write-Aviso { param($texto) Write-Host "    [!] $texto" -ForegroundColor Yellow }
function Write-Erro  { param($texto) Write-Host "    [ERR] $texto" -ForegroundColor Red }

Clear-Host
Write-Host "================================================" -ForegroundColor DarkCyan
Write-Host "   ControlMarket — Deploy Automatizado" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor DarkCyan
Write-Host "  Repositório : github.com/$GITHUB_REPO" -ForegroundColor Gray
Write-Host "  Vercel      : $VERCEL_URL" -ForegroundColor Gray
Write-Host "  Supabase    : $SUPABASE_REF.supabase.co" -ForegroundColor Gray
Write-Host "  Mensagem    : $Mensagem" -ForegroundColor Gray
Write-Host "================================================`n" -ForegroundColor DarkCyan

# =============================================
# PASSO 1: Verificações de Pré-requisitos
# =============================================
Write-Passo "Verificando pré-requisitos..."

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Erro "Git não encontrado. Instale em: https://git-scm.com"
    exit 1
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Erro "Node.js não encontrado. Instale em: https://nodejs.org"
    exit 1
}

$vercelDisponivel = $false
if (Get-Command vercel -ErrorAction SilentlyContinue) {
    $vercelDisponivel = $true
    Write-Ok "Vercel CLI encontrado."
} else {
    Write-Aviso "Vercel CLI não encontrado. Deploy será pelo push no GitHub."
    Write-Aviso "Para instalar: npm install -g vercel"
}

$supabaseDisponivel = $false
if (Get-Command supabase -ErrorAction SilentlyContinue) {
    $supabaseDisponivel = $true
    Write-Ok "Supabase CLI encontrado."
} else {
    Write-Aviso "Supabase CLI não encontrado."
    Write-Aviso "Para instalar: npm install -g supabase"
}

Write-Ok "Pré-requisitos verificados."

# =============================================
# PASSO 2: Build do Projeto
# =============================================
Write-Passo "Gerando build de produção..."

npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Erro "Falha no build! Execute 'npm run build' para ver os erros."
    exit 1
}
Write-Ok "Build de produção concluído com sucesso!"

# =============================================
# PASSO 3: Git — Commit e Push para GitHub
# =============================================
Write-Passo "Enviando alterações para o GitHub..."

# Inicializar Git se necessário
if (-not (Test-Path ".git")) {
    Write-Aviso "Inicializando repositório Git..."
    git init
    git branch -M main
    git remote add origin "https://github.com/$GITHUB_REPO.git"
    Write-Ok "Repositório Git inicializado."
}

# Corrigir remote se necessário
$remoteUrl = git remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
    git remote add origin "https://github.com/$GITHUB_REPO.git"
} elseif ($remoteUrl -notlike "*$GITHUB_REPO*") {
    git remote set-url origin "https://github.com/$GITHUB_REPO.git"
    Write-Ok "Remote origin atualizado para $GITHUB_REPO."
}

# Verificar alterações
$gitStatus = git status --short
if ([string]::IsNullOrWhiteSpace($gitStatus)) {
    Write-Aviso "Nenhuma alteração pendente no Git. Pulando commit."
} else {
    Write-Host "    Arquivos modificados:" -ForegroundColor Gray
    git status --short | ForEach-Object { Write-Host "      $_" -ForegroundColor DarkGray }

    git add -A
    Write-Ok "Arquivos adicionados ao stage."

    git commit -m $Mensagem
    if ($LASTEXITCODE -ne 0) {
        Write-Erro "Falha ao criar commit."
        exit 1
    }
    Write-Ok "Commit criado: '$Mensagem'"

    # Tentar push em main, depois master
    Write-Aviso "Enviando para o GitHub..."
    $pushed = $false
    foreach ($branch in @("main", "master")) {
        git push origin $branch 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $pushed = $true
            Write-Ok "Código enviado para branch '$branch' com sucesso!"
            Write-Ok "GitHub: https://github.com/$GITHUB_REPO"
            break
        }
    }

    if (-not $pushed) {
        Write-Erro "Falha no push. Verifique suas credenciais do GitHub."
        Write-Aviso "Dica: instale o GitHub CLI: winget install --id GitHub.cli"
        Write-Aviso "Depois execute: gh auth login"
        exit 1
    }
}

# =============================================
# PASSO 4: Vercel — Deploy
# =============================================
Write-Passo "Deploy na Vercel..."

if ($vercelDisponivel) {
    vercel --prod --yes 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Deploy na Vercel concluído!"
        Write-Ok "URL: $VERCEL_URL"
    } else {
        Write-Aviso "Erro no Vercel CLI. Verifique com: vercel login"
        Write-Aviso "O deploy automático pelo GitHub ainda deve funcionar."
    }
} else {
    Write-Aviso "Deploy da Vercel será acionado automaticamente pelo push no GitHub."
    Write-Aviso "Acesse em alguns minutos: $VERCEL_URL"
}

# =============================================
# PASSO 5: Supabase — Migrations
# =============================================
Write-Passo "Sincronizando com o Supabase..."

if ($supabaseDisponivel) {
    # Tentar vincular ao projeto
    Write-Aviso "Vinculando ao projeto Supabase..."
    supabase link --project-ref $SUPABASE_REF 2>&1 | Out-Null
    
    if (Test-Path "supabase\migrations") {
        Write-Aviso "Aplicando migrations..."
        supabase db push 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Ok "Migrations aplicadas com sucesso no Supabase!"
        } else {
            Write-Aviso "Falha ao aplicar migrations via CLI."
            Write-Aviso "Use o script SQL manual: supabase\setup_completo.sql"
        }
    }
} elseif ($AplicarSQL) {
    # Abrir SQL Editor do Supabase no navegador
    Write-Aviso "Abrindo SQL Editor do Supabase..."
    
    if (Test-Path $SQL_FILE) {
        # Copiar SQL para clipboard
        Get-Content $SQL_FILE | Set-Clipboard
        Write-Ok "SQL copiado para a área de transferência!"
        Write-Aviso "Abrindo o SQL Editor no Supabase..."
        Start-Process $SUPABASE_SQL
        Write-Host ""
        Write-Host "  INSTRUÇÕES:" -ForegroundColor Yellow
        Write-Host "  1. O SQL Editor do Supabase foi aberto no navegador." -ForegroundColor Gray
        Write-Host "  2. Cole o SQL (Ctrl+V) no editor." -ForegroundColor Gray
        Write-Host "  3. Clique em 'Run' para executar." -ForegroundColor Gray
    } else {
        Start-Process "$SUPABASE_URL/sql/new"
        Write-Aviso "SQL Editor do Supabase aberto. Execute o arquivo supabase\setup_completo.sql"
    }
} else {
    Write-Aviso "Supabase: para aplicar o SQL manualmente, acesse:"
    Write-Aviso "$SUPABASE_SQL"
    Write-Aviso "Ou execute: .\deploy.ps1 -AplicarSQL"
}

# =============================================
# RESUMO FINAL
# =============================================
Write-Host ""
Write-Host "================================================" -ForegroundColor DarkGreen
Write-Host "   === Deploy Finalizado! ===" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor DarkGreen
Write-Host "  GitHub  : https://github.com/$GITHUB_REPO" -ForegroundColor Cyan
Write-Host "  Vercel  : $VERCEL_URL" -ForegroundColor Cyan
Write-Host "  Supabase: $SUPABASE_URL" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor DarkGreen
