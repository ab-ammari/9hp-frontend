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
    console.log('\n⚠️  WARNING: You are about to deploy to PRODUCTION!');
    await question('Are you sure BETA is ready for PROD? (Press Enter to continue, Ctrl+C to cancel) ');

    const password = await question('\nType PRODUCTION in capital letters to confirm: ');

    if (password !== 'PRODUCTION') {
      console.log(`\n❌ You wrote: "${password}"`);
      console.log('Deployment aborted.');
      rl.close();
      process.exit(0);
    }

    console.log('\n🚀 Deploying BETA to PRODUCTION...');
    execSync(
      'aws s3 sync s3://castor-beta s3://castor-prod --acl public-read --cache-control max-age=86400,s-maxage=86400 --delete --profile castor',
      { stdio: 'inherit' }
    );

    console.log('\n🔄 Invalidating CloudFront cache (PRODUCTION)...');
    execSync(
      'aws cloudfront create-invalidation --distribution-id E2KHFQ7GLHPXZ6 --paths "/*" --profile castor',
      { stdio: 'inherit' }
    );
    console.log('\n✅ PRODUCTION deployment complete!');

    await question('\nPress Enter to exit...');
    rl.close();
  } catch (error) {
    console.error('Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
