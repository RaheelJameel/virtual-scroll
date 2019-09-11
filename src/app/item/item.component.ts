import { Component, OnInit, Input } from '@angular/core';
import { Item } from '../app.interface';

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss']
})
export class ItemComponent implements OnInit {

  @Input() item: Item;
  @Input() index: number;

  constructor() { }

  ngOnInit() {
  }

}
