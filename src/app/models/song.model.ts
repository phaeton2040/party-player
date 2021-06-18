export class Song {
  id: string;
  name: string;
  author?: string;
  duration: number;
  buffer: any;
  path: string;

  constructor(source: Partial<Song>) {
    Object.assign(this, source);
  }

  get formattedDuration(): string {
    return `${Math.floor(this.duration / 60 )}:${this.seconds}`;
  }

  private get seconds() {
    const seconds = (this.duration % 60).toString();

    if (seconds.length == 2) {
      return seconds;
    } else {
      return `0${seconds}`;
    }
  }
}
