import { Component, HostListener, Input, OnInit } from '@angular/core';
import { PlayerIndex, PlayerService } from "../../../core/services/player/player.service";
import { Playlist } from "../../../models/playlist.interface";
import { PlaylistService } from '../../../core/services/playlist/playlist.service';
import { take } from "rxjs/operators";
import { CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
  selector: 'rp-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.scss']
})
export class PlaylistComponent implements OnInit {

  @Input()
  public playlist: Playlist;

  @Input()
  public index: number;

  public wrapped = false;
  public active = false;
  public highlightOnDrag = false;

  @HostListener('dragover', ['$event'])
  public onDragOver(e: DragEvent): void {
    e.preventDefault();
  }

  @HostListener('dragenter', ['$event'])
  public onDragEnter(e: DragEvent): void {
    e.preventDefault();
    this.highlightOnDrag = true;
  }

  @HostListener('dragleave', ['$event'])
  public onDragLeave(e: DragEvent): void {
    e.preventDefault();
    this.highlightOnDrag = false;
  }

  @HostListener('drop', ['$event.dataTransfer.files'])
  public onDrop(files: any[]): void {
    this.playlistSrv.addSongs(this.playlist.name, Array.from(files).map(f => f.path));
    this.highlightOnDrag = false;
  }

  constructor(private player: PlayerService,
              private playlistSrv: PlaylistService) {
  }

  ngOnInit(): void {
    this.player.playerIndex$.subscribe(index => {
      this.active = index.playlistIndex === this.index;

      if (this.active) {
        this.wrapped = false;
      }
    });
  }

  removePlaylist(e: Event, name: string): void {
    e.stopImmediatePropagation();
    // TODO: add confirmation dialog
    this.playlistSrv.removePlaylist(name);
  }

  async addFiles(e: Event): Promise<void> {
    e.stopImmediatePropagation();
    await this.playlistSrv.addSongs(this.playlist.name);
  }

  playSong(songIndex: number): void {
    this.playlistSrv.initHistory({playlistIndex: this.index, songIndex});
    this.player.findSongAndPlay({playlistIndex: this.index, songIndex});
  }

  toggle(): void {
    this.wrapped = !this.wrapped;
  }

  removeSong(songIndex: number): void {
    this.player.playerIndex$
      .pipe(
        take(1)
      ).subscribe((curIndex: PlayerIndex) => {
        if (curIndex.playlistIndex === this.index && songIndex === curIndex.songIndex) {
          this.player.stop();
        }
        this.playlistSrv.removeSong({songIndex: songIndex, playlistIndex: this.index});
      });
  }

  drop(event: CdkDragDrop<any>): void {
    this.playlistSrv.moveSongsInPlaylists(event, this.index);
  }
}
