# Menu Paramètres Techniques - Documentation

## Vue d'ensemble

Un nouveau menu de configuration technique accessible à **tous les utilisateurs** (pas seulement en DevMode) a été ajouté dans le header de l'application.

## Accès

**Icône d'engrenage** dans le header principal (en haut à droite, à côté du nom du projet)

```
┌─────────────────────────────────────────────────┐
│ [☰] Nom du Projet [⚙️] ODS Castor V: 1.0.78   │
└─────────────────────────────────────────────────┘
```

Cliquer sur l'icône ⚙️ ouvre le modal "Paramètres Techniques"

## Fonctionnalités Actuelles

### Section : Validation Stratigraphique

#### 1. **Activer la validation**
- **Type** : Toggle ON/OFF
- **Par défaut** : ✅ ON
- **Description** : Active/désactive la détection des paradoxes stratigraphiques
- **Impact** : Si désactivé, aucune validation n'est possible

#### 2. **Validation automatique**
- **Type** : Toggle ON/OFF
- **Par défaut** : ❌ OFF
- **Visible** : Seulement si "Activer la validation" est ON
- **Description** : Valide automatiquement au chargement des listes
- **Recommandation** : Activer seulement pour petits projets (< 50 relations)

#### 3. **Afficher icône stratigraphie**
- **Type** : Toggle ON/OFF
- **Par défaut** : ❌ OFF
- **Description** : Affiche une icône 🔗 sur les US ayant des relations stratigraphiques
- **Visible** : Dans les listes d'US

### Section : Autres Paramètres
- **Placeholder** pour futures fonctionnalités
- Prêt à accueillir d'autres options techniques

## Actions Disponibles

### Bouton "Réinitialiser"
- Remet tous les paramètres à leurs valeurs par défaut
- Couleur : Warning (orange)
- Position : Footer gauche

### Bouton "Fermer"
- Ferme le modal
- Couleur : Primary (bleu)
- Position : Footer droite

## Fichiers Créés/Modifiés

### Nouveaux Fichiers
1. `src/app/Components/widgets/technical-settings/technical-settings.component.ts`
2. `src/app/Components/widgets/technical-settings/technical-settings.component.html`
3. `src/app/Components/widgets/technical-settings/technical-settings.component.scss`

### Fichiers Modifiés
1. `src/app/components-nav/split-pane-menu/split-pane-menu.component.ts`
   - Import `TechnicalSettingsComponent`
   - Ajout `ModalController`
   - Méthode `openTechnicalSettings()`

2. `src/app/components-nav/split-pane-menu/split-pane-menu.component.html`
   - Ajout bouton ⚙️ dans le header

3. `src/app/app.module.ts`
   - Déclaration automatique du composant

## Interface Utilisateur

### Modal
```
┌────────────────────────────────────────┐
│ Paramètres Techniques            [✕]  │
├────────────────────────────────────────┤
│                                        │
│ ┌────────────────────────────────────┐│
│ │ 🔗 Validation Stratigraphique     ││
│ │ Contrôle de la validation...      ││
│ ├────────────────────────────────────┤│
│ │ Activer la validation         [✓] ││
│ │ Détecte les paradoxes...           ││
│ │                                    ││
│ │ Validation automatique        [ ] ││
│ │ Valide automatiquement...          ││
│ │                                    ││
│ │ 💡 Utilisez le bouton "Valider"... ││
│ │                                    ││
│ │ Afficher icône stratigraphie  [ ] ││
│ │ Affiche une icône sur les US...    ││
│ └────────────────────────────────────┘│
│                                        │
│ ┌────────────────────────────────────┐│
│ │ 🔧 Autres Paramètres              ││
│ │ Fonctionnalités à venir           ││
│ ├────────────────────────────────────┤│
│ │ ⏱️ D'autres options techniques...  ││
│ └────────────────────────────────────┘│
│                                        │
├────────────────────────────────────────┤
│ [🔄 Réinitialiser]    [✓ Fermer]     │
└────────────────────────────────────────┘
```

## Stockage des Paramètres

Tous les paramètres sont stockés dans `localStorage` :

```typescript
localStorage.getItem('enableStratiValidation')  // 'true' | 'false'
localStorage.getItem('autoStratiValidation')    // 'true' | 'false'
localStorage.getItem('showStratiIcon')          // 'true' | 'false'
```

**Persistance** : Les paramètres sont conservés entre les sessions

## Valeurs par Défaut

```typescript
{
  enableStratiValidation: true,   // Validation activée
  autoStratiValidation: false,    // Mais manuelle par défaut
  showStratiIcon: false           // Icône cachée
}
```

## Comportement

### Cascade de Désactivation
Si l'utilisateur désactive "Activer la validation" :
- ✅ Le toggle "Validation automatique" se désactive automatiquement
- ✅ Le toggle "Validation automatique" disparaît de l'interface
- ✅ Message d'avertissement s'affiche

### Messages Contextuels

**Validation désactivée :**
```
⚠️ La validation est désactivée. Les paradoxes ne seront pas détectés.
```

**Validation manuelle (recommandé) :**
```
💡 Utilisez le bouton "Valider" dans les listes pour valider manuellement.
```

**Validation automatique :**
```
✅ La validation se lance automatiquement. Recommandé pour les petits projets (< 50 relations).
```

## Avantages

### Pour les Utilisateurs
✅ **Accessible** : Pas besoin de taper "devmode"
✅ **Intuitif** : Interface claire avec descriptions
✅ **Sécurisé** : Valeurs par défaut optimales
✅ **Flexible** : Chacun peut adapter selon ses besoins

### Pour les Développeurs
✅ **Extensible** : Section "Autres Paramètres" prête
✅ **Maintenable** : Code propre et séparé
✅ **Réutilisable** : Composant modal standard

## Futures Extensions Possibles

### Paramètres Techniques Potentiels
- [ ] Taille des batches de synchronisation
- [ ] Timeout des validations
- [ ] Niveau de logs (debug, info, warn, error)
- [ ] Activation/désactivation du cache
- [ ] Mode offline forcé
- [ ] Fréquence de synchronisation
- [ ] Compression des exports
- [ ] Qualité des images uploadées

### Améliorations UI
- [ ] Recherche dans les paramètres
- [ ] Catégories pliables/dépliables
- [ ] Import/Export de configuration
- [ ] Profils de configuration prédéfinis

## Compatibilité

- ✅ **Mobile** : Responsive, fonctionne sur tous les écrans
- ✅ **Desktop** : Interface adaptée
- ✅ **Tablette** : Optimisé

## Tests Recommandés

### Scénario 1 : Utilisateur Standard
1. Cliquer sur ⚙️ dans le header
2. Vérifier que les valeurs par défaut sont correctes
3. Modifier un paramètre
4. Fermer et rouvrir → Vérifier persistance

### Scénario 2 : Désactivation Cascade
1. Activer "Validation automatique"
2. Désactiver "Activer la validation"
3. Vérifier que "Validation automatique" se désactive
4. Réactiver "Activer la validation"
5. Vérifier que "Validation automatique" reste OFF

### Scénario 3 : Réinitialisation
1. Modifier tous les paramètres
2. Cliquer sur "Réinitialiser"
3. Vérifier retour aux valeurs par défaut

## Migration depuis DevMode

Les utilisateurs qui utilisaient DevMode pour ces paramètres peuvent maintenant :
1. Utiliser le menu ⚙️ accessible à tous
2. DevMode reste disponible pour les paramètres avancés (API URL, DB reset, etc.)

**Séparation claire :**
- **Menu ⚙️** : Paramètres utilisateur courants
- **DevMode** : Paramètres développeur/debug

## Code Exemple

### Ouvrir le Modal Programmatiquement
```typescript
import { TechnicalSettingsComponent } from './path/to/technical-settings.component';
import { ModalController } from '@ionic/angular';

async openSettings() {
  const modal = await this.modalController.create({
    component: TechnicalSettingsComponent,
    cssClass: 'technical-settings-modal'
  });
  await modal.present();
}
```

### Lire les Paramètres
```typescript
const validationEnabled = localStorage.getItem('enableStratiValidation') !== 'false';
const autoValidation = localStorage.getItem('autoStratiValidation') === 'true';
const showIcon = localStorage.getItem('showStratiIcon') === 'true';
```

## Support

En cas de problème :
1. Ouvrir le menu ⚙️
2. Cliquer sur "Réinitialiser"
3. Si le problème persiste, contacter le support avec :
   - Capture d'écran du menu
   - Valeurs actuelles des paramètres
   - Description du comportement attendu vs observé
