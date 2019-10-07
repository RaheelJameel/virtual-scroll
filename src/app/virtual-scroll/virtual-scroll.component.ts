import { Component, OnInit, AfterViewInit, Input, ViewChild, ElementRef } from '@angular/core';
import { Item } from '../app.interface';

const OFFSET_COUNT = 10;

export interface RenderedItem {
  offsetTop: number;
  height: number;
  item: Item;
}

@Component({
  selector: 'app-virtual-scroll',
  templateUrl: './virtual-scroll.component.html',
  styleUrls: ['./virtual-scroll.component.scss']
})
export class VirtualScrollComponent implements OnInit, AfterViewInit {

  @Input() inputItems: Item[];

  @ViewChild('jsScroller') scrollerElementRef: ElementRef<HTMLDivElement>;
  @ViewChild('jsScrollerSizer') scrollerSizerElementRef: ElementRef<HTMLDivElement>;
  @ViewChild('jsScrollerOffset') scrollerOffsetElementRef: ElementRef<HTMLDivElement>;
  @ViewChild('testItemComponent') newItemElementRef: ElementRef<HTMLDivElement>;

  fullItems: Item[];
  virtualItems: Item[];
  renderedItems: RenderedItem[];
  maxYOffset: number;
  scrollHeight: number;
  seedValue = 0;
  startIndex = 0;
  endIndex = OFFSET_COUNT;
  testItem: Item;
  newIndex: number;
  ignoreScroll: boolean;
  scrollDisabled: boolean;

  constructor() { }

  ngOnInit() {
    this.fullItems = Array.from(this.inputItems);
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
          height: element.getBoundingClientRect().height,
          item: this.fullItems[index]
        });
      });

      this.renderedItems = renderedItems;
      // The scrollers height with be the same as the last elements offsetTop
      this.setScrollHeight();
      // this.sizerHeight = parseInt(Object.keys(renderedItems).slice(-1)[0], 10);
      this.virtualItems = this.fullItems.slice(this.startIndex, this.endIndex);
    });
  }

  trackByFn(index: number, item: Item) {
    return item.id;
  }

  onScroll() {
    // console.log('onScroll');
    if (!this.scrollDisabled && !this.ignoreScroll) {
      this.handleScroll();
    }
  }

  handleScroll() {
    // Get the user's current scroll position
    const scrollPosition = (this.scrollerElementRef.nativeElement as HTMLElement).scrollTop;
    console.log('handleScroll: scrollPosition: ', scrollPosition);

    // If we are already at the bottom of the list then don't do anything else
    if (scrollPosition >= this.maxYOffset) {
      // Ensure the offset does not exceed the scroller__sizer height
      this.updateOffsetYPosition(this.maxYOffset);
      return;
    }

    // Find the closest row to our current scroll position
    const closestRowIndex = this.findClosestNumberIndex(scrollPosition, this.renderedItems);

    // Find the rows that we need to render using the OFFSET_COUNT buffer
    this.startIndex = (closestRowIndex - OFFSET_COUNT) >= 0 ? (closestRowIndex - OFFSET_COUNT) : 0;
    this.endIndex = (closestRowIndex + OFFSET_COUNT) <= this.renderedItems.length ? (closestRowIndex + OFFSET_COUNT) : this.renderedItems.length;
    // console.log('closestRowIndex: ', closestRowIndex, ', startIndex: ', this.startIndex, ', endIndex: ', this.endIndex);
    const indexes = this.renderedItems.slice(this.startIndex, this.endIndex);
    this.virtualItems = indexes.map(item => item.item);

    // Being to update the offset's Y position once we have rendered at least 10 elements
    const updatePosition = Math.max(0, closestRowIndex - OFFSET_COUNT) === 0 ? 0 : indexes[0].offsetTop;
    // console.log('updatePosition: ', updatePosition);
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
    console.log('this.renderedItems: ', this.renderedItems);
    return currentIndex;
  }

  updateOffsetYPosition(position) {
    (this.scrollerOffsetElementRef.nativeElement as HTMLElement).style.transform = `translateY(${position}px)`;
  }

  bulkAddAt(...indexes: string[]) {
    // console.log('oldItems: ', this.fullItems);
    indexes.forEach((indexString) => {
      if (indexString) {
        const index = parseInt(indexString, 10);
        const newItem = {
          id: this.uuid(),
          name: 'Item',
          height: 40 + (Math.floor(Math.random() * 261)),
          // height: 100,
          backgroundColour: 'lightgreen',
        };
        // console.log('bulkAddAt: index: ', index, ', item: ', newItem);
        this.inputItems.splice(index, 0, newItem);
      }
    });
    // console.log('newItems: ', this.inputItems);
    this.onDataChange(this.fullItems, this.inputItems);
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

  bulkRemoveAt(...indexes: string[]) {
    indexes.forEach((indexString) => {
      if (indexString) {
        const index = parseInt(indexString, 10);
        this.inputItems.splice(index, 1);
      }
    });
    this.onDataChange(this.fullItems, this.inputItems);
  }

  onDataChange(oldItems: Item[], newItems: Item[]) {
    // Find the newly added Items
    console.log('oldRenderedItems: ', JSON.parse(JSON.stringify(this.renderedItems)));
    const additionDifference = this.differenceAdvanced(oldItems, newItems);
    if (additionDifference.length) {
      this.handleAddChange(additionDifference, newItems);
    } else {
      const deletionDifference = this.differenceAdvanced(newItems, oldItems);
      if (deletionDifference.length) {
        this.handleDeleteChange(deletionDifference, oldItems, newItems);
      }
    }
    console.log('newRenderedItems: ', JSON.parse(JSON.stringify(this.renderedItems)));
  }

  handleAddChange(additionDifference: any[], newItems: Item[]) {
    const addedItems: Item[] = additionDifference.map(diff => diff.value);
    // console.log('addedItems: ', JSON.parse(JSON.stringify(addedItems)));

    // Get the user's current scroll position
    const scrollPosition = (this.scrollerElementRef.nativeElement as HTMLElement).scrollTop;
    // console.log('onDataChange: scrollPosition: ', scrollPosition);

    // Render these new Items in the end of the array
    this.virtualItems = this.virtualItems.concat(addedItems);
    // Wait a tick for Angular to render the items
    setTimeout(() => {
      const elementCollection = document.getElementsByClassName('list-row');
      const elementArray = Array.from(elementCollection) as HTMLElement[];
      const addedItemElements = elementArray.slice(elementArray.length - addedItems.length);
      // Get the heights of the newly rendered items
      additionDifference.forEach((diff, index) => {
        diff.height = addedItemElements[index].getBoundingClientRect().height;
      });

      let diffIndex = 0;
      let findIndex = additionDifference[diffIndex].index;
      let heightAddition = 0;
      let renderedItemIndex = 0;
      // console.log('oldRenderedItems: ', JSON.parse(JSON.stringify(this.renderedItems)));
      for (
        let renderedItem = this.renderedItems[renderedItemIndex];
        renderedItemIndex < this.renderedItems.length;
        renderedItemIndex++, renderedItem = this.renderedItems[renderedItemIndex]
      ) {
        if (renderedItemIndex === findIndex) {
          const newRenderedItem: RenderedItem = {
            offsetTop: renderedItem.offsetTop + heightAddition,
            height: additionDifference[diffIndex].height,
            item: additionDifference[diffIndex].value
          };
          this.renderedItems.splice(renderedItemIndex, 0, newRenderedItem);
          heightAddition += additionDifference[diffIndex].height;
          diffIndex++;
          findIndex = additionDifference[diffIndex] && additionDifference[diffIndex].index;
        } else {
          renderedItem.offsetTop += heightAddition;
        }
      }
      // console.log('Change virtualItems');
      // this.ignoreScroll = true;
      // console.log('newRenderedItems: ', JSON.parse(JSON.stringify(this.renderedItems)));
      // console.log('oldVirtualItems: ', JSON.parse(JSON.stringify(this.virtualItems)));
      this.virtualItems = newItems.slice(this.startIndex, this.endIndex);
      // console.log('newVirtualItems: ', JSON.parse(JSON.stringify(this.virtualItems)));
      this.fullItems = Array.from(newItems);

      // The scrollers height with be the same as the last elements offsetTop
      this.setScrollHeight();

      // this.updateOffsetYPosition(updatePosition);

      console.log('Work Done');
      setTimeout(() => {
        console.log('changing scroll position');
        (this.scrollerElementRef.nativeElement as HTMLElement).scrollTo({ top: scrollPosition });
        setTimeout(() => {
          // console.log('unset ignoreScroll');
          // this.ignoreScroll = false;
          // (this.scrollerElementRef.nativeElement as HTMLElement).scrollTo({ top: scrollPosition });
        });
      });
    });
  }

  handleDeleteChange(deletionDifference: any[], oldItems: Item[], newItems: Item[]) {
    let diffIndex = 0;
    let findIndex = deletionDifference[diffIndex] && deletionDifference[diffIndex].index;
    let heightSubtraction = 0;
    // Following loop is not a simple for loop, as the array being iterated is being mutated in the loop
    // tslint:disable-next-line: prefer-for-of
    for (
      let index = 0, renderedItem = this.renderedItems[index];
      index < this.renderedItems.length;
      index++, renderedItem = this.renderedItems[index]
    ) {
      if (index === findIndex) {
        heightSubtraction += renderedItem.height;
        this.renderedItems.splice(index, 1);
        index--;
        diffIndex++;
        findIndex = deletionDifference[diffIndex] && deletionDifference[diffIndex].index;
      } else {
        console.log('Abc: renderedItem.offsetTop: ', renderedItem.offsetTop, ', heightSubtraction: ', heightSubtraction);
        renderedItem.offsetTop -= heightSubtraction;
      }
    }

    // Get the user's current scroll position
    const scrollPosition = (this.scrollerElementRef.nativeElement as HTMLElement).scrollTop;

    this.virtualItems = newItems.slice(this.startIndex, this.endIndex);
    // console.log('newVirtualItems: ', JSON.parse(JSON.stringify(this.virtualItems)));
    this.fullItems = Array.from(newItems);
    // The scrollers height with be the same as the last elements offsetTop
    this.setScrollHeight();

    setTimeout(() => {
      console.log('changing scroll position');
      (this.scrollerElementRef.nativeElement as HTMLElement).scrollTo({ top: scrollPosition });
    });
  }

  setScrollHeight() {
    const lastItem = this.renderedItems[this.renderedItems.length - 1];
    this.maxYOffset = lastItem.offsetTop;
    // The scroll's height with be the same as the last elements offsetTop plus it's height
    this.scrollHeight = this.maxYOffset + lastItem.height;
  }

  toggleScrollAllowed() {
    this.scrollDisabled = !this.scrollDisabled;
  }

  /**
   * Returns the items which are in a2 but not in a1
   */
  differenceAdvanced<T>(a1: T[], a2: T[]) {
    const a1Set = new Set(a1);
    const diff: any[] = [];
    a2.forEach((x, index) => {
      if (!a1Set.has(x)) {
        diff.push({
          value: x,
          index
        });
      }
    });
    return diff;
  }

}
