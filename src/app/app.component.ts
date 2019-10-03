import { Component, OnInit } from '@angular/core';
import { Item } from './app.interface';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  name = 'Virtual Scroll';
  seedValue = 0;
  fullItems: Item[];

  ngOnInit() {
    this.fullItems = Array.from({ length: 25 }).map<Item>((_, i) => ({
      id: this.uuid(),
      name: 'Item',
      height: 40 + (Math.floor(Math.random() * 261)),
      backgroundColour: i % 2 === 0 ? 'lightcyan' : 'lightgrey'
    }));
  }

  uuid(): string {
    if (this.seedValue === 999999) {
      this.seedValue = 0;
    }
    this.seedValue += 1;
    const time = new Date().getTime().toString();
    const random = ('00000' + this.seedValue).slice(-6).toString();
    return time + random;
  }
}
