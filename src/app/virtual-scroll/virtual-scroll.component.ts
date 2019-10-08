import { Component, OnInit, AfterViewInit, Input, ViewChild, ElementRef } from '@angular/core';
import { Item } from '../app.interface';

const OFFSET_COUNT = 10;

export interface RenderedItemData {
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

  // These are the input items
  // Any addition or deletion will first take place in this array
  @Input() inputItems: Item[];

  @ViewChild('scrollParent') scrollParentElementRef: ElementRef<HTMLDivElement>;
  get scrollParentDiv(): HTMLDivElement | undefined {
    return this.scrollParentElementRef && this.scrollParentElementRef.nativeElement;
  }

  @ViewChild('scrollItems') scrollItemsElementRef: ElementRef<HTMLDivElement>;
  get scrollItemsDiv(): HTMLDivElement | undefined {
    return this.scrollItemsElementRef && this.scrollItemsElementRef.nativeElement;
  }

  // This is the internal full array of all known items used by Virtual Scroll
  fullItems: Item[];
  // This is the data array of the full Items
  renderedItemDataArray: RenderedItemData[];
  // These are the items currently rendered in the DOM
  virtualItems: Item[];
  // Start Index of the currently rendered item
  startIndex = 0;
  // End Index of the currently rendered item
  endIndex = OFFSET_COUNT;
  // Offset Top of the last item of all the known items
  maxYOffset: number;
  // The total height of the Scroll (Last Item Offset Top + Last Item Height)
  scrollHeight: number;
  // Current state of the scroll handler
  scrollDisabled: boolean;

  // Seed value for generating new items
  // Not part of Virtual Scroll Logic
  seedValue = 0;

  constructor() { }

  ngOnInit() {
    // Make a copy of the input items
    this.fullItems = Array.from(this.inputItems);
    // Render all full Items on Scroll Start
    this.virtualItems = this.fullItems.slice(0, this.fullItems.length);
  }

  ngAfterViewInit() {
    // Wait a Tick for Angular to render all items
    setTimeout(() => {
      const renderedItems: RenderedItemData[] = [];

      const elementCollection = this.scrollItemsDiv.getElementsByClassName('list-row');
      const elementArray = Array.from(elementCollection) as HTMLElement[];

      // Loop through each of the rendered items, creating an object keyed by each
      // elements offsetTop, it's rendered height and storing the element itself as the value.
      elementArray.forEach((element, index) => {
        renderedItems.push({
          offsetTop: element.offsetTop,
          height: element.getBoundingClientRect().height,
          item: this.fullItems[index]
        });
      });

      this.renderedItemDataArray = renderedItems;

      this.setScrollHeight();
      // Now reassign the Virtual items according to the start and end indexes
      this.virtualItems = this.fullItems.slice(this.startIndex, this.endIndex);
    });
  }

  trackByFn(index: number, item: Item) {
    return item.id;
  }

  onScroll() {
    if (!this.scrollDisabled) {
      this.handleScroll();
    }
  }

  handleScroll() {
    // Get the user's current scroll position
    const scrollPosition = this.scrollParentDiv.scrollTop;

    // If we are already at the bottom of the list then don't do anything else
    if (scrollPosition >= this.maxYOffset) {
      // Ensure the offset does not exceed the scroll-size height
      this.updateOffsetYPosition(this.maxYOffset);
      return;
    }

    // Find the closest row to our current scroll position
    const closestRowIndex = this.findClosestItemIndex(scrollPosition);

    // Find the rows that we need to render using the OFFSET_COUNT buffer
    this.startIndex = (closestRowIndex - OFFSET_COUNT) >= 0 ? (closestRowIndex - OFFSET_COUNT) : 0;
    this.endIndex = (closestRowIndex + OFFSET_COUNT) <= this.renderedItemDataArray.length ? (closestRowIndex + OFFSET_COUNT) : this.renderedItemDataArray.length;

    const newDataArray = this.renderedItemDataArray.slice(this.startIndex, this.endIndex);
    this.virtualItems = newDataArray.map(item => item.item);

    // Being to update the offset's Y position once we have rendered at least 10 elements
    const updatePosition = Math.max(0, closestRowIndex - OFFSET_COUNT) === 0 ? 0 : newDataArray[0].offsetTop;

    this.updateOffsetYPosition(updatePosition);
  }

   findClosestItemIndex(scrollPosition: number) {
    let current = this.renderedItemDataArray[0].offsetTop;
    let currentIndex = 0;
    let difference = Math.abs(scrollPosition - current);

    for (let val = 0; val < this.renderedItemDataArray.length; val++) {
      const newDifference = Math.abs(scrollPosition - this.renderedItemDataArray[val].offsetTop);

      if (newDifference < difference) {
        difference = newDifference;
        current = this.renderedItemDataArray[val].offsetTop;
        currentIndex = val;
      }
    }
    return currentIndex;
  }

  updateOffsetYPosition(position: number) {
    this.scrollItemsDiv.style.transform = `translateY(${position}px)`;
  }

  bulkAddAt(...indexes: string[]) {
    indexes.forEach((indexString) => {
      if (indexString) {
        const index = parseInt(indexString, 10);
        const newItem = {
          id: this.uuid(),
          name: 'Item',
          height: 40 + (Math.floor(Math.random() * 261)),
          backgroundColour: 'lightgreen',
        };
        this.inputItems.splice(index, 0, newItem);
      }
    });
    this.onDataChange(this.fullItems, this.inputItems);
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
    const additionDifference = this.differenceAdvanced(oldItems, newItems);
    if (additionDifference.length) {
      this.handleAddChange(additionDifference, newItems);
    } else {
      const deletionDifference = this.differenceAdvanced(newItems, oldItems);
      if (deletionDifference.length) {
        this.handleDeleteChange(deletionDifference, newItems);
      }
    }
  }

  handleAddChange(additionDifference: any[], newItems: Item[]) {
    const addedItems: Item[] = additionDifference.map(diff => diff.value);

    // Get the user's current scroll position
    const scrollPosition = this.scrollParentDiv.scrollTop;

    // Render these new Items in the end of the array
    this.virtualItems = this.virtualItems.concat(addedItems);

    // Wait a tick for Angular to render the items
    setTimeout(() => {
      const elementCollection = this.scrollItemsDiv.getElementsByClassName('list-row');
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
      for (
        let renderedItem = this.renderedItemDataArray[renderedItemIndex];
        renderedItemIndex < this.renderedItemDataArray.length;
        renderedItemIndex++, renderedItem = this.renderedItemDataArray[renderedItemIndex]
      ) {
        if (renderedItemIndex === findIndex) {
          const newRenderedItem: RenderedItemData = {
            offsetTop: renderedItem.offsetTop + heightAddition,
            height: additionDifference[diffIndex].height,
            item: additionDifference[diffIndex].value
          };
          this.renderedItemDataArray.splice(renderedItemIndex, 0, newRenderedItem);
          heightAddition += additionDifference[diffIndex].height;
          diffIndex++;
          findIndex = additionDifference[diffIndex] && additionDifference[diffIndex].index;
        } else {
          renderedItem.offsetTop += heightAddition;
        }
      }

      this.virtualItems = newItems.slice(this.startIndex, this.endIndex);
      this.fullItems = Array.from(newItems);

      this.setScrollHeight();

      // Wait a Tick for new Items to be rendered
      setTimeout(() => {
        // Now set the scroll to it's previous position before the change
        this.scrollParentDiv.scrollTo({ top: scrollPosition });
      });
    });
  }

  handleDeleteChange(deletionDifference: any[], newItems: Item[]) {
    let diffIndex = 0;
    let findIndex = deletionDifference[diffIndex] && deletionDifference[diffIndex].index;
    let heightSubtraction = 0;
    // Following loop is not a simple for loop, as the array being iterated is being mutated in the loop
    // tslint:disable-next-line: prefer-for-of
    for (
      let index = 0, renderedItem = this.renderedItemDataArray[index];
      index < this.renderedItemDataArray.length;
      index++, renderedItem = this.renderedItemDataArray[index]
    ) {
      if (index === findIndex) {
        heightSubtraction += renderedItem.height;
        this.renderedItemDataArray.splice(index, 1);
        index--;
        diffIndex++;
        findIndex = deletionDifference[diffIndex] && deletionDifference[diffIndex].index;
      } else {
        renderedItem.offsetTop -= heightSubtraction;
      }
    }

    // Get the user's current scroll position
    const scrollPosition = this.scrollParentDiv.scrollTop;

    this.virtualItems = newItems.slice(this.startIndex, this.endIndex);

    this.fullItems = Array.from(newItems);

    this.setScrollHeight();

    // Wait a Tick for new Items to be rendered
    setTimeout(() => {
      // Now set the scroll to it's previous position before the change
      this.scrollParentDiv.scrollTo({ top: scrollPosition });
    });
  }

  setScrollHeight() {
    const lastItem = this.renderedItemDataArray[this.renderedItemDataArray.length - 1];
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
