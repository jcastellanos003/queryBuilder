export interface IQueryMapKeyboard {
    e: KeyboardEvent;
    keyCode: number;
    isCtrl: boolean;
    value: string;
    field: HTMLTextAreaElement;
}

 export interface IChangeObserver {
    oldValue: Object;
    newValue: Object;
  }
