import { Component, Input, OnInit } from '@angular/core';
import { PlayerService } from "../../../core/services/player/player.service";
import { Playlist } from "../../../models/playlist.interface";
import { PlaylistService } from '../../../core/services/playlist/playlist.service';

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

  constructor(private player: PlayerService,
              private playlistSrv: PlaylistService) { }

  ngOnInit(): void {
    this.player.playerIndex$.subscribe(index => {
      this.active = index.playlistIndex === this.index;
      this.wrapped = !this.active;
    });
  }

  removePlaylist(e, name: string) {
    e.stopImmediatePropagation();
    // TODO: add confirmation dialog
    this.playlistSrv.removePlaylist(name);
  }

  async addFiles(e) {
    e.stopImmediatePropagation();
    await this.playlistSrv.addSongs(this.playlist.name);
  }

  playSong(songIndex: number) {
    this.playlistSrv.initHistory(this.index);
    this.player.findSongAndPlay({ playlistIndex: this.index, songIndex });
  }

  toggle() {
    this.wrapped = !this.wrapped;
  }
}
