import React from 'react';
import { BaseBoxShapeUtil, resizeBox } from '@tldraw/tldraw';
import type { TLBaseShape } from '@tldraw/tldraw';
import { T } from '@tldraw/validate';
import { LinkedListComponent } from './LinkedListComponent.tsx';
import {
  LINKED_LIST_SHAPE_TYPE,
  LINKED_LIST_DEFAULT_PROPS,
  type LinkedListNodeShapeProps,
} from './linkedListLogic';
import { LINKED_LIST_PANEL_CONSTANTS } from './panelLayoutLogic';

export type ILinkedListNodeShape = TLBaseShape<
  typeof LINKED_LIST_SHAPE_TYPE,
  LinkedListNodeShapeProps
>;

export class LinkedListNodeShapeUtil extends BaseBoxShapeUtil<any> {
  static override type = LINKED_LIST_SHAPE_TYPE;

  override canResize = () => true;

  override onResize(shape: ILinkedListNodeShape, info: any) {
    return resizeBox(shape as any, info, {
      minWidth: LINKED_LIST_PANEL_CONSTANTS.MIN_WIDTH,
      minHeight: LINKED_LIST_PANEL_CONSTANTS.MIN_HEIGHT,
    });
  }

  static override props = {
    w: T.number,
    h: T.number,
    nodeId: T.string,
    value: T.any,
    nextId: T.nullable(T.string),
    pointers: T.arrayOf(T.string),
    highlight: T.string,
  };

  override getDefaultProps(): ILinkedListNodeShape['props'] {
    return {
      ...LINKED_LIST_DEFAULT_PROPS,
      w: LINKED_LIST_PANEL_CONSTANTS.MIN_WIDTH,
      h: LINKED_LIST_PANEL_CONSTANTS.MIN_HEIGHT,
    };
  }

  override getIndicatorPath(shape: ILinkedListNodeShape): Path2D {
    if (typeof Path2D !== 'undefined') {
      const path = new Path2D();
      path.rect(0, 0, shape.props.w, shape.props.h);
      return path;
    }
    return {} as Path2D;
  }

  override component(shape: ILinkedListNodeShape) {
    return React.createElement(LinkedListComponent, { shape, util: this });
  }
}
