import { Song } from "./song.model";

export interface Playlist {
  name: string;
  songs: Song[]
}
