import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Item } from '../app.interface';

import { virtualScrollDriver } from 'dynamic-virtual-scroll';

@Component({
  selector: 'app-dynamic-scroll',
  templateUrl: './dynamic-scroll.component.html',
  styleUrls: ['./dynamic-scroll.component.scss']
})
export class DynamicScrollComponent implements OnInit, AfterViewInit {

  @Input() fullItems: Item[];
  state: any = {};
  middleItems: Item[];
  lastItems: Item[];

  @ViewChild('jsScroller') scrollerElementRef: ElementRef<HTMLDivElement>;
  viewPort: HTMLDivElement;

  constructor() { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.viewPort = this.scrollerElementRef.nativeElement;
      this.driver();
    });
  }

  getRenderedItemHeight = (index: number) => {
    const id = this.fullItems[index].id;
    const element = document.getElementById(id);
    if (element) {
      const height = element.getBoundingClientRect().height;
      return height;
    }
    return 0;
  }

  driver() {
    const newState = virtualScrollDriver(
      {
        totalItems: this.fullItems.length,
        minRowHeight: 25,
        viewportHeight: this.viewPort.clientHeight,
        scrollTop: this.viewPort.scrollTop,
      },
      this.state,
      this.getRenderedItemHeight
    );
    newState.scrollbarWidth = this.viewPort ? this.viewPort.offsetWidth - this.viewPort.clientWidth : 12;
    if (this.setStateIfDiffers(newState)) {
      setTimeout(() => {
        this.driver();
      });
    }
  }

  setStateIfDiffers(state: any) {
    for (const k in state) {
        if (this.state[k] !== state[k]) {
            this.setState(state);
            return true;
        }
    }
    return false;
  }

  setState(state: any) {
    if (state.middleItemCount) {
      this.middleItems = this.fullItems.slice(state.firstMiddleItem, state.firstMiddleItem + state.middleItemCount);
    }
    if (state.lastItemCount) {
      this.lastItems = this.fullItems.slice(this.fullItems.length - state.lastItemCount, this.fullItems.length);
    }
    this.state = state;
  }

  handleScroll() {
    this.driver();
  }

  trackByFn(index: number, item: Item) {
    return item.id;
  }

}
