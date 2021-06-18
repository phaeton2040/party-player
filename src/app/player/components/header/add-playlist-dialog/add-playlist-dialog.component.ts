import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

export interface AddPlaylistDialogData {
  name: string;
}

@Component({
  selector: 'app-add-playlist-dialog',
  templateUrl: './add-playlist-dialog.component.html',
  styleUrls: ['./add-playlist-dialog.component.scss']
})
export class AddPlaylistDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<AddPlaylistDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: AddPlaylistDialogData) { }

  ngOnInit(): void {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
