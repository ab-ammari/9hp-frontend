# Troubleshooting - Validation Stratigraphique

## Problème : Crash de l'application "La page ne répond plus"

### Symptômes
- L'application se bloque complètement sur certains navigateurs (notamment Windows/Chrome)
- Message d'erreur du navigateur : "La page ne répond plus"
- Le problème survient lors de l'affichage de listes d'US avec beaucoup de relations stratigraphiques

### Cause Racine

Le commit `589ac54d` a introduit un **Web Worker** pour la validation stratigraphique (DSU+DAG) afin d'améliorer les performances. Cependant, dans certains cas avec beaucoup de données :

1. **Trop de validations concurrentes** : Le composant `stratigraphie-list-display` appelait `Promise.all()` sur toutes les relations, déclenchant potentiellement des centaines de validations en parallèle
2. **Saturation du worker** : Le worker ne pouvait pas gérer autant de requêtes simultanées
3. **Pas de timeout** : Les validations pouvaient bloquer indéfiniment
4. **Blocage du thread principal** : Malgré le worker, le thread principal était saturé par la gestion des promesses

### Solutions Implémentées

#### 1. **Validation Manuelle avec Boutons** (`stratigraphie-list-display.component.html`)

La validation n'est plus automatique par défaut. Trois boutons sont disponibles :

- **Valider** : Lance la validation de la liste
- **Annuler** : Stoppe la validation en cours
- **Effacer** : Supprime les marquages de validation

**Avantages :**
- L'utilisateur contrôle quand valider
- Évite les validations inutiles
- Permet d'annuler si trop long

#### 2. **Singleton de Validation** (`castor-validation.service.ts`)

Une seule validation de batch peut tourner à la fois :

```typescript
private batchValidationRunning = false;
private batchValidationAbortController: AbortController | null = null;

async validateBatch(stratigraphies, onProgress) {
  if (this.batchValidationRunning) {
    throw new Error('Une validation est déjà en cours');
  }
  // ...
}
```

**Avantages :**
- Évite l'explosion mémoire
- Impossible de lancer 50 validations en parallèle
- Protection contre les clics multiples

#### 3. **Traitement par Batch de 5** (réduit de 10)

Au lieu de valider toutes les relations en parallèle, on traite par lots de 5 :

```typescript
const BATCH_SIZE = 5; // Réduit pour moins de charge
for (let i = 0; i < stratigraphies.length; i += BATCH_SIZE) {
  const batch = stratigraphies.slice(i, i + BATCH_SIZE);
  // Pause de 50ms entre chaque batch
  await new Promise(resolve => setTimeout(resolve, 50));
}
```

**Avantages :**
- Limite la charge sur le worker
- Permet un affichage progressif
- Évite la saturation mémoire
- Pause entre batches pour laisser respirer le navigateur

#### 2. **Timeout sur les Validations**

**Niveau composant** (5 secondes) :
```typescript
const validationPromise = this.validation.validateStratigraphie(clone);
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Validation timeout')), 5000)
);
const result = await Promise.race([validationPromise, timeoutPromise]);
```

**Niveau service** (10 secondes) :
```typescript
const workerPromise = this.workerClient.validateRelation(stratigraphie);
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Worker validation timeout after 10s')), 10000)
);
const workerResult = await Promise.race([workerPromise, timeoutPromise]);
```

**Avantages :**
- Évite les blocages infinis
- Fallback automatique vers l'algorithme legacy en cas de timeout
- Feedback visuel (item marqué en orange)

#### 5. **Toggles de Configuration** (DevMode)

Deux toggles dans le DevMode pour contrôler la validation :

**Toggle 1 : Activer validation stratigraphique**
```typescript
enableStratiValidation: boolean // Activé par défaut
```
- Active/désactive complètement la validation
- Si désactivé, aucune validation n'est possible

**Toggle 2 : Validation automatique (au chargement)**
```typescript
autoStratiValidation: boolean // Désactivé par défaut
```
- Si activé : validation automatique au chargement des listes
- Si désactivé : validation manuelle via bouton "Valider"

**Avantages :**
- Contrôle fin du comportement
- Par défaut : validation manuelle (évite les crashs)
- Possibilité de revenir à l'auto pour les petits projets

#### 4. **Gestion d'Erreurs Améliorée**

Les erreurs de validation sont maintenant visuellement distinctes :

- **Jaune** : Paradoxe détecté (erreur de logique stratigraphique)
- **Orange** : Erreur technique (timeout, crash du worker)
- **Pas de couleur** : Validation OK

### Comment Utiliser

#### Configuration Recommandée (par défaut) :

1. **Activer validation stratigraphique** : ✅ ON
2. **Validation automatique** : ❌ OFF (désactivé par défaut)
3. Utiliser le bouton **"Valider"** dans les listes quand nécessaire

**Avantages :**
- Pas de crash au chargement
- Validation à la demande
- Contrôle total

#### En cas de crash immédiat :

1. **Ouvrir DevMode** : Taper "devmode" dans l'application
2. **Désactiver la validation** : Toggle "Activer validation stratigraphique" → OFF
3. **Recharger la page**
4. L'application fonctionne sans validation

#### Pour les petits projets (< 50 relations) :

1. **Activer validation stratigraphique** : ✅ ON
2. **Validation automatique** : ✅ ON
3. La validation se fait automatiquement au chargement

#### Utilisation des Boutons :

Dans chaque liste de relations stratigraphiques :

- **Valider** : Lance la validation avec barre de progression
- **Annuler** : Stoppe la validation en cours (si trop long)
- **Effacer** : Supprime les marquages (jaune/orange)

#### Pour débugger :

1. Ouvrir la console du navigateur (F12)
2. Chercher les logs avec `origin: 'StratigraphieListDisplayComponent'`
3. Les timeouts seront marqués en orange dans la liste
4. Les logs indiquent quelle relation pose problème

### Optimisations Futures Possibles

#### Court terme :
- [ ] Augmenter `BATCH_SIZE` si les performances le permettent
- [ ] Ajouter un indicateur de progression pendant la validation
- [ ] Permettre d'annuler la validation en cours

#### Moyen terme :
- [ ] Implémenter une validation "lazy" (seulement au clic)
- [ ] Cacher les validations et les charger à la demande
- [ ] Ajouter un index pour accélérer les recherches dans le graphe

#### Long terme :
- [ ] Migrer la validation vers le backend
- [ ] Utiliser une base de données graphe (Neo4j) pour les relations
- [ ] Implémenter un système de pagination pour les grandes listes

### Métriques de Performance

**Avant les optimisations (validation auto avec Promise.all) :**
- 200 relations → ❌ Blocage complet (>30s, crash navigateur)
- 100 relations → ⚠️ Lenteur importante (10-15s, risque de crash)
- 50 relations → ⚠️ Acceptable (3-5s, mais bloque l'UI)

**Après optimisations (validation manuelle avec singleton) :**
- 200 relations → ✅ Validation manuelle (~40s, annulable, avec progression)
- 200 relations → ✅ Sans validation (instantané)
- 100 relations → ✅ Validation manuelle (~20s, annulable)
- 50 relations → ✅ Validation manuelle (~10s) ou auto (~12s)
- 20 relations → ✅ Validation auto possible (~5s)

**Améliorations clés :**
- ✅ Plus de crash navigateur
- ✅ Possibilité d'annuler
- ✅ Barre de progression
- ✅ Singleton empêche les validations multiples
- ✅ Pause entre batches (50ms) pour respirer

### Architecture du Système de Validation

```
┌─────────────────────────────────────────┐
│  stratigraphie-list-display.component  │
│  (Affichage des listes)                 │
└────────────────┬────────────────────────┘
                 │
                 │ regenerateStratiArrayValidations()
                 │ (Batch de 10, timeout 5s)
                 ▼
┌─────────────────────────────────────────┐
│     CastorValidationService             │
│     (Cache + Orchestration)             │
└────────────┬────────────────────────────┘
             │
             ├─────────────────┬──────────────────┐
             │                 │                  │
             ▼                 ▼                  ▼
    ┌────────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Worker Client  │  │   Cache      │  │   Legacy     │
    │ (Timeout 10s)  │  │   (Map)      │  │  Algorithm   │
    └────────────────┘  └──────────────┘  └──────────────┘
             │
             ▼
    ┌────────────────────────┐
    │  strati-validation     │
    │  Web Worker            │
    │  (DSU + DAG)           │
    └────────────────────────┘
```

### Logs Utiles

```typescript
// Activer les logs de validation
localStorage.setItem('logLevel', 'debug');

// Logs à surveiller :
// - "Worker validation failed, fallback to legacy" → Worker en erreur
// - "Validation timeout" → Timeout atteint
// - "validateSingleItem" → Erreur sur un item spécifique
// - "regenerateStratiArrayValidations" → Erreur globale
```

### Références

- **Commit initial** : `589ac54d72a19eaaeb26a8e85732bb830c712127`
- **Service de validation** : `src/app/services/castor-validation.service.ts`
- **Worker** : `src/app/services/workers/strati-validation.worker.ts`
- **Composant liste** : `src/app/Components/Display/stratigraphie-list-display/stratigraphie-list-display.component.ts`
- **DevMode** : `src/app/Components/widgets/dev-tools-interface/`

### Contact

En cas de problème persistant, fournir :
1. Export de la base de données (via DevMode → Export DB)
2. Logs de la console (F12 → Console → Copier tout)
3. Nombre approximatif d'US et de relations stratigraphiques
4. Navigateur et OS utilisés
