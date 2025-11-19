# Scripts de déploiement AWS

Tous les scripts sont maintenant en Node.js et compatibles Mac et Windows.

## Scripts disponibles

### 1. Déploiement d'une nouvelle version
```bash
npm run deployVersion
```
- Compile le projet en mode production
- Lit la version depuis `package.json`
- Upload vers `s3://castor-versions/production/{version}`
- Propose de synchroniser vers ALPHA

### 2. Synchronisation vers ALPHA
```bash
npm run syncAlpha
```
- Liste les versions disponibles
- Demande quelle version déployer
- Synchronise vers `s3://castor-aplha`
- Invalide le cache CloudFront (E2EUU2SV4CR3WN)

### 3. Synchronisation vers BETA
```bash
npm run syncBeta
```
- Liste les versions disponibles
- Demande quelle version déployer
- Synchronise vers `s3://castor-beta`
- Invalide le cache CloudFront (E3G7EOS34QN44A)

### 4. Synchronisation vers PRODUCTION
```bash
npm run syncPROD
```
- Demande confirmation (écrire "PRODUCTION" en majuscules)
- Synchronise BETA → PRODUCTION (`s3://castor-prod`)
- Invalide le cache CloudFront (E2KHFQ7GLHPXZ6)

## Prérequis

- Node.js installé
- AWS CLI configuré avec le profil `castor`
- Credentials AWS valides

## Anciens scripts

Les scripts bash (`.sh`) sont conservés pour référence mais ne sont plus utilisés :
- `SendToAWS.sh` → remplacé par `SendToAWS.js`
- `syncToAlpha.sh` → remplacé par `syncToAlpha.js`
- `syncToBeta.sh` → remplacé par `syncToBeta.js`
- `syncToPRODUCTION.sh` → remplacé par `syncToPRODUCTION.js`

Le fichier `cli.js` à la racine n'est également plus utilisé.
