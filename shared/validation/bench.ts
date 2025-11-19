declare const require: any;
declare const module: any;

import {StratigraphieValidator} from "./validator";
import {ApiStratigraphie} from "../objects/models/DbInterfaces";

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function randomUuid(prefix: string, i: number): string {
  return `${prefix}-${i}`;
}

export function runBenchmark(samples = 1000): void {
  const validator = new StratigraphieValidator();
  const nodes: string[] = [];
  for (let i = 0; i < samples; i++) {
    nodes.push(randomUuid("US", i));
  }

  const relations: ApiStratigraphie[] = [];
  for (let i = 0; i < samples - 1; i++) {
    relations.push({
      stratigraphie_uuid: randomUuid("rel", i),
      live: true,
      is_contemporain: false,
      us_anterieur: nodes[i],
      us_posterieur: nodes[i + 1]
    });
  }

  let t0 = now();
  validator.initGraph(nodes, relations);
  const initDuration = now() - t0;

  const additions: ApiStratigraphie[] = [];
  for (let i = 0; i < 10; i++) {
    const a = Math.floor(Math.random() * (samples - 2));
    additions.push({
      stratigraphie_uuid: randomUuid("rel-add", i),
      live: true,
      is_contemporain: false,
      us_anterieur: nodes[a],
      us_posterieur: nodes[a + 2]
    });
  }

  t0 = now();
  additions.forEach(rel => validator.applyRelation(rel));
  const diffDuration = now() - t0;

  const randomIndex = Math.floor(Math.random() * (samples - 1));
  const validateResult = validator.validateRelation({
    stratigraphie_uuid: "cycle-test",
    live: true,
    is_contemporain: false,
    us_anterieur: nodes[randomIndex + 1],
    us_posterieur: nodes[randomIndex]
  });

  // eslint-disable-next-line no-console
  console.table({
    initMs: initDuration,
    diffMs: diffDuration,
    validateOk: validateResult.ok
  });
}

if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  runBenchmark();
}
