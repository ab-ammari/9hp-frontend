#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

// Lecture de la version depuis package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Vérifier que le dossier dist/Castor existe
const distPath = path.join(__dirname, '..', 'dist', 'Castor');
if (!fs.existsSync(distPath)) {
  console.error('❌ Error: dist/Castor folder not found!');
  console.error('Please run "npm run build-prod" first.');
  process.exit(1);
}

// Vérifier que le build contient bien la version (via index.html ou main.js)
const indexPath = path.join(distPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ Error: index.html not found in dist/Castor!');
  console.error('The build seems incomplete. Please run "npm run build-prod" again.');
  process.exit(1);
}

console.log(`✅ Build found for version: ${version}`);

// Interface pour les prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Gérer Ctrl+C proprement
process.on('SIGINT', () => {
  console.log('\n\n❌ Deployment cancelled by user.');
  rl.close();
  process.exit(0);
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  try {
    // Confirmation d'envoi
    await question(`Send ${version} to repo ? (Press Enter to continue, Ctrl+C to cancel)`);

    console.log('Sending...');
    execSync(
      `aws s3 sync dist/Castor s3://castor-versions/production/${version} --cache-control max-age=86400,s-maxage=86400 --profile castor`,
      { stdio: 'inherit' }
    );

    console.log('\n✅ Version uploaded successfully!');

    // Demander si on synchronise vers ALPHA
    const answer = await question('\nSend new version to ALPHA ? (y/n default: n) ');
    if (answer.toLowerCase() === 'y') {
      const syncAlphaScript = path.join(__dirname, 'syncToAlpha.js');
      execSync(`node "${syncAlphaScript}"`, { stdio: 'inherit' });
    }

    await question('Press any key to exit...');
    rl.close();
  } catch (error) {
    console.error('Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
