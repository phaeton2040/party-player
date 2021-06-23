import { Component, OnInit } from '@angular/core';
import { MatDialog } from "@angular/material/dialog";
import { AddPlaylistDialogComponent } from "./add-playlist-dialog/add-playlist-dialog.component";
import { PlayerService } from "../../../core/services/player/player.service";
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { PlaylistService } from '../../../core/services/playlist/playlist.service';

@Component({
  selector: 'rp-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  isPlaying$: Observable<boolean>;
  volume = 0.5;
  disabled$: Observable<boolean>;

  constructor(private dialog: MatDialog,
              private player: PlayerService,
              private playlist: PlaylistService) {
    this.isPlaying$ = this.player.isPlaying$;
    this.isPlaying$.subscribe(val => {
      console.log('is playing:', val);
    });
    this.disabled$ = this.player.isStop;
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

      this.playlist.addPlaylist({ name: result, songs: [] });
    });
  }

  pause() {
    this.player.pauseSong();
  }

  play() {
    this.player.isPaused$
      .pipe(
        take(1)
      ).subscribe(paused => {
        if (paused) {
          this.player.resumeSong();
        } else {
          this.player.playCurrentOrFirst();
        }
      });
  }

  stop(): void {
    this.player.stop();
  }

  setVolume(e): void {
    this.player.setVolume(e.value);
  }

  next(): void {
    this.player.playNext();
  }

  prev(): void {
    this.player.playPrev();
  }
}
