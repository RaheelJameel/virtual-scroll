import { Component, OnInit, AfterViewInit, Input, ViewChild, ElementRef } from '@angular/core';
import { Item } from '../app.interface';

const OFFSET_COUNT = 10;

@Component({
  selector: 'app-virtual-scroll',
  templateUrl: './virtual-scroll.component.html',
  styleUrls: ['./virtual-scroll.component.scss']
})
export class VirtualScrollComponent implements OnInit, AfterViewInit {

  @Input() fullItems: Item[];

  @ViewChild('jsScroller') scrollerElementRef: ElementRef;
  @ViewChild('jsScrollerSizer')scrollerSizerElementRef: ElementRef;
  @ViewChild('jsScrollerOffset')scrollerOffsetElementRef: ElementRef;

  virtualItems: Item[];
  renderedItems;
  sizerHeight: number;

  constructor() { }

  ngOnInit() {
    this.virtualItems = this.fullItems.slice(0, this.fullItems.length);
  }

  ngAfterViewInit() {
    const renderedItems: { [index: string]: Item} = {};
    setTimeout(() => {
      const elementCollection = document.getElementsByClassName('list-row');
      const elementArray = Array.from(elementCollection) as HTMLElement[];

      // Loop through each of the rendered items, creating an object keyed by each
      // elements offsetTop and storing the element itself as the value.
      elementArray.forEach((element, index) => {
        renderedItems[element.offsetTop] = this.fullItems[index];
      });

      this.renderedItems = renderedItems;
      // The scrollers height with be the same as the last elements offsetTop
      this.sizerHeight = parseInt(Object.keys(renderedItems).slice(-1)[0], 10);
      this.virtualItems = this.fullItems.slice(0, OFFSET_COUNT);
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

    // Create an array containing the offsetTop values of each of the rendered items
    const rowPositions = Object.keys(this.renderedItems);
    // Find the closest row to our current scroll position
    const closestRowIndex = this.findClosestNumberIndex(scrollPosition, rowPositions);

    // Find the rows that we need to render using the OFFSET_COUNT buffer
    const start = (closestRowIndex - OFFSET_COUNT) >= 0 ? (closestRowIndex - OFFSET_COUNT) : 0;
    const end = (closestRowIndex + OFFSET_COUNT) <= rowPositions.length ? (closestRowIndex + OFFSET_COUNT) : rowPositions.length;
    const indexes = rowPositions.slice(start, end);

    // Hide the rows we don't need to render and show the ones that do need to be rendered
    const virtualItems: Item[] = []
    rowPositions.forEach(position => {
      if (indexes.indexOf(position) === -1) {
        // $(renderedItems[position]).hide();
      } else {
        // $(renderedItems[position]).show();
        virtualItems.push(this.renderedItems[position]);
      }
    });
    this.virtualItems = virtualItems;

    // Being to update the offset's Y position once we have rendered at least 10 elements
    const updatePosition = Math.max(0, closestRowIndex - OFFSET_COUNT) === 0 ? 0 : indexes[0];
    this.updateOffsetYPosition(updatePosition);
  };

   findClosestNumberIndex(numberToFind: number, numbers) {
    let current = numbers[0];
    let currentIndex = 0;
    let difference = Math.abs(numberToFind - current);

    for (let val = 0; val < numbers.length; val++) {
      const newDifference = Math.abs(numberToFind - numbers[val]);

      if (newDifference < difference) {
        difference = newDifference;
        current = numbers[val];
        currentIndex = val;
      }
    }

    return currentIndex;
  };

  updateOffsetYPosition(position) {
    (this.scrollerOffsetElementRef.nativeElement as HTMLElement).style.transform = `translateY(${position}px)`;
  };

}
