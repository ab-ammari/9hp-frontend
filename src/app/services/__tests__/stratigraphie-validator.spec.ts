import {StratigraphieValidator} from "../../../../shared/validation/validator";
import {ApiStratigraphie} from "../../../../shared/objects/models/DbInterfaces";

describe("StratigraphieValidator", () => {
  let validator: StratigraphieValidator;

  beforeEach(() => {
    validator = new StratigraphieValidator();
    validator.initGraph([], []);
  });

  it("accepts acyclic temporal relations", () => {
    const relA: ApiStratigraphie = {
      stratigraphie_uuid: "rel-A",
      is_contemporain: false,
      live: true,
      us_anterieur: "US-1",
      us_posterieur: "US-2"
    };
    expect(validator.applyRelation(relA).ok).toBeTrue();

    const relB: ApiStratigraphie = {
      stratigraphie_uuid: "rel-B",
      is_contemporain: false,
      live: true,
      us_anterieur: "US-2",
      us_posterieur: "US-3"
    };
    expect(validator.applyRelation(relB).ok).toBeTrue();

    const stats = validator.stats();
    expect(stats.edges).toBe(2);
    expect(stats.components).toBeGreaterThan(0);
  });

  it("rejects cycles created by temporal relations", () => {
    const relA: ApiStratigraphie = {
      stratigraphie_uuid: "rel-A",
      is_contemporain: false,
      live: true,
      us_anterieur: "US-10",
      us_posterieur: "US-20"
    };
    expect(validator.applyRelation(relA).ok).toBeTrue();

    const relB: ApiStratigraphie = {
      stratigraphie_uuid: "rel-B",
      is_contemporain: false,
      live: true,
      us_anterieur: "US-20",
      us_posterieur: "US-30"
    };
    expect(validator.applyRelation(relB).ok).toBeTrue();

    const relCycle: ApiStratigraphie = {
      stratigraphie_uuid: "rel-cycle",
      is_contemporain: false,
      live: true,
      us_anterieur: "US-30",
      us_posterieur: "US-10"
    };
    const result = validator.validateRelation(relCycle);
    expect(result.ok).toBeFalse();
    if (!result.ok) {
      expect(result.reason).toBe("CYCLE_DETECTED");
    }
  });

  it("rejects contemporaneity that violates existing order", () => {
    const relA: ApiStratigraphie = {
      stratigraphie_uuid: "rel-A",
      is_contemporain: false,
      live: true,
      us_anterieur: "US-alpha",
      us_posterieur: "US-beta"
    };
    expect(validator.applyRelation(relA).ok).toBeTrue();

    const contemp: ApiStratigraphie = {
      stratigraphie_uuid: "rel-contemp",
      is_contemporain: true,
      live: true,
      us_anterieur: "US-alpha",
      us_posterieur: "US-beta"
    };
    const result = validator.validateRelation(contemp);
    expect(result.ok).toBeFalse();
    if (!result.ok) {
      expect(result.reason).toBe("PRESENT_CONFLICT");
    }
  });
});
