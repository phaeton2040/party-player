import { Component, OnInit } from '@angular/core';
import { PlayerService } from "../../../core/services/player/player.service";
import { Observable } from "rxjs";
import { Playlist } from "../../../models/playlist.interface";

@Component({
  selector: 'rp-songs-list',
  templateUrl: './songs-list.component.html',
  styleUrls: ['./songs-list.component.scss']
})
export class SongsListComponent implements OnInit {

  // search query
  value = '';

  playlists$: Observable<Playlist[]>;

  constructor(private plService: PlayerService) {
    this.playlists$ = this.plService.playlists$;
  }

  ngOnInit(): void {
  }

}
