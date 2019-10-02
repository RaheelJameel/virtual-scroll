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

  @Input() inputItems: Item[];

  @ViewChild('jsScroller') scrollerElementRef: ElementRef<HTMLDivElement>;
  @ViewChild('jsScrollerSizer') scrollerSizerElementRef: ElementRef<HTMLDivElement>;
  @ViewChild('jsScrollerOffset') scrollerOffsetElementRef: ElementRef<HTMLDivElement>;
  @ViewChild('testItemComponent') newItemElementRef: ElementRef<HTMLDivElement>;

  fullItems: Item[];
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

  bulkAddAt(...indexes: string[]) {
    console.log('oldItems: ', this.fullItems);
    indexes.forEach((indexString) => {
      if (indexString) {
        const index = parseInt(indexString, 10);
        const newItem = {
          id: this.uuid(),
          name: 'Item',
          height: (Math.floor(Math.random() * 24) + 1) * 25,
          backgroundColour: 'lightgreen',
        };
        this.inputItems.splice(index, 0, newItem);
      }
    });
    console.log('newItems: ', this.inputItems);
    this.onDataChange(this.fullItems, this.inputItems);
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
    this.virtualItems.push(newItem);
    // this.testItem = newItem;
    setTimeout(() => {
      const elementCollection = document.getElementsByClassName('list-row');
      const elementArray = Array.from(elementCollection) as HTMLElement[];
      const newHeight = elementArray[elementArray.length - 1].getBoundingClientRect().height;
      // const newHeight = this.newItemElementRef.nativeElement.getBoundingClientRect().height;
      console.log('newHeight: ', newHeight);
      const nextRenderedItem = this.renderedItems[this.newIndex];
      const newRenderedItem: RenderedItem = {
        offsetTop: nextRenderedItem.offsetTop,
        item: newItem
      };
      const newFullItems = Array.from(this.fullItems);
      newFullItems.splice(this.newIndex, 0, newItem);
      this.fullItems = newFullItems;
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

  onDataChange(oldItems: Item[], newItems: Item[]) {
    const additionDifference = this.differenceAdvanced(oldItems, newItems);
    const addedItems: Item[] = additionDifference.map(diff => diff.value);
    this.virtualItems = this.virtualItems.concat(addedItems);
    setTimeout(() => {
      const elementCollection = document.getElementsByClassName('list-row');
      const elementArray = Array.from(elementCollection) as HTMLElement[];
      const addedItemElements = elementArray.slice(elementArray.length - addedItems.length);
      additionDifference.forEach((diff, index) => {
        diff.height = addedItemElements[index].getBoundingClientRect().height;
      });

      let diffIndex = 0;
      let findIndex = additionDifference[diffIndex].index;
      let heightAddition = 0;
      let renderedItemIndex = 0;
      // this.renderedItems.forEach((renderedItem, renderedItemIndex) => {
      // const copiedArray = Array.from(this.renderedItems);
      // console.log('copiedArray: ', copiedArray);
      // console.log('copiedArray[1]: ', copiedArray[1]);
      console.log('oldRenderedItems: ', JSON.parse(JSON.stringify(this.renderedItems)));
      console.log('oldRenderedItems[1]: ', JSON.parse(JSON.stringify(this.renderedItems[1])));
      for (
        let renderedItem = this.renderedItems[renderedItemIndex];
        renderedItemIndex < this.renderedItems.length;
        renderedItemIndex++, renderedItem = this.renderedItems[renderedItemIndex]
      ) {
        if (renderedItemIndex === findIndex) {
          console.log('this.renderedItems[1]: ', this.renderedItems[1]);
          console.log('renderedItem.offsetTop: ', renderedItem.offsetTop);
          const newRenderedItem: RenderedItem = {
            offsetTop: renderedItem.offsetTop + heightAddition,
            item: additionDifference[diffIndex].value
          };
          this.renderedItems.splice(renderedItemIndex, 0, newRenderedItem);
          heightAddition += additionDifference[diffIndex].height;
          diffIndex++;
          findIndex = additionDifference[diffIndex] && additionDifference[diffIndex].index;
        } else {
          console.log('add: ', heightAddition);
          renderedItem.offsetTop += heightAddition;
        }
      }
      this.virtualItems = newItems.slice(this.startIndex, this.endIndex);
      console.log('newRenderedItems: ', this.renderedItems);
    });
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
