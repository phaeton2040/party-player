import { Component, OnInit } from '@angular/core';
import { MatDialog } from "@angular/material/dialog";
import { AddPlaylistDialogComponent } from "./add-playlist-dialog/add-playlist-dialog.component";
import { PlayerService } from "../../../core/services/player/player.service";
import { Observable } from 'rxjs';

@Component({
  selector: 'rp-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  isPlaying$: Observable<boolean>;
  volume = 0.5;

  constructor(private dialog: MatDialog,
              private plService: PlayerService) {
    this.isPlaying$ = this.plService.isPlaying$;

    this.isPlaying$.subscribe(val => {
      console.log('is playing:', val);
    });
  }

  ngOnInit(): void {
  }

  showAddPlayListDialog() {
    const dialogRef = this.dialog.open(AddPlaylistDialogComponent, {
      width: '250px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      this.plService.addPlaylist({ name: result, songs: [] });
    });
  }

  pause() {
    this.plService.pauseSong();
  }

  play() {
    this.plService.resumeSong();
  }

  stop() {
    this.plService.stop();
  }

  setVolume(e) {
    this.plService.setVolume(e.value);
  }
}
