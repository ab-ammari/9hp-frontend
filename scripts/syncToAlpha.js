#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

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
    console.log('\n📋 Available versions:');
    const output = execSync('aws s3 ls s3://castor-versions/production/ --profile castor', { encoding: 'utf8' });
    
    // Extraire uniquement les versions (lignes avec PRE)
    const versions = output.split('\n')
      .filter(line => line.includes('PRE'))
      .map(line => line.match(/PRE (.+)\//)?.[1])
      .filter(Boolean);
    
    // Afficher les 10 dernières versions
    console.log(versions.slice(-10).join(', '));

    const version = await question('\nWhich version should be on the ALPHA server ? ');
    
    if (!version || version.trim() === '') {
      console.log('No version specified. Aborting...');
      rl.close();
      process.exit(0);
    }

    console.log('\n🔄 Syncing to ALPHA...');
    execSync(
      `aws s3 sync s3://castor-versions/production/${version.trim()} s3://castor-aplha --delete --acl public-read --profile castor`,
      { stdio: 'inherit' }
    );

    console.log('\n🔄 Invalidating CloudFront cache...');
    execSync(
      'aws cloudfront create-invalidation --distribution-id E2EUU2SV4CR3WN --paths "/*" --profile castor',
      { stdio: 'inherit' }
    );
    console.log('\n✅ ALPHA deployment complete!');

    await question('\nPress Enter to exit...');
    rl.close();
  } catch (error) {
    console.error('Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
