import {Component, OnDestroy, OnInit} from "@angular/core";
import {ApiStratigraphie} from "../objects/models/DbInterfaces";
import {StratigraphieClient} from "./strati-client";

/**
 * Demonstrates how to wire the stratigraphie validator worker inside an Angular component.
 */
@Component({
  selector: "app-strati-validator-demo",
  template: `
    <section>
      <h2>Stratigraphie validator demo</h2>
      <button (click)="validateSample()">Validate sample relation</button>
      <p *ngIf="lastResult">{{ lastResult }}</p>
    </section>
  `
})
export class StratigraphieValidatorDemoComponent implements OnInit, OnDestroy {
  lastResult: string | null = null;
  private client: StratigraphieClient | null = null;

  async ngOnInit(): Promise<void> {
    const workerUrl = new URL("./strati-worker.ts", import.meta.url);
    this.client = StratigraphieClient.fromUrl(workerUrl);
    await this.client.init([], []);
  }

  async validateSample(): Promise<void> {
    if (!this.client) {
      return;
    }
    const relation: ApiStratigraphie = {
      stratigraphie_uuid: "demo-rel",
      live: true,
      is_contemporain: false,
      us_anterieur: "US-demo-1",
      us_posterieur: "US-demo-2"
    };
    const result = await this.client.validateRelation(relation);
    this.lastResult = result.ok ? "Relation valide" : `Erreur: ${result.reason}`;
  }

  ngOnDestroy(): void {
    this.client?.terminate();
    this.client = null;
  }
}
