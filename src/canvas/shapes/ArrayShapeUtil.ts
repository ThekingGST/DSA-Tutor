import React from 'react';
import { BaseBoxShapeUtil } from '@tldraw/tldraw';
import type { TLBaseShape } from '@tldraw/tldraw';
import { T } from '@tldraw/validate';
import { ArrayComponent } from './ArrayComponent.tsx';

export type IArrayShape = TLBaseShape<
  'dsa-array',
  {
    w: number;
    h: number;
    name: string;
    values: number[];
    pointers: Record<string, number>;
    highlights: Record<string, string>;
  }
>;

export class ArrayShapeUtil extends BaseBoxShapeUtil<any> {
  static override type = 'dsa-array' as const;

  static override props = {
    w: T.number,
    h: T.number,
    name: T.string,
    values: T.arrayOf(T.number),
    pointers: T.dict(T.string, T.number),
    highlights: T.dict(T.string, T.string),
  };

  override getDefaultProps(): IArrayShape['props'] {
    return {
      w: 560,
      h: 230,
      name: 'arr',
      values: [29, 10, 14, 37, 13],
      pointers: { i: 0, j: 1, pivot: 4 },
      highlights: {},
    };
  }

  override getIndicatorPath(shape: IArrayShape): Path2D {
    if (typeof Path2D !== 'undefined') {
      const path = new Path2D();
      path.rect(0, 0, shape.props.w, shape.props.h);
      return path;
    }
    return {} as Path2D;
  }

  override component(shape: IArrayShape) {
    return React.createElement(ArrayComponent, { shape, util: this });
  }
}
