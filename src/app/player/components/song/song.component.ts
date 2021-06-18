import { Component, Input, OnInit, Output } from '@angular/core';
import { Song } from "../../../models/song.model";
import { EventEmitter } from '@angular/core';


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

  constructor() {
  }

  ngOnInit(): void {
  }

  play() {
    this.selectSong.emit(this.song.id);
  }
}
