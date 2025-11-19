# Architecture de la Base de Données - Castor

## Vue d'ensemble

Castor utilise **IndexedDB** via **Dexie.js** pour stocker les données localement dans le navigateur. L'architecture est conçue pour fonctionner en mode **offline-first** avec synchronisation bidirectionnelle avec le backend.

---

## 📦 Les Deux Bases de Données

Le projet utilise **deux bases IndexedDB distinctes** :

### 1. **REF** (Castordb) - Base de Données Principale
**Fichier:** `src/app/Database/castordb.ts`

Cette base contient toutes les données métier du projet archéologique :

#### **Tables d'Objets Principaux**
- `projet` - Projets archéologiques
- `secteur` - Secteurs de fouille
- `us` - Unités Stratigraphiques (avec variantes : us_positive, us_negative, us_bati, us_construite, us_technique, us_squelette, us_construite_materiel, us_sous_division)
- `fait` - Faits archéologiques
- `section` - Sections/Coupes/Sondages
- `topo` - Relevés topographiques
- `ensemble` - Ensembles archéologiques
- `contenant` - Contenants physiques
- `echantillon` - Échantillons (mobilier + prélèvement)
- `document` - Documents (photos + minutes)
- `gps` - Points GPS
- `mouvement` - Mouvements d'objets
- `phase` - Phases chronologiques
- `stratigraphie` - Relations stratigraphiques

#### **Tables de Relations (Links)**
Gèrent les relations many-to-many entre objets :
- `document_echantillon`, `document_fait`, `document_section`, `document_us`
- `ensemble_document`, `ensemble_fait`, `ensemble_us`
- `topo_document`, `topo_echantillon`, `topo_ensemble`, `topo_fait`, `topo_section`, `topo_us`
- `section_ensemble`, `section_fait`, `section_us`
- `secteur_gps`, `contenant_echantillon`

#### **Tables de Métadonnées**
- `type` - Types configurables (nature, matériau, etc.)
- `file` - Métadonnées des fichiers uploadés

**Schéma:** Défini dans `src/app/Database/schema.ts` (variable `castor_schema`)

---

### 2. **SESSION** (Sessiondb) - Base de Session Utilisateur
**Fichier:** `src/app/Database/sessiondb.ts`

Cette base contient les données de session et de cache :

#### **Tables**
- `user` - Informations de l'utilisateur connecté (ApiUser)
- `projet_index` - Index des projets avec métadonnées de synchronisation (ApiProjectIndex)

**Schéma:** Défini dans `src/app/Database/schema.ts` (variable `session_schema`)

---

## 🔄 Architecture de Synchronisation

### Principe Offline-First

1. **Création locale** : Les modifications sont d'abord enregistrées localement avec `draft: true`
2. **Queue de synchronisation** : Les objets draft sont mis en file d'attente
3. **Synchronisation automatique** : Envoi au backend quand la connexion est disponible
4. **Confirmation** : Passage à `draft: false` après succès

### Composants Clés

#### **CastorSyncService** (`src/app/services/castor-sync.service.ts`)
Service principal de synchronisation :

- **Main Tab Lock** : Utilise localStorage pour désigner un seul onglet comme "main tab" responsable de la sync
- **Timer de synchronisation** : Vérifie toutes les 200ms si des données doivent être synchronisées
- **Fetch des données distantes** : Récupère les objets manquants depuis le backend via `project_index`
- **Upload des drafts** : Envoie les modifications locales au backend
- **Gestion des fichiers S3** : Upload direct des fichiers vers AWS S3

**Flux de synchronisation :**
```
1. Timer (200ms) vérifie si isMainTab && online && hasData
2. Si objectsToFetch > 0 → syncIndexedProjects()
3. Si archive.pending > 0 → startSync()
4. Récupération par batch de 100 objets
5. Validation et mise à jour de l'index local
```

#### **ProjectIndexStore** (`src/app/Database/project-index-store.ts`)
Gère l'index des objets par projet :

- **Index structure** : Liste des `ApiSyncableObjectIndex` (key, value, created, table)
- **Détection des objets manquants** : Compare l'index distant avec les données locales
- **Gestion des erreurs** : Marque les objets corrompus dans l'index
- **Nettoyage** : Suppression des données d'un projet via `clearIndex()`

#### **NetworkManager** (`src/app/util/network-manager.ts`)
Gestion de la connectivité réseau :

- **Ping automatique** : Vérifie la connexion toutes les 10 secondes
- **RestApi** : Wrapper pour les appels HTTP vers le backend
- **Détection online/offline** : Écoute les événements navigateur

---

## 🏗️ WCore (OxyCore) - Framework de Services

**WCore** est un framework maison qui structure l'application autour d'un système d'événements et de services.

### Architecture WCore

#### **WCoreService** (`src/lib/w-core/CoreServices/w-core.service.ts`)
Gestionnaire central des services :

- **Injection de services** : Initialise et gère le cycle de vie des services
- **Event-driven** : Les services s'initialisent en réponse à des événements système
- **Service list** : Configuration des services avec leurs triggers d'initialisation

#### **WorkerService** (`src/app/services/worker.service.ts`)
Service central de communication :

- **Event Bus** : Système publish/subscribe pour les actions
- **Network calls** : Gestion centralisée des appels réseau
- **Data store** : État global de l'application (user, archive, objectsToFetch, etc.)
- **Action tracking** : Suivi des actions en cours (hasActionPending)

**Actions principales :**
```typescript
- SystemActions.init → Initialisation de l'app
- SystemActions.initRemote → Configuration réseau
- DataActions.SYNC_OBJECT → Synchronisation d'objets
- DataActions.RETRIEVE_OBJECTS → Récupération d'objets
- DataActions.RETRIEVE_PROJET_INDEX → Récupération de l'index projet
- LoginActions.LOGIN_START → Authentification
```

#### **AbstractService** (`src/lib/w-core/CoreServices/abstract.service.ts`)
Classe de base pour tous les services :

- **Triggers** : Enregistrement de callbacks sur des actions
- **Lifecycle** : Méthode `init()` appelée lors de l'initialisation

---

## 🔐 Gestion des Transactions

**Fichier:** `src/app/Database/db-transactions.ts`

### Système de Transactions Dexie

Toutes les modifications passent par des transactions pour garantir la cohérence :

```typescript
commitToDB(object) → bulkCommitToDB([object])
  ↓
mapCommitChain() // Exécution séquentielle
  ↓
simplecommitToDB() // Sélection du type de transaction
  ↓
CastorTransactions.standardObjectTransaction()
  ↓
checkTagSystemRules() // Validation des règles métier
  ↓
generateDraftObject() // Création avec draft: true
  ↓
DB.database.executeTransaction()
```

### Règles Métier (TagSystem)

Le système `TagSystem` définit des règles de validation selon la configuration du projet :

- **SECTEUR** : Les objets doivent avoir un secteur_uuid et il ne peut pas changer
- **FAIT** : Les US/Topo doivent être liés à un fait
- **MOBILIER_MATERIAU** : Les échantillons mobilier doivent avoir un type_materiaux_uuid
- **PRELEVEMENT_NATURE** : Les prélèvements doivent avoir un type_nature_uuid

**Validations automatiques :**
- `shouldBeRequiredOnCreation()` : Champs obligatoires
- `shouldBeReadOnly()` : Champs non modifiables après création
- `shouldBeSameSector()` : Cohérence des secteurs dans les relations

---

## 📡 Communication Backend

### API REST

**URL Backend :**
- Alpha: `https://api-alpha.ods-castor.com`
- Production: `https://api-prod.ods-castor.com`

**Configuration:** `src/app/util/dev.ts` (fonction `getApiUrl()`)

### Format des Échanges

**Request/Reply Pattern :**
```typescript
ApiIQ<Request, Reply> {
  event: ActionPrototype
  request: Request
  payload?: Reply
  error?: ApiError
}
```

**Batch Exchange :**
```typescript
ApiDbExchange<T> {
  data: T
  action: CREATE | UPDATE | DELETE
  status: request | success | error
}
```

### Endpoints Principaux

- `POST /` avec `LoginActions.LOGIN_START` → Authentification
- `POST /` avec `DataActions.SYNC_OBJECT` → Synchronisation d'objets
- `POST /` avec `DataActions.RETRIEVE_OBJECTS` → Récupération d'objets
- `POST /` avec `DataActions.RETRIEVE_PROJET_INDEX` → Récupération de l'index
- `GET /ping` → Vérification de la connexion

---

## 📂 Stockage des Fichiers

### AWS S3

**Configuration:** `src/app/util/dev.ts` (classe `Castor_AWS`)

**Buckets :**
- Staging: `castor-file-repo-staging`
- Production: `castor-file-repo-production`

**Structure :**
```
bucket/
  ├── {projet_uuid}/
  │   ├── {file_uuid}
  │   └── ...
```

**Upload :**
1. Fichier créé localement dans la table `file` avec `draft: true`
2. `CastorSyncService.saveFileToS3()` upload vers S3
3. Passage à `draft: false` après succès
4. En cas d'erreur, l'objet reste en draft pour retry

---

## 🔍 Helpers et Utilitaires

### DB Utilities (`src/app/Database/db-utils.ts`)

- `storeCastorObject()` : Sauvegarde intelligente d'un objet (création ou mise à jour)
- `generateDraftObject()` : Crée un nouvel objet avec timestamp et draft flag
- `generateDraftLink()` : Crée un nouveau lien
- `returnObject()` : Récupère un objet par UUID
- `returnCurrentObjectVersion()` : Récupère la version actuelle d'un objet

### Wrappers de Tables

- **dbObject** (`db-object.ts`) : Wrapper pour les tables d'objets
- **dbLink** (`db-link.ts`) : Wrapper pour les tables de relations
- **dbType** (`db-type.ts`) : Wrapper pour les types
- **dbFile** (`db-file.ts`) : Wrapper pour les fichiers

---

## 🚀 Cycle de Vie d'un Objet

### Création

```
1. User crée un objet dans l'UI
   ↓
2. commitToDB(object)
   ↓
3. Validation des règles métier (TagSystem)
   ↓
4. generateDraftObject() → draft: true, created: Date.now()
   ↓
5. Sauvegarde dans IndexedDB (REF)
   ↓
6. Event DatabaseChangeType.Create émis
   ↓
7. CastorSyncService détecte le draft
   ↓
8. Ajout à archive.pending
   ↓
9. startSync() envoie au backend (batch de 10)
   ↓
10. Backend répond success
   ↓
11. storeCastorObject() avec draft: false
   ↓
12. Objet synchronisé ✓
```

### Récupération depuis le Backend

```
1. Backend envoie ApiProjectIndex avec liste d'objets
   ↓
2. ProjectIndexStore.saveIndex() enregistre l'index
   ↓
3. checkIndex() compare avec données locales
   ↓
4. Objets manquants ajoutés à objectsToFetch
   ↓
5. syncIndexedProjects() récupère par batch de 100
   ↓
6. DataActions.RETRIEVE_OBJECTS envoyé au backend
   ↓
7. Backend répond avec les objets
   ↓
8. storeCastorObject() sauvegarde localement
   ↓
9. Si document → récupération du fichier depuis S3
   ↓
10. Données synchronisées ✓
```

---

## 🛠️ DevMode - Import/Export

### Fonctionnalités de Debug

**Fichier:** `src/app/Components/widgets/dev-tools-interface/`

**Export :**
- Exporte les deux bases (REF + SESSION)
- Format JSON avec version et timestamp
- Téléchargement automatique du fichier

**Import :**
- Warning avant écrasement
- Suppression complète des bases existantes
- Recréation avec les données importées
- Redémarrage automatique de l'application

**Utilisation :**
1. Taper "devmode" dans l'application
2. Cliquer sur le bouton FAB (icône outils)
3. Utiliser les boutons "Export DB" / "Import DB"

---

## 📊 Schéma de Données

### Structure d'un ApiSyncable

```typescript
interface ApiSyncable {
  table: ApiDbTable           // Type de table
  created: number             // Timestamp de création
  updated: number             // Timestamp de dernière modification
  user_uuid: string           // UUID de l'utilisateur
  projet_uuid: string         // UUID du projet
  draft: boolean              // Flag de synchronisation
  live: boolean               // Objet actif ou archivé
  error?: Array<unknown>      // Erreurs de synchronisation
}
```

### Index de Synchronisation

```typescript
interface ApiSyncableObjectIndex {
  key: string                 // Nom de la clé primaire
  value: string               // Valeur de la clé
  created: number             // Timestamp
  table: ApiDbTable           // Type de table
  projet_uuid: string         // UUID du projet
  error?: unknown             // Erreur éventuelle
}

interface ApiProjectIndex {
  projet_uuid: string
  amount_objects: number      // Nombre total d'objets
  last_updated: number        // Dernière mise à jour
  index: Array<ApiSyncableObjectIndex>
}
```

---

## 🔧 Configuration et Environnements

### Niveaux d'Environnement

```typescript
enum EnvLevel {
  local = "local"      // localhost
  alpha = "alpha"      // alpha.ods-castor.com
  beta = "beta"        // (utilise l'API prod)
  prod = "prod"        // Production
}
```

**Détection automatique** basée sur `location.hostname`

### Auth0

Configuration différente selon l'environnement :
- **Alpha/Local** : `dev-v-dwdue8.eu.auth0.com`
- **Production** : `ods-castor-production.eu.auth0.com`

---

## 📝 Logs et Debugging

### Système de Logs (ngx-wcore)

```typescript
LOG.debug.log({...CONTEXT, action: 'actionName'}, data)
LOG.info.log({...CONTEXT, action: 'actionName'}, data)
LOG.warn.log({...CONTEXT, action: 'actionName'}, data)
LOG.error.log({...CONTEXT, action: 'actionName'}, data)
```

**LoggerContext :**
```typescript
const CONTEXT: LoggerContext = {
  origin: 'ServiceName',
  action?: 'methodName',
  message?: 'description'
}
```

### Debugging IndexedDB

**Chrome DevTools :**
1. Application → Storage → IndexedDB
2. Voir les bases REF et SESSION
3. Inspecter les tables et données

**Export pour Debug :**
1. Activer DevMode
2. Exporter la DB du client
3. Importer localement pour reproduire le contexte

---

## 🎯 Bonnes Pratiques

### Création d'Objets

✅ **À faire :**
- Toujours utiliser `commitToDB()` ou `bulkCommitToDB()`
- Respecter les règles TagSystem du projet
- Vérifier les champs obligatoires

❌ **À éviter :**
- Modification directe dans IndexedDB
- Bypass des transactions
- Modification des champs read-only

### Synchronisation

✅ **À faire :**
- Laisser le système gérer la sync automatiquement
- Vérifier `draft: false` pour confirmer la sync
- Gérer les erreurs de sync dans l'UI

❌ **À éviter :**
- Forcer la sync manuellement
- Supprimer des objets draft
- Ignorer les erreurs de sync

### Performance

✅ **À faire :**
- Utiliser les transactions pour les opérations groupées
- Limiter les requêtes avec `.limit()` et `.offset()`
- Utiliser les index Dexie pour les recherches

❌ **À éviter :**
- Charger toutes les données d'un coup
- Requêtes sans index
- Transactions trop longues

---

## 🔗 Dépendances Principales

- **Dexie** (`^4.0.8`) : Wrapper IndexedDB
- **dexie-observable** (`^4.0.1-beta.13`) : Système d'événements pour Dexie
- **ngx-indexed-db** (`^9.1.2`) : Intégration Angular (legacy)
- **wcore-shared** (`^1.3.3`) : Types et actions partagés
- **aws-sdk** (`^2.1191.0`) : Upload S3

---

## 📚 Ressources

- **Dexie Documentation** : https://dexie.org/
- **IndexedDB API** : https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **Angular** : https://angular.io/
- **Ionic Framework** : https://ionicframework.com/

---

## 🆘 Troubleshooting

### La synchronisation ne fonctionne pas

1. Vérifier la connexion réseau (NetworkManager.status)
2. Vérifier que l'onglet est le "main tab" (CastorSyncService.isMainTab)
3. Vérifier les logs pour les erreurs de sync
4. Vérifier que `draft: true` sur les objets à synchroniser

### Données manquantes

1. Vérifier l'index du projet (projet_index table)
2. Forcer une récupération de l'index depuis le backend
3. Vérifier les objets marqués en erreur dans l'index
4. Exporter la DB et analyser le contenu

### Erreurs de transaction

1. Vérifier les règles TagSystem du projet
2. Vérifier les champs obligatoires
3. Vérifier les relations (secteur, fait, us)
4. Consulter les logs de `db-transactions.ts`

### Performance lente

1. Vérifier le nombre d'objets dans la DB
2. Nettoyer les projets inutilisés (clearIndex)
3. Limiter les requêtes avec pagination
4. Utiliser les index Dexie appropriés
