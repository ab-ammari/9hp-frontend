import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CastorBtnCsvDownloaderComponent } from './castor-btn-csv-downloader.component';

describe('CastorBtnCsvDownloaderComponent', () => {
  let component: CastorBtnCsvDownloaderComponent;
  let fixture: ComponentFixture<CastorBtnCsvDownloaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CastorBtnCsvDownloaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CastorBtnCsvDownloaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
