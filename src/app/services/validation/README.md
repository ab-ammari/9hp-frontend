# Amélioration de la Validation Stratigraphique

## Résumé des modifications

Ce package ajoute la détection des paradoxes stratigraphiques **indirects** via les groupes de contemporanéité.

### Problèmes résolus

| Cas | Avant | Après |
|-----|-------|-------|
| **F5 sur F3** (même groupe de contemporanéité) | ✗ Accepté | ✓ Rejeté |
| **F6 sur F3** (cycle indirect via contemporanéité) | ✗ Accepté | ✓ Rejeté |
| **F6 ↔ F4** (contemporanéité créerait un paradoxe) | ✗ Accepté | ✓ Rejeté |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 ContemporaneityGroupManager                 │
│                   (Gestionnaire principal)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐      ┌─────────────────────────────┐  │
│  │   DisjointSet   │      │    QuotientGraphManager     │  │
│  │  (Union-Find)   │      │  (Graphe entre groupes)     │  │
│  ├─────────────────┤      ├─────────────────────────────┤  │
│  │ • find(entity)  │      │ • hasPath(G1, G2)           │  │
│  │ • union(e1, e2) │      │ • wouldCreateCycle(G1, G2)  │  │
│  │ • connected()   │      │ • simulateMerge(G1, G2)     │  │
│  └─────────────────┘      └─────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Fichiers fournis

### 1. `disjoint-set.ts`
Structure Union-Find pour gérer les groupes de contemporanéité.

**Fonctionnalités :**
- `makeSet(x)` - Crée un singleton
- `find(x)` - Trouve le représentant du groupe (avec compression de chemin)
- `union(x, y)` - Fusionne deux groupes (avec union by rank)
- `connected(x, y)` - Vérifie si deux éléments sont dans le même groupe
- `getGroupMembers(x)` - Retourne tous les membres du groupe
- `simulateUnion(x, y)` - Simule une fusion sans modifier la structure

### 2. `quotient-graph-manager.ts`
Graphe orienté des relations temporelles entre groupes.

**Fonctionnalités :**
- `addEdge(from, to, relationUuid)` - Ajoute une arête temporelle
- `hasPath(from, to)` - Vérifie l'existence d'un chemin
- `findPath(from, to)` - Trouve le chemin et les relations impliquées
- `wouldCreateCycle(from, to)` - Détecte si l'ajout créerait un cycle
- `simulateMerge(G1, G2)` - Vérifie si la fusion de groupes est valide
- `getAllPredecessors(G)` - Fermeture transitive inverse
- `getAllSuccessors(G)` - Fermeture transitive

### 3. `contemporaneity-group-manager.ts`
Gestionnaire unifié qui orchestre les deux structures précédentes.

**API principale :**
```typescript
// Validation d'une relation temporelle
validateTemporalRelation(anterieurUuid, posterieurUuid): TemporalValidationResult

// Validation d'une relation de contemporanéité
validateContemporaneityRelation(entity1Uuid, entity2Uuid): ContemporaneityValidationResult

// Reconstruction complète depuis les relations
rebuild(allRelations: StratigraphicRelation[]): void
```

### 4. `castor-validation-service-modifications.ts`
Guide des modifications à apporter à votre service existant.

### 5. `test-paradox-detection.ts`
Tests illustrant les cas détectés.

---

## Intégration dans votre code

### Étape 1 : Ajouter les fichiers

Copiez les 3 fichiers de base dans votre projet :
```
src/app/services/
  ├── disjoint-set.ts
  ├── quotient-graph-manager.ts
  └── contemporaneity-group-manager.ts
```

### Étape 2 : Modifier `castor-validation.service.ts`

#### 2.1 Ajouter l'import
```typescript
import { 
  ContemporaneityGroupManager, 
  StratigraphicRelation, 
  EntityInfo 
} from './contemporaneity-group-manager';
```

#### 2.2 Ajouter les propriétés
```typescript
private groupManager = new ContemporaneityGroupManager();
private groupManagerSynced = false;
```

#### 2.3 Configurer dans le constructeur
```typescript
constructor(private w: WorkerService, private syncService: CastorSyncService) {
  // ... code existant ...
  
  // Configurer le callback pour les tags
  this.groupManager.setTagCallback((uuid: string) => {
    return this.getTagForElement(uuid);
  });
}
```

#### 2.4 Ajouter les méthodes de synchronisation
```typescript
private syncGroupManager(): void {
  const relations = this.convertToStratigraphicRelations(this.liveRelations);
  this.groupManager.rebuild(relations);
  this.groupManagerSynced = true;
}

private ensureGroupManagerSynced(): void {
  if (!this.groupManagerSynced) {
    this.syncGroupManager();
  }
}
```

#### 2.5 Modifier `rebuildCache()`
```typescript
private rebuildCache(): void {
  // ... code existant ...
  
  // Invalider le groupManager
  this.groupManagerSynced = false;
}
```

#### 2.6 Utiliser les nouvelles validations
Remplacez ou complétez vos méthodes de validation existantes avec les versions V2 fournies dans `castor-validation-service-modifications.ts`.

---

## Algorithmes clés

### Validation d'une relation temporelle

```
1. findGroup(anterieur) → Gant
2. findGroup(posterieur) → Gpost

3. SI Gant = Gpost ALORS
   → REFUSER : "Entités contemporaines"

4. SI existsPath(Gant → Gpost) ALORS
   → REFUSER : "Créerait un cycle"
   cycle = [Gpost → Gant] ∪ path(Gant → Gpost)

5. ACCEPTER
```

### Validation d'une relation de contemporanéité

```
1. findGroup(entity1) → G1
2. findGroup(entity2) → G2

3. SI G1 = G2 ALORS
   → ACCEPTER (redondant mais valide)

4. SI existsPath(G1 → G2) OU existsPath(G2 → G1) ALORS
   → REFUSER : "Chemin temporel existant"

5. SIMULER fusion G' = G1 ∪ G2
   predecessors(G') = predecessors(G1) ∪ predecessors(G2)
   successors(G') = successors(G1) ∪ successors(G2)

6. SI predecessors(G') ∩ successors(G') ≠ ∅ ALORS
   → REFUSER : "Fusion créerait un paradoxe"

7. ACCEPTER
```

---

## Complexité

| Opération | Complexité |
|-----------|------------|
| `find(entity)` | O(α(n)) ≈ O(1) amorti |
| `union(e1, e2)` | O(α(n)) ≈ O(1) amorti |
| `hasPath(G1, G2)` | O(V + E) avec cache, O(1) après |
| `validateTemporalRelation()` | O(V + E) |
| `validateContemporaneityRelation()` | O(V + E) |
| `rebuild(relations)` | O(n × (V + E)) |

Où :
- n = nombre de relations
- V = nombre de groupes
- E = nombre d'arêtes dans le graphe quotient
- α = fonction inverse d'Ackermann (pratiquement constante)

---

## Tests

Exécutez les tests pour vérifier le bon fonctionnement :

```bash
npx ts-node test-paradox-detection.ts
```

Les 6 tests couvrent :
1. **SAME_GROUP** : Relation temporelle entre contemporains
2. **CYCLE** : Cycle indirect via contemporanéité
3. **MERGE_CONFLICT** : Contemporanéité créerait un paradoxe
4. **VALID_TEMPORAL** : Relation temporelle valide
5. **INVALID_CONTEMPORANEITY** : Contemporanéité avec chemin existant
6. **VALID_CONTEMPORANEITY** : Contemporanéité valide

---

## Support

En cas de questions sur l'intégration, n'hésitez pas à demander des clarifications sur :
- La conversion de vos `ApiStratigraphie` vers `StratigraphicRelation`
- L'adaptation des messages d'erreur à votre UI
- L'optimisation pour des volumes de données spécifiques
