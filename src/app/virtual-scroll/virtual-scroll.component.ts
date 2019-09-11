import { Component, OnInit, AfterViewInit, Input, ViewChild, ElementRef } from '@angular/core';
import { Item } from '../app.interface';

const OFFSET_COUNT = 10;

export interface RenderedItem {
  offsetTop: number;
  item: Item;
}

@Component({
  selector: 'app-virtual-scroll',
  templateUrl: './virtual-scroll.component.html',
  styleUrls: ['./virtual-scroll.component.scss']
})
export class VirtualScrollComponent implements OnInit, AfterViewInit {

  @Input() fullItems: Item[];

  @ViewChild('jsScroller') scrollerElementRef: ElementRef<HTMLDivElement>;
  @ViewChild('jsScrollerSizer') scrollerSizerElementRef: ElementRef<HTMLDivElement>;
  @ViewChild('jsScrollerOffset') scrollerOffsetElementRef: ElementRef<HTMLDivElement>;
  @ViewChild('testItemComponent') newItemElementRef: ElementRef<HTMLDivElement>;

  virtualItems: Item[];
  renderedItems: RenderedItem[];
  sizerHeight: number;
  seedValue = 0;
  startIndex = 0;
  endIndex = OFFSET_COUNT;
  testItem: Item;
  newIndex: number;

  constructor() { }

  ngOnInit() {
    this.virtualItems = this.fullItems.slice(0, this.fullItems.length);
  }

  ngAfterViewInit() {
    const renderedItems: RenderedItem[] = [];
    setTimeout(() => {
      const elementCollection = document.getElementsByClassName('list-row');
      const elementArray = Array.from(elementCollection) as HTMLElement[];

      // Loop through each of the rendered items, creating an object keyed by each
      // elements offsetTop and storing the element itself as the value.
      elementArray.forEach((element, index) => {
        renderedItems.push({
          offsetTop: element.offsetTop,
          item: this.fullItems[index]
        });
      });

      this.renderedItems = renderedItems;
      // The scrollers height with be the same as the last elements offsetTop
      this.sizerHeight = renderedItems[renderedItems.length - 1].offsetTop;
      // this.sizerHeight = parseInt(Object.keys(renderedItems).slice(-1)[0], 10);
      this.virtualItems = this.fullItems.slice(this.startIndex, this.endIndex);
    });
  }

  trackByFn(index: number, item: Item) {
    return item.id;
  }

  handleScroll() {
    // Get the user's current scroll position
    const scrollPosition = (this.scrollerElementRef.nativeElement as HTMLElement).scrollTop;

    // If we are already at the bottom of the list then don't do anything else
    if (scrollPosition >= this.sizerHeight) {
      // Ensure the offset does not exceed the scroller__sizer height
      this.updateOffsetYPosition(this.sizerHeight);
      return;
    }

    // Find the closest row to our current scroll position
    const closestRowIndex = this.findClosestNumberIndex(scrollPosition, this.renderedItems);

    // Find the rows that we need to render using the OFFSET_COUNT buffer
    this.startIndex = (closestRowIndex - OFFSET_COUNT) >= 0 ? (closestRowIndex - OFFSET_COUNT) : 0;
    this.endIndex = (closestRowIndex + OFFSET_COUNT) <= this.renderedItems.length ? (closestRowIndex + OFFSET_COUNT) : this.renderedItems.length;
    const indexes = this.renderedItems.slice(this.startIndex, this.endIndex);
    this.virtualItems = indexes.map(item => item.item);

    // Being to update the offset's Y position once we have rendered at least 10 elements
    const updatePosition = Math.max(0, closestRowIndex - OFFSET_COUNT) === 0 ? 0 : indexes[0].offsetTop;
    this.updateOffsetYPosition(updatePosition);
  }

   findClosestNumberIndex(numberToFind: number, numbers: RenderedItem[]) {
    let current = numbers[0].offsetTop;
    let currentIndex = 0;
    let difference = Math.abs(numberToFind - current);

    for (let val = 0; val < numbers.length; val++) {
      const newDifference = Math.abs(numberToFind - numbers[val].offsetTop);

      if (newDifference < difference) {
        difference = newDifference;
        current = numbers[val].offsetTop;
        currentIndex = val;
      }
    }

    return currentIndex;
  }

  updateOffsetYPosition(position) {
    (this.scrollerOffsetElementRef.nativeElement as HTMLElement).style.transform = `translateY(${position}px)`;
  }

  addAt(inputIndex: string) {
    const index = parseInt(inputIndex, 10);
    this.newIndex = index + 1;
    const newItem = {
      id: this.uuid(),
      name: 'Item',
      height: (Math.floor(Math.random() * 24) + 1) * 25,
      backgroundColour: 'lightgreen',
    };
    this.testItem = newItem;
    setTimeout(() => {
      const newHeight = this.newItemElementRef.nativeElement.getBoundingClientRect().height;
      console.log('newHeight: ', newHeight);
      this.testItem = null;
      const nextRenderedItem = this.renderedItems[this.newIndex];
      const newRenderedItem: RenderedItem = {
        offsetTop: nextRenderedItem.offsetTop,
        item: newItem
      };
      this.fullItems.splice(this.newIndex, 0, newItem);
      this.renderedItems.splice(this.newIndex, 0, newRenderedItem);
      for (let i = this.newIndex + 1; i < this.renderedItems.length; i++) {
        const oldValue = this.renderedItems[i];
        this.renderedItems[i] = {
          ...oldValue,
          offsetTop: oldValue.offsetTop + newHeight
        };
      }
      const indexes = this.renderedItems.slice(this.startIndex, this.endIndex);
      this.virtualItems = indexes.map(item => item.item);
      this.sizerHeight += newHeight;
    });
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
