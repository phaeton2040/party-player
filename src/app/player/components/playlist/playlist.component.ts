import { Component, Input, OnInit } from '@angular/core';
import { PlayerService } from "../../../core/services/player/player.service";
import { Playlist } from "../../../models/playlist.interface";

@Component({
  selector: 'rp-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.scss']
})
export class PlaylistComponent implements OnInit {

  @Input()
  public playlist: Playlist;

  constructor(private plService: PlayerService) { }

  ngOnInit(): void {
  }

  removePlaylist(name: string) {
    // TODO: add confirmation dialog
    this.plService.removePlaylist(name);
  }

  async addFiles() {
    await this.plService.addSongs(this.playlist.name);
  }

  playSong(songId: string) {
    this.plService.findSongAndPlay(this.playlist.name, songId);
  }
}
