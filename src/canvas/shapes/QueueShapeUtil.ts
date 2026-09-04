import React from 'react';
import { BaseBoxShapeUtil, resizeBox } from '@tldraw/tldraw';
import type { TLBaseShape } from '@tldraw/tldraw';
import { T } from '@tldraw/validate';
import { QueueComponent } from './QueueComponent.tsx';

export type IQueueShape = TLBaseShape<
  'dsa-queue',
  {
    w: number;
    h: number;
    name: string;
    items: (number | string | null)[];
    front: number;
    rear: number;
    capacity: number;
    isCircular: boolean;
    highlights: Record<string, string>;
    currentOperation: string;
  }
>;

export class QueueShapeUtil extends BaseBoxShapeUtil<any> {
  static override type = 'dsa-queue' as const;

  override canResize = () => true;

  override onResize(shape: IQueueShape, info: any) {
    return resizeBox(shape as any, info, {
      minWidth: 360,
      minHeight: 200,
    });
  }

  static override props = {
    w: T.number,
    h: T.number,
    name: T.string,
    items: T.arrayOf(T.any),
    front: T.number,
    rear: T.number,
    capacity: T.number,
    isCircular: T.boolean,
    highlights: T.dict(T.string, T.string),
    currentOperation: T.string,
  };

  override getDefaultProps(): IQueueShape['props'] {
    return {
      w: 480,
      h: 260,
      name: 'queue',
      items: [10, 20, 30, 40],
      front: 0,
      rear: 3,
      capacity: 6,
      isCircular: false,
      highlights: {},
      currentOperation: 'idle',
    };
  }

  override getIndicatorPath(shape: IQueueShape): Path2D {
    if (typeof Path2D !== 'undefined') {
      const path = new Path2D();
      path.rect(0, 0, shape.props.w, shape.props.h);
      return path;
    }
    return {} as Path2D;
  }

  override component(shape: IQueueShape) {
    return React.createElement(QueueComponent, { shape, util: this });
  }
}
