# Script PowerShell pour autoriser le port 3000 dans le firewall Windows
# Exécutez ce script en tant qu'administrateur

Write-Host "🔧 Configuration du firewall Windows pour le port 3000..." -ForegroundColor Cyan

# Vérifier si la règle existe déjà
$existingRule = Get-NetFirewallRule -DisplayName "Node.js Backend Port 3000" -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "✅ Règle de firewall existante trouvée." -ForegroundColor Green
    
    # Vérifier si elle est activée
    if ($existingRule.Enabled -eq $true) {
        Write-Host "✅ La règle est déjà activée." -ForegroundColor Green
    } else {
        Write-Host "⚠️  La règle existe mais est désactivée. Activation..." -ForegroundColor Yellow
        Enable-NetFirewallRule -DisplayName "Node.js Backend Port 3000"
        Write-Host "✅ Règle activée avec succès." -ForegroundColor Green
    }
} else {
    Write-Host "📝 Création d'une nouvelle règle de firewall..." -ForegroundColor Yellow
    
    # Créer la règle de firewall
    New-NetFirewallRule `
        -DisplayName "Node.js Backend Port 3000" `
        -Description "Autorise les connexions entrantes sur le port 3000 pour le backend Node.js" `
        -Direction Inbound `
        -LocalPort 3000 `
        -Protocol TCP `
        -Action Allow `
        -Profile Domain,Private,Public
    
    Write-Host "✅ Règle de firewall créée avec succès !" -ForegroundColor Green
}

Write-Host ""
Write-Host "🌐 Le port 3000 est maintenant accessible depuis votre réseau local." -ForegroundColor Cyan
Write-Host "   Votre backend devrait être accessible sur http://192.168.1.8:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur une touche pour fermer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

