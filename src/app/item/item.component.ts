import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Item } from '../app.interface';

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss']
})
export class ItemComponent implements OnInit, OnDestroy {

  @Input() item: Item;
  @Input() index: number;

  constructor() { }

  ngOnInit() {
    // console.log('ngOnInit index: ', this.index, ', item: ', this.item);
  }

  ngOnDestroy() {
    // console.log('ngOnDestroy index: ', this.index, ', item: ', this.item);
  }

}
