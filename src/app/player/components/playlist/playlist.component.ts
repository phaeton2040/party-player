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

  constructor(private player: PlayerService,
              private playlistSrv: PlaylistService) { }

  ngOnInit(): void {
  }

  removePlaylist(name: string) {
    // TODO: add confirmation dialog
    this.playlistSrv.removePlaylist(name);
  }

  async addFiles() {
    await this.playlistSrv.addSongs(this.playlist.name);
  }

  playSong(songIndex: number) {
    this.player.findSongAndPlay({ playlistIndex: this.index, songIndex });
  }
}
