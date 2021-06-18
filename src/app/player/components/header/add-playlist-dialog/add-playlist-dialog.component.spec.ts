import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPlaylistDialogComponent } from './add-playlist-dialog.component';

describe('AddPlaylistDialogComponent', () => {
  let component: AddPlaylistDialogComponent;
  let fixture: ComponentFixture<AddPlaylistDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddPlaylistDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddPlaylistDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
