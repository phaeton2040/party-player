import { Injectable } from "@angular/core";
import { BehaviorSubject, interval, Observable } from "rxjs";
import { Playlist } from "../../../models/playlist.interface";
import { ElectronService } from "../electron/electron.service";
import { Song } from '../../../models/song.model';
import { map, min } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class PlayerService {

  public context: AudioContext;

  private startTime = 0;
  private offset = 0;

  private playlists: BehaviorSubject<Playlist[]> = new BehaviorSubject<Playlist[]>([]);
  private isPlaying: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private currentSong: BehaviorSubject<Song> = new BehaviorSubject<Song>(null);

  public gainController: GainNode;
  public audio: AudioBufferSourceNode;

  public volume = new BehaviorSubject(0.5);

  public get playlists$(): Observable<Playlist[]> {
    return this.playlists.asObservable();
  }

  public get isPlaying$(): Observable<boolean> {
    return this.isPlaying.asObservable();
  }

  public get currentSong$(): Observable<Song> {
    return this.currentSong.asObservable();
  }

  public get position$(): Observable<number> {
    return interval(1000)
      .pipe(
        map(() => Math.floor(this.context.currentTime + this.offset - this.startTime))
      );
  }

  constructor(private electron: ElectronService) {
    this.context = new AudioContext();
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

  public findSongAndPlay(playlistName: string, id: string): Promise<void> {
    this.stop();

    const currPlaylists = this.playlists.value;
    const playlist = currPlaylists.find((pl) => pl.name === playlistName);
    const song = playlist.songs.find(s => s.id === id);

    if (!song) {
      return;
    }

    this.currentSong.next(song);
    this.isPlaying.next(true);

    this.playSong(song);
  }

  public async playSong(song: Song, offset?: number): Promise<void> {
    try {
      const songArrayBuffer = await this.electron.read(song.path);
      const audioBuffer = await this.context.decodeAudioData(songArrayBuffer as ArrayBuffer);

      this.audio = this.context.createBufferSource();
      this.audio.buffer = audioBuffer;
      this.gainController = this.context.createGain();
      this.gainController.gain.setValueAtTime(this.volume.value, this.context.currentTime);
      this.audio.connect(this.gainController);
      this.gainController.connect(this.context.destination);

      if (!offset) {
        this.startTime = this.context.currentTime;
      }

      console.log('Start time:', this.startTime);
      console.log('Current time:', this.context.currentTime);
      console.log('Offset:', offset);
      this.audio.start(this.context.currentTime, offset);
    } catch (e) {
      console.log(e);
    }
  }


  public pauseSong(): void {
    this.isPlaying.next(false);
    this.audio.playbackRate.setValueAtTime(0, this.context.currentTime);
  }

  public resumeSong(): void {
    this.isPlaying.next(true);
    this.audio.playbackRate.setValueAtTime(1, this.context.currentTime);
  }

  public stop(erase = true): void {
    if (!this.audio) {
      return;
    }

    this.isPlaying.next(false);

    if (erase) {
      this.startTime = this.context.currentTime;
      this.offset = 0;
      this.currentSong.next(null);
    }

    this.audio.stop();
  }

  public setVolume(volume: number): void {
    this.volume.next(volume);

    if (this.gainController) {
      this.gainController.gain.setValueAtTime(volume, this.context.currentTime);
    }
  }

  public seek(position: number): void {
    this.stop(false);
    this.offset = position;
    this.playSong(this.currentSong.value, position);
  }
}
