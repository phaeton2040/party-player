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

  @Output()
  public selectSong = new EventEmitter();

  public isActive$: Observable<boolean>;

  constructor(private plService: PlayerService) {
  }

  ngOnInit(): void {
    this.isActive$ = this.plService.currentSong$
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
}
