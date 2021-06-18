import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { Playlist } from "../../../models/playlist.interface";
import { ElectronService } from "../electron/electron.service";
import { Song } from '../../../models/song.model';


@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  private context: AudioContext;
  private pause: () => {};
  private play: any;
  private resume: any;

  private playlists: BehaviorSubject<Playlist[]> = new BehaviorSubject<Playlist[]>([]);
  private isPlaying: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private currentSong: BehaviorSubject<Song> = new BehaviorSubject<Song>(null);

  public get playlists$(): Observable<Playlist[]> {
    return this.playlists.asObservable();
  }

  public get isPlaying$(): Observable<boolean> {
    return this.isPlaying.asObservable();
  }

  public get currentSong$(): Observable<Song> {
    return this.currentSong.asObservable();
  }

  constructor(private electron: ElectronService) {
    this.context = new AudioContext();
    this.play = this.electron.play;
  }

  public addPlaylist(pl: Playlist) {
    const currPlaylists = this.playlists.value;

    currPlaylists.push(pl);

    this.playlists.next(currPlaylists);
  }

  public removePlaylist(name: string) {
    const currPlaylists = this.playlists.value;

    this.playlists.next(currPlaylists.filter((pl) => pl.name !== name));
  }

  public async addSongs(playlistName: string): Promise<void> {
    const currPlaylists = this.playlists.value;
    const playlist = currPlaylists.find((pl) => pl.name === playlistName);
    const songs = await this.electron.selectFiles();

    playlist.songs = playlist.songs.concat(songs);

    console.log(currPlaylists);
    this.playlists.next(currPlaylists);
  }

  public async playSong(playlistName: string, id: string) {
    this.pauseSong();

    const currPlaylists = this.playlists.value;
    const playlist = currPlaylists.find((pl) => pl.name === playlistName);
    const song = playlist.songs.find(s => s.id === id);

    if (!song) {
      return;
    }

    this.currentSong.next(song);
    this.isPlaying.next(true);

    try {
      const audioBuffer = await this.context.decodeAudioData(song.buffer);

      this.pause = await this.play(audioBuffer, {
        start: 0,
        end: song.duration
      });
    } catch (e) {
      console.log(e);
    }
  }

  public pauseSong() {
    this.isPlaying.next(false);
    this.resume = this.pause && this.pause();
  }

  public resumeSong() {
    this.isPlaying.next(true);
    this.resume && this.resume();
  }
}
