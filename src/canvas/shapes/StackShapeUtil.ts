import React from 'react';
import { BaseBoxShapeUtil, resizeBox } from '@tldraw/tldraw';
import type { TLBaseShape } from '@tldraw/tldraw';
import { T } from '@tldraw/validate';
import { StackComponent } from './StackComponent.tsx';

export type IStackShape = TLBaseShape<
  'dsa-stack',
  {
    w: number;
    h: number;
    name: string;
    items: (number | string)[];
    maxCapacity: number;
    highlights: Record<string, string>;
    currentOperation: string;
  }
>;

export class StackShapeUtil extends BaseBoxShapeUtil<any> {
  static override type = 'dsa-stack' as const;

  override canResize = () => true;

  override onResize(shape: IStackShape, info: any) {
    return resizeBox(shape as any, info, {
      minWidth: 260,
      minHeight: 220,
    });
  }

  static override props = {
    w: T.number,
    h: T.number,
    name: T.string,
    items: T.arrayOf(T.any),
    maxCapacity: T.number,
    highlights: T.dict(T.string, T.string),
    currentOperation: T.string,
  };

  override getDefaultProps(): IStackShape['props'] {
    return {
      w: 320,
      h: 360,
      name: 'stack',
      items: [10, 20, 30],
      maxCapacity: 8,
      highlights: {},
      currentOperation: 'idle',
    };
  }

  override getIndicatorPath(shape: IStackShape): Path2D {
    if (typeof Path2D !== 'undefined') {
      const path = new Path2D();
      path.rect(0, 0, shape.props.w, shape.props.h);
      return path;
    }
    return {} as Path2D;
  }

  override component(shape: IStackShape) {
    return React.createElement(StackComponent, { shape, util: this });
  }
}
