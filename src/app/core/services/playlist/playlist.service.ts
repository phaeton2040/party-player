import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Playlist } from '../../../models/playlist.interface';
import { ElectronService } from '../electron/electron.service';
import { PlayerIndex } from '../player/player.service';

export interface PlaybackSettings {
  randomize?: boolean;
  straight?: boolean;
  sequential?: {
    songsPerPlaylist: number
  }
}

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {

  public settings: PlaybackSettings = {
    randomize: false,
    straight: true,
    sequential: {
      songsPerPlaylist: 2
    }
  };

  private playlists: BehaviorSubject<Playlist[]> = new BehaviorSubject<Playlist[]>([]);

  public get playlists$(): Observable<Playlist[]> {
    return this.playlists.asObservable();
  }

  constructor(private electron: ElectronService) {
  }

  public setSettings(s: Partial<PlaybackSettings>): void {
    this.resetHistory();
    this.settings = { ...this.settings, ...s };
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

  public async addSongs(playlistName: string, filePaths?: string[]): Promise<void> {
    const currPlaylists = this.playlists.value;
    const playlist = currPlaylists.find((pl) => pl.name === playlistName);
    let songs;

    try {
      if (filePaths) {
        songs = await this.electron.generateSongsFromPaths(filePaths);
      } else {
        songs = await this.electron.selectFiles();
      }
    } catch (err) {
      console.log('Error while loading songs:', err);
      return;
    }

    playlist.songs = playlist.songs.concat(songs);

    this.playlists.next(currPlaylists);
  }

  public history = {};
  public currentSeq = [];

  public getNextSong(playerIndex: PlayerIndex): PlayerIndex {
    if (!this.history[playerIndex.playlistIndex]) {
      this.history[playerIndex.playlistIndex] = [];
    }

    if (!this.settings.straight) {
      if (this.currentSeq.length >= this.settings.sequential.songsPerPlaylist) {
        playerIndex.playlistIndex = (playerIndex.playlistIndex + 1) < this.playlists.value.length ?
          playerIndex.playlistIndex + 1 : 0;

        if (!this.history[playerIndex.playlistIndex]) {
          this.history[playerIndex.playlistIndex] = [];
        }

        const currPlaylistHistory = this.history[playerIndex.playlistIndex];

        playerIndex.songIndex = currPlaylistHistory[currPlaylistHistory.length - 1];
        this.currentSeq = [];
      }
    }

    return this.switchNextSong(playerIndex, this.settings.straight);
  }

  public getPrevSong(playerIndex: PlayerIndex): PlayerIndex {
    // reset history on moving back
    this.resetHistory();

    let pl = this.playlists.value[playerIndex.playlistIndex];
    const { songIndex } = playerIndex;

    if (!pl) {
      return null;
    }

    if (pl.songs[songIndex - 1]) {
      return { ...playerIndex, songIndex: songIndex - 1 };
    } else {
      if (this.playlists.value[playerIndex.playlistIndex - 1]) {
        pl = this.playlists.value[playerIndex.playlistIndex - 1];
        return { playlistIndex: playerIndex.playlistIndex - 1, songIndex: pl.songs.length - 1 };
      } else {
        return null;
      }
    }
  }

  private switchNextSong(playerIndex: PlayerIndex, switchPlaylistOnLastSong = false): PlayerIndex {
    const pl = this.playlists.value[playerIndex.playlistIndex];
    const { songIndex } = playerIndex;

    if (!pl) {
      return null;
    }

    const currPlaylistHistory = this.history[playerIndex.playlistIndex];

    if (currPlaylistHistory.length === pl.songs.length) {
      this.history[playerIndex.playlistIndex] = [];
    }

    if (pl.songs[songIndex + 1]) {
      currPlaylistHistory.push(songIndex + 1);
      this.currentSeq.push(songIndex + 1);
      return { ...playerIndex, songIndex: songIndex + 1 };
    } else {
      if (switchPlaylistOnLastSong) {
        if (this.playlists.value[playerIndex.playlistIndex + 1]) {
          return { playlistIndex: playerIndex.playlistIndex + 1, songIndex: 0 };
        } else {
          return null;
        }
      } else {
        currPlaylistHistory.push(0);
        this.currentSeq.push(0);

        return { ...playerIndex, songIndex: 0 };
      }
    }
  }

  public resetHistory(): void {
    this.history = {};
    this.currentSeq = [];
  }

  public initHistory(playlistIndex = 0): void {
    this.resetHistory();
    this.history[playlistIndex] = [0];
    this.currentSeq = [0];
  }
}
