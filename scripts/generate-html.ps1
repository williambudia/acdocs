# Script para gerar HTML dos documentos (pode imprimir como PDF no navegador)

Write-Host "Gerando HTML da documentação..." -ForegroundColor Green

# Criar pasta de output
$outputDir = "docs/html"
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Template HTML
$htmlTemplate = @"
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <style>
        @media print {
            @page { margin: 2cm; }
            body { font-size: 10pt; }
            h1 { page-break-before: always; }
            h1:first-of-type { page-break-before: avoid; }
            pre, table { page-break-inside: avoid; }
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #333;
        }
        
        h1 {
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
            margin-top: 40px;
        }
        
        h2 {
            color: #1e40af;
            border-bottom: 2px solid #ddd;
            padding-bottom: 8px;
            margin-top: 30px;
        }
        
        h3 {
            color: #1e3a8a;
            margin-top: 20px;
        }
        
        code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        
        pre {
            background: #1e293b;
            color: #e2e8f0;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            line-height: 1.5;
        }
        
        pre code {
            background: none;
            color: inherit;
            padding: 0;
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background: #2563eb;
            color: white;
            font-weight: 600;
        }
        
        tr:nth-child(even) {
            background: #f9fafb;
        }
        
        blockquote {
            border-left: 4px solid #2563eb;
            padding-left: 20px;
            margin-left: 0;
            color: #666;
            font-style: italic;
        }
        
        ul, ol {
            padding-left: 30px;
        }
        
        li {
            margin: 8px 0;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
        }
        
        .header h1 {
            border: none;
            margin: 0;
            font-size: 2.5em;
        }
        
        .header p {
            color: #666;
            margin: 10px 0 0 0;
        }
        
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2563eb;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .print-button:hover {
            background: #1e40af;
        }
        
        @media print {
            .print-button { display: none; }
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
    
    <div class="header">
        <h1>{{TITLE}}</h1>
        <p>ACDocs - Plataforma de Gerenciamento de Documentos</p>
        <p>Gerado em: {{DATE}}</p>
    </div>
    
    {{CONTENT}}
</body>
</html>
"@

# Função para converter Markdown básico para HTML
function Convert-MarkdownToHtml {
    param([string]$markdown)
    
    # Converter headers
    $html = $markdown -replace '### (.*)', '<h3>$1</h3>'
    $html = $html -replace '## (.*)', '<h2>$1</h2>'
    $html = $html -replace '# (.*)', '<h1>$1</h1>'
    
    # Converter code blocks
    $html = $html -replace '```(\w+)\r?\n([\s\S]*?)```', '<pre><code>$2</code></pre>'
    $html = $html -replace '```\r?\n([\s\S]*?)```', '<pre><code>$1</code></pre>'
    
    # Converter inline code
    $html = $html -replace '`([^`]+)`', '<code>$1</code>'
    
    # Converter bold
    $html = $html -replace '\*\*([^*]+)\*\*', '<strong>$1</strong>'
    
    # Converter listas
    $html = $html -replace '(?m)^- (.*)$', '<li>$1</li>'
    $html = $html -replace '(<li>.*</li>)', '<ul>$1</ul>'
    
    # Converter parágrafos
    $html = $html -replace '(?m)^([^<\r\n].+)$', '<p>$1</p>'
    
    return $html
}

# Arquivos para converter
$files = @(
    @{Path="docs/SAAS_ARCHITECTURE.md"; Title="Arquitetura SaaS Multi-Tenant"},
    @{Path="docs/DATABASE_SCHEMA.md"; Title="Schema de Banco de Dados"}
)

foreach ($fileInfo in $files) {
    $file = $fileInfo.Path
    $title = $fileInfo.Title
    
    if (Test-Path $file) {
        $fileName = [System.IO.Path]::GetFileNameWithoutExtension($file)
        $outputFile = "$outputDir/$fileName.html"
        
        Write-Host "Convertendo $file..." -ForegroundColor Cyan
        
        # Ler conteúdo
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # Converter para HTML
        $htmlContent = Convert-MarkdownToHtml $content
        
        # Aplicar template
        $html = $htmlTemplate -replace '{{TITLE}}', $title
        $html = $html -replace '{{DATE}}', (Get-Date -Format "dd/MM/yyyy HH:mm")
        $html = $html -replace '{{CONTENT}}', $htmlContent
        
        # Salvar
        $html | Out-File -FilePath $outputFile -Encoding UTF8
        
        Write-Host "✓ Gerado: $outputFile" -ForegroundColor Green
        Write-Host "  Abra no navegador e use Ctrl+P para salvar como PDF" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Arquivo não encontrado: $file" -ForegroundColor Red
    }
}

Write-Host "`nConcluído! HTMLs salvos em: $outputDir" -ForegroundColor Green
Write-Host "Abra os arquivos HTML no navegador e pressione Ctrl+P para salvar como PDF" -ForegroundColor Cyan
