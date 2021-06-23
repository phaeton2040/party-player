import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Playlist } from '../../../models/playlist.interface';
import { ElectronService } from '../electron/electron.service';
import { PlayerIndex } from '../player/player.service';

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {

  private playlists: BehaviorSubject<Playlist[]> = new BehaviorSubject<Playlist[]>([]);

  public get playlists$(): Observable<Playlist[]> {
    return this.playlists.asObservable();
  }

  constructor(private electron: ElectronService) {
  }

  public addPlaylist(pl: Playlist): void {
    const currPlaylists = this.playlists.value;

    currPlaylists.push(pl);

    this.playlists.next(currPlaylists);
  }

  public removePlaylist(name: string): void {
    const currPlaylists = this.playlists.value;

    this.playlists.next(currPlaylists.filter((pl) => pl.name !== name));
  }

  public async addSongs(playlistName: string): Promise<void> {
    const currPlaylists = this.playlists.value;
    const playlist = currPlaylists.find((pl) => pl.name === playlistName);
    const songs = await this.electron.selectFiles();

    playlist.songs = playlist.songs.concat(songs);

    this.playlists.next(currPlaylists);
  }

  public getNextSong(playerIndex: PlayerIndex): PlayerIndex {
    // TODO: randomize logic will go here
    const pl = this.playlists.value[playerIndex.playlistIndex];
    const { songIndex } = playerIndex;

    if (!pl) {
      return null;
    }

    if (pl.songs[songIndex + 1]) {
      return { ...playerIndex, songIndex: songIndex + 1 };
    } else {
      if (this.playlists.value[playerIndex.playlistIndex + 1]) {
        return { playlistIndex: playerIndex.playlistIndex + 1, songIndex: 0 };
      } else {
        return null;
      }
    }
  }

  public getPrevSong(playerIndex: PlayerIndex): PlayerIndex {
    // TODO: randomize logic will go here
    const pl = this.playlists.value[playerIndex.playlistIndex];
    const { songIndex } = playerIndex;

    if (!pl) {
      return null;
    }

    if (pl.songs[songIndex - 1]) {
      return { ...playerIndex, songIndex: songIndex - 1 };
    } else {
      if (this.playlists.value[playerIndex.playlistIndex - 1]) {
        return { playlistIndex: playerIndex.playlistIndex - 1, songIndex: 0 };
      } else {
        return null;
      }
    }
  }

}
