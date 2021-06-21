import { Component, OnInit } from '@angular/core';
import { Observable } from "rxjs";
import { Playlist } from "../../../models/playlist.interface";
import { PlaylistService } from '../../../core/services/playlist/playlist.service';

@Component({
  selector: 'rp-songs-list',
  templateUrl: './songs-list.component.html',
  styleUrls: ['./songs-list.component.scss']
})
export class SongsListComponent implements OnInit {

  // search query
  value = '';

  playlists$: Observable<Playlist[]>;

  constructor(private playlistSrv: PlaylistService) {
    this.playlists$ = this.playlistSrv.playlists$;
  }

  ngOnInit(): void {
  }

}
