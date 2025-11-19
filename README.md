# Castor

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 12.1.3.

## First setup

Run `git submodule init` then `git submodule update`
then `npm i`

## Development server

Run `npm start` or `npm start-max` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.
`npm start-max` allows for more memory usage if this should be an issue.

## Production

### Build
Run `npm run build-prod` to build the project. The build artifacts will be stored in the `dist/` directory.

### Deploy new version
Run `npm run deployVersion` to deploy your new version to the AWS S3 repo.
!! Don't forget to update your version in the package.json file !!

### Update alpha or Production version

To update the currently live alpha or production version use `npm run syncAlpha` and `npm run syncPROD` then specify the targeted version when prompted.


## Tests

### Suite unitaire

- `npm run ng -- test --watch=false` : exécute l’ensemble des specs Angular (dont les tests de validation stratigraphique ajoutés). La commande sort en mode batch avec un code de retour 0 si tout est vert.
- `npx ng test --code-coverage` : optionnel, génère un rapport de couverture dans `coverage/` pour suivre l’impact des nouvelles specs.

> Astuce : sous macOS/Linux, pense à exporter `CHROME_BIN=` vers une version de Chrome/Chromium installée si la détection auto échoue.


## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
