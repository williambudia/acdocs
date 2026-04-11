# Script para gerar PDFs dos documentos de arquitetura
# Requer: pandoc instalado (winget install pandoc)

Write-Host "Gerando PDFs da documentação..." -ForegroundColor Green

# Verificar se pandoc está instalado
if (!(Get-Command pandoc -ErrorAction SilentlyContinue)) {
    Write-Host "ERRO: Pandoc não está instalado!" -ForegroundColor Red
    Write-Host "Instale com: winget install pandoc" -ForegroundColor Yellow
    exit 1
}

# Criar pasta de output
$outputDir = "docs/pdf"
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Arquivos para converter
$files = @(
    "docs/SAAS_ARCHITECTURE.md",
    "docs/DATABASE_SCHEMA.md"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $fileName = [System.IO.Path]::GetFileNameWithoutExtension($file)
        $outputFile = "$outputDir/$fileName.pdf"
        
        Write-Host "Convertendo $file..." -ForegroundColor Cyan
        
        pandoc $file -o $outputFile `
            --pdf-engine=xelatex `
            -V geometry:margin=1in `
            -V fontsize=11pt `
            -V documentclass=article `
            --toc `
            --highlight-style=tango
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Gerado: $outputFile" -ForegroundColor Green
        } else {
            Write-Host "✗ Erro ao gerar: $outputFile" -ForegroundColor Red
        }
    } else {
        Write-Host "✗ Arquivo não encontrado: $file" -ForegroundColor Red
    }
}

Write-Host "`nConcluído! PDFs salvos em: $outputDir" -ForegroundColor Green
