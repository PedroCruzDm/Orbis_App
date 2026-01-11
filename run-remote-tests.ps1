param(
    [string]$ProjectPath = "C:\Users\joaop\OneDrive\Documentos\atividades\projetos\Orbis_App\Orbis_App",
    [string]$TestCommand = "npm run test:unit"
)

function Log {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

if (-not (Test-Path $ProjectPath)) {
    Log "Diretorio nao encontrado: $ProjectPath" "Red"
    exit 1
}

Log "Usando diretório: $ProjectPath" "Cyan"
Log "Comando de teste: $TestCommand" "Cyan"

Push-Location $ProjectPath

try {
    if (-not (Test-Path "package.json")) {
        Log "package.json nao encontrado em $ProjectPath" "Red"
        exit 1
    }

    if (-not (Test-Path "node_modules")) {
        Log "Instalando dependencias..." "Cyan"
        npm install
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }

    if ([string]::IsNullOrWhiteSpace($TestCommand)) {
        Log "TestCommand nao pode ser vazio" "Red"
        exit 1
    }

    Log "Executando testes com: $TestCommand" "Cyan"
    Invoke-Expression $TestCommand
    $code = $LASTEXITCODE
    if ($code -eq 0) {
        Log "Testes concluidos com sucesso" "Green"
    } else {
        Log "Testes falharam (exit code $code)" "Red"
        if ($TestCommand -match "npm test" -or $TestCommand -match "npm run") {
            Log "Dica: execute 'npm run' para ver os scripts disponiveis no projeto" "Yellow"
        }
    }
    exit $code
}
finally {
    Pop-Location
}
