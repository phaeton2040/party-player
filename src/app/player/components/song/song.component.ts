import { Component, Input, OnInit, Output } from '@angular/core';
import { Song } from "../../../models/song.model";
import { EventEmitter } from '@angular/core';
import { PlayerService } from '../../../core/services/player/player.service';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';


@Component({
  selector: 'rp-song',
  templateUrl: './song.component.html',
  styleUrls: ['./song.component.scss']
})
export class SongComponent implements OnInit {

  @Input()
  public song: Song;

  @Input()
  public index: number;

  @Output()
  public selectSong = new EventEmitter();

  @Output()
  public removeSong = new EventEmitter();

  public isActive$: Observable<boolean>;

  constructor(private player: PlayerService) {
  }

  ngOnInit(): void {
    this.isActive$ = this.player.currentSong$
      .pipe(
        filter(song => !!song),
        map((song) => {
          return this.song.id === song.id;
        })
      );
  }

  play() {
    this.selectSong.emit(this.song.id);
  }

  onRemoveSong(event: Event, index: number): void {
    event.stopImmediatePropagation();
    this.removeSong.emit(index);
  }
}
