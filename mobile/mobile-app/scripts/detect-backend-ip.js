/**
 * Script pour détecter l'IP du backend et mettre à jour app.json
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Ignorer les adresses internes et IPv6
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({
          interface: name,
          address: iface.address,
          netmask: iface.netmask
        });
      }
    }
  }
  
  return ips;
}

function updateAppJson(ip, port = 3000) {
  const appJsonPath = path.join(__dirname, '..', 'app.json');
  
  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const newUrl = `http://${ip}:${port}`;
    
    appJson.expo.extra.API_BASE_URL = newUrl;
    
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
    
    console.log(`\n✅ app.json mis à jour avec: ${newUrl}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de app.json:', error.message);
    return false;
  }
}

function main() {
  console.log('🔍 Détection de l\'IP du backend...\n');
  
  const ips = getLocalIPs();
  
  if (ips.length === 0) {
    console.error('❌ Aucune adresse IP réseau trouvée.');
    console.log('\n💡 Vérifiez que vous êtes connecté à un réseau WiFi ou Ethernet.');
    process.exit(1);
  }
  
  console.log('📡 Adresses IP disponibles :\n');
  ips.forEach((ip, index) => {
    console.log(`   ${index + 1}. ${ip.address} (${ip.interface})`);
  });
  
  // Si une seule IP, l'utiliser automatiquement
  if (ips.length === 1) {
    const selectedIP = ips[0].address;
    console.log(`\n✅ IP unique détectée: ${selectedIP}`);
    
    rl.question(`\nVoulez-vous utiliser ${selectedIP}:3000 ? (o/n): `, (answer) => {
      if (answer.toLowerCase() === 'o' || answer.toLowerCase() === 'oui' || answer === '') {
        if (updateAppJson(selectedIP)) {
          console.log('\n🎉 Configuration terminée !');
          console.log('\n📝 Prochaines étapes :');
          console.log('   1. Redémarrer l\'application Expo (appuyer sur r dans le terminal Expo)');
          console.log('   2. Vérifier que le backend est démarré sur le port 3000');
          console.log('   3. Tester la connexion depuis l\'application');
        }
      } else {
        console.log('\n❌ Configuration annulée.');
      }
      rl.close();
    });
  } else {
    rl.question(`\nQuelle IP voulez-vous utiliser ? (1-${ips.length}): `, (answer) => {
      const index = parseInt(answer) - 1;
      
      if (index >= 0 && index < ips.length) {
        const selectedIP = ips[index].address;
        
        rl.question(`\nUtiliser ${selectedIP}:3000 ? (o/n): `, (confirm) => {
          if (confirm.toLowerCase() === 'o' || confirm.toLowerCase() === 'oui' || confirm === '') {
            if (updateAppJson(selectedIP)) {
              console.log('\n🎉 Configuration terminée !');
              console.log('\n📝 Prochaines étapes :');
              console.log('   1. Redémarrer l\'application Expo (appuyer sur r dans le terminal Expo)');
              console.log('   2. Vérifier que le backend est démarré sur le port 3000');
              console.log('   3. Tester la connexion depuis l\'application');
            }
          } else {
            console.log('\n❌ Configuration annulée.');
          }
          rl.close();
        });
      } else {
        console.log('\n❌ Choix invalide.');
        rl.close();
      }
    });
  }
}

main();

