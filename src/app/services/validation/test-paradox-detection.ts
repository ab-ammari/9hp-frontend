/**
 * ============================================================
 * TESTS POUR LES NOUVEAUX CAS DE DÉTECTION DE PARADOXES
 * ============================================================
 * 
 * Ces tests illustrent les cas qui étaient non traités auparavant
 * et qui sont maintenant détectés grâce aux groupes de contemporanéité.
 */

import { ContemporaneityGroupManager, StratigraphicRelation, EntityInfo } from './contemporaneity-group-manager';

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function makeEntity(uuid: string, type: 'US' | 'FAIT', faitUuid?: string): EntityInfo {
  return { uuid, type, faitUuid };
}

function makeTemporalRelation(
  uuid: string,
  anterieur: EntityInfo,
  posterieur: EntityInfo
): StratigraphicRelation {
  return {
    uuid,
    anterieur,
    posterieur,
    isContemporain: false,
    live: true
  };
}

function makeContemporaneityRelation(
  uuid: string,
  entity1: EntityInfo,
  entity2: EntityInfo
): StratigraphicRelation {
  return {
    uuid,
    anterieur: entity1,
    posterieur: entity2,
    isContemporain: true,
    live: true
  };
}

// ============================================================
// TEST SETUP : Reproduire le scénario de l'utilisateur
// ============================================================

/**
 * Relations de contemporanéité :
 * groupe 1: F7 ↔ F3 ↔ F4 ↔ US10 ↔ F5
 * groupe 2: US5 ↔ F6 ↔ US11
 * 
 * Relations temporelles :
 * F3 sur US3
 * US3 sur US4
 * US4 sur US5
 * F6 sur US18
 */

function setupTestScenario(): {
  manager: ContemporaneityGroupManager;
  entities: Record<string, EntityInfo>;
} {
  const manager = new ContemporaneityGroupManager();
  
  // Définir les entités
  const entities = {
    // Faits
    F3: makeEntity('fait-3', 'FAIT'),
    F4: makeEntity('fait-4', 'FAIT'),
    F5: makeEntity('fait-5', 'FAIT'),
    F6: makeEntity('fait-6', 'FAIT'),
    F7: makeEntity('fait-7', 'FAIT'),
    // US
    US3: makeEntity('us-3', 'US'),
    US4: makeEntity('us-4', 'US'),
    US5: makeEntity('us-5', 'US'),
    US10: makeEntity('us-10', 'US'),
    US11: makeEntity('us-11', 'US'),
    US18: makeEntity('us-18', 'US')
  };
  
  // Configurer un callback simple pour les tags
  manager.setTagCallback((uuid: string) => {
    const entry = Object.entries(entities).find(([_, e]) => e.uuid === uuid);
    return entry ? entry[0] : uuid.substring(0, 6);
  });
  
  // Construire les relations
  const relations: StratigraphicRelation[] = [
    // Groupe 1 : Relations de contemporanéité
    makeContemporaneityRelation('rel-c1', entities.F7, entities.F3),
    makeContemporaneityRelation('rel-c2', entities.F3, entities.F4),
    makeContemporaneityRelation('rel-c3', entities.F4, entities.US10),
    makeContemporaneityRelation('rel-c4', entities.US10, entities.F5),
    
    // Groupe 2 : Relations de contemporanéité
    makeContemporaneityRelation('rel-c5', entities.US5, entities.F6),
    makeContemporaneityRelation('rel-c6', entities.US5, entities.US11),
    
    // Relations temporelles
    makeTemporalRelation('rel-t1', entities.US3, entities.F3),  // F3 sur US3
    makeTemporalRelation('rel-t2', entities.US4, entities.US3), // US3 sur US4
    makeTemporalRelation('rel-t3', entities.US5, entities.US4), // US4 sur US5
    makeTemporalRelation('rel-t4', entities.US18, entities.F6)  // F6 sur US18
  ];
  
  // Initialiser le manager
  manager.rebuild(relations);
  
  return { manager, entities };
}

// ============================================================
// TEST 1 : Cas non traité - F5 sur F3 (même groupe de contemporanéité)
// ============================================================

function testCase1_SameGroupTemporalRelation(): void {
  console.log('='.repeat(60));
  console.log('TEST 1 : F5 sur F3 (même groupe de contemporanéité)');
  console.log('='.repeat(60));
  
  const { manager, entities } = setupTestScenario();
  
  // Afficher l'état initial
  console.log('\nÉtat initial des groupes :');
  const debugState = manager.getDebugState();
  debugState.groups.forEach((members, rep) => {
    console.log(`  Groupe ${rep.substring(0, 8)} : ${members.length} membres`);
  });
  
  // Tenter de créer F5 sur F3
  console.log('\nTentative de création : F5 sur F3');
  
  const validation = manager.validateTemporalRelation(
    entities.F3.uuid,  // antérieur
    entities.F5.uuid   // postérieur
  );
  
  console.log('\nRésultat de validation :');
  console.log(`  Valid: ${validation.valid}`);
  console.log(`  Error Type: ${validation.errorType}`);
  console.log(`  Message: ${validation.message}`);
  
  if (validation.debugInfo) {
    console.log('\nDebug Info :');
    console.log(`  Source Group: ${validation.debugInfo.sourceGroup.substring(0, 8)}`);
    console.log(`  Target Group: ${validation.debugInfo.targetGroup.substring(0, 8)}`);
    console.log(`  Membres du groupe: ${validation.debugInfo.sourceGroupMembers.length}`);
  }
  
  // Vérification
  if (!validation.valid && validation.errorType === 'SAME_GROUP') {
    console.log('\n✅ TEST RÉUSSI : La relation est correctement rejetée car F5 et F3 sont contemporains');
  } else {
    console.log('\n❌ TEST ÉCHOUÉ : La relation aurait dû être rejetée');
  }
}

// ============================================================
// TEST 2 : Cas non traité - F6 sur F3 (cycle indirect)
// ============================================================

function testCase2_IndirectCycle(): void {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2 : F6 sur F3 (cycle indirect via contemporanéité)');
  console.log('='.repeat(60));
  
  const { manager, entities } = setupTestScenario();
  
  // Afficher les chemins existants
  console.log('\nChemins temporels existants :');
  console.log('  F3 (G1) → US3 → US4 → US5 (G2)');
  console.log('  Où G2 = {US5, F6, US11} (contemporains)');
  
  // Tenter de créer F6 sur F3
  console.log('\nTentative de création : F6 sur F3');
  console.log('  Ceci créerait : G2 → G1');
  console.log('  Mais il existe déjà : G1 → G3 → G4 → G2');
  console.log('  Donc cycle : G1 → G3 → G4 → G2 → G1');
  
  const validation = manager.validateTemporalRelation(
    entities.F3.uuid,  // antérieur
    entities.F6.uuid   // postérieur
  );
  
  console.log('\nRésultat de validation :');
  console.log(`  Valid: ${validation.valid}`);
  console.log(`  Error Type: ${validation.errorType}`);
  console.log(`  Message: ${validation.message}`);
  
  if (validation.cycleInfo) {
    console.log('\nCycle détecté :');
    console.log(`  Path: ${validation.cycleInfo.pathTags.join(' → ')}`);
  }
  
  // Vérification
  if (!validation.valid && validation.errorType === 'CYCLE') {
    console.log('\n✅ TEST RÉUSSI : Le cycle indirect est correctement détecté');
  } else {
    console.log('\n❌ TEST ÉCHOUÉ : Le cycle aurait dû être détecté');
  }
}

// ============================================================
// TEST 3 : Cas non traité - F6 ↔ F4 (fusion créerait un paradoxe)
// ============================================================

function testCase3_MergeConflict(): void {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3 : F6 ↔ F4 (contemporanéité créerait un paradoxe)');
  console.log('='.repeat(60));
  
  const { manager, entities } = setupTestScenario();
  
  // Expliquer le problème
  console.log('\nSituation actuelle :');
  console.log('  G1 = {F7, F3, F4, US10, F5}');
  console.log('  G2 = {US5, F6, US11}');
  console.log('  G3 = {US3}');
  console.log('  G4 = {US4}');
  console.log('');
  console.log('Relations temporelles (graphe quotient) :');
  console.log('  G1 → G3 → G4 → G2');
  console.log('');
  console.log('Si on fusionne F4 (G1) avec F6 (G2) :');
  console.log('  G\' = G1 ∪ G2 = {F7, F3, F4, US10, F5, US5, F6, US11}');
  console.log('  predecessors(G\') = {G3, G4}');
  console.log('  successors(G\') = {G3, G4}');
  console.log('  INTERSECTION NON VIDE ! → Paradoxe');
  
  // Tenter de créer F6 ↔ F4
  console.log('\nTentative de création : F6 ↔ F4 (contemporanéité)');
  
  const validation = manager.validateContemporaneityRelation(
    entities.F4.uuid,
    entities.F6.uuid
  );
  
  console.log('\nRésultat de validation :');
  console.log(`  Valid: ${validation.valid}`);
  console.log(`  Error Type: ${validation.errorType}`);
  console.log(`  Message: ${validation.message}`);
  
  if (validation.existingPath) {
    console.log('\nChemin temporel existant :');
    console.log(`  ${validation.existingPath.pathTags.join(' → ')}`);
  }
  
  if (validation.conflictingGroups) {
    console.log('\nGroupes en conflit :');
    validation.conflictingGroups.forEach(g => {
      console.log(`  - ${g.substring(0, 8)}`);
    });
  }
  
  // Vérification
  if (!validation.valid) {
    console.log('\n✅ TEST RÉUSSI : La fusion est correctement rejetée');
  } else {
    console.log('\n❌ TEST ÉCHOUÉ : La fusion aurait dû être rejetée');
  }
}

// ============================================================
// TEST 4 : Relation valide - F7 sur US18
// ============================================================

function testCase4_ValidRelation(): void {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4 : F7 sur US18 (relation valide)');
  console.log('='.repeat(60));
  
  const { manager, entities } = setupTestScenario();
  
  console.log('\nTentative de création : F7 sur US18');
  console.log('  G1 (F7) → G5 (US18)');
  console.log('  Pas de chemin existant de G5 vers G1');
  console.log('  F7 et US18 ne sont pas contemporains');
  
  const validation = manager.validateTemporalRelation(
    entities.US18.uuid,  // antérieur
    entities.F7.uuid     // postérieur
  );
  
  console.log('\nRésultat de validation :');
  console.log(`  Valid: ${validation.valid}`);
  
  // Vérification
  if (validation.valid) {
    console.log('\n✅ TEST RÉUSSI : La relation valide est acceptée');
  } else {
    console.log('\n❌ TEST ÉCHOUÉ : La relation aurait dû être acceptée');
    console.log(`  Error: ${validation.message}`);
  }
}

// ============================================================
// TEST 5 : Contemporanéité invalide - US3 ↔ US18 (chemin temporel existe)
// ============================================================

function testCase5_InvalidContemporaneity(): void {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 5 : US3 ↔ US18 (contemporanéité INVALIDE - chemin temporel)');
  console.log('='.repeat(60));
  
  const { manager, entities } = setupTestScenario();
  
  console.log('\nTentative de création : US3 ↔ US18');
  console.log('  G3 = {US3}');
  console.log('  G5 = {US18}');
  console.log('  ATTENTION : Il existe un chemin temporel !');
  console.log('  US3 → US4 → US5 (↔ F6) → US18');
  
  const validation = manager.validateContemporaneityRelation(
    entities.US3.uuid,
    entities.US18.uuid
  );
  
  console.log('\nRésultat de validation :');
  console.log(`  Valid: ${validation.valid}`);
  
  // Vérification - cette relation DOIT être rejetée
  if (!validation.valid) {
    console.log('\n✅ TEST RÉUSSI : La contemporanéité invalide est correctement rejetée');
    console.log(`  Raison: ${validation.message}`);
  } else {
    console.log('\n❌ TEST ÉCHOUÉ : La contemporanéité aurait dû être rejetée');
  }
}

// ============================================================
// TEST 6 : Contemporanéité valide - US18 ↔ nouvel élément isolé
// ============================================================

function testCase6_ValidContemporaneity(): void {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 6 : US18 ↔ US99 (contemporanéité valide avec élément isolé)');
  console.log('='.repeat(60));
  
  const { manager, entities } = setupTestScenario();
  
  // Ajouter un nouvel élément isolé
  const US99 = makeEntity('us-99', 'US');
  manager.registerEntity(US99);
  
  console.log('\nTentative de création : US18 ↔ US99 (nouvel élément)');
  console.log('  G5 = {US18}');
  console.log('  G_new = {US99} (isolé, aucune relation)');
  console.log('  Pas de chemin temporel entre eux');
  
  const validation = manager.validateContemporaneityRelation(
    entities.US18.uuid,
    US99.uuid
  );
  
  console.log('\nRésultat de validation :');
  console.log(`  Valid: ${validation.valid}`);
  
  // Vérification
  if (validation.valid) {
    console.log('\n✅ TEST RÉUSSI : La contemporanéité valide est acceptée');
  } else {
    console.log('\n❌ TEST ÉCHOUÉ : La contemporanéité aurait dû être acceptée');
    console.log(`  Error: ${validation.message}`);
  }
}

// ============================================================
// EXÉCUTION DES TESTS
// ============================================================

function runAllTests(): void {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     TESTS DE DÉTECTION DES PARADOXES STRATIGRAPHIQUES      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  testCase1_SameGroupTemporalRelation();
  testCase2_IndirectCycle();
  testCase3_MergeConflict();
  testCase4_ValidRelation();
  testCase5_InvalidContemporaneity();
  testCase6_ValidContemporaneity();
  
  console.log('\n' + '='.repeat(60));
  console.log('FIN DES TESTS');
  console.log('='.repeat(60));
}

// Exporter pour utilisation
export {
  runAllTests,
  testCase1_SameGroupTemporalRelation,
  testCase2_IndirectCycle,
  testCase3_MergeConflict,
  testCase4_ValidRelation,
  testCase5_InvalidContemporaneity,
  testCase6_ValidContemporaneity,
  setupTestScenario
};
