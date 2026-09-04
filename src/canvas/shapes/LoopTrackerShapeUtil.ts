import React from 'react';
import { BaseBoxShapeUtil, resizeBox } from '@tldraw/tldraw';
import type { TLBaseShape } from '@tldraw/tldraw';
import { T } from '@tldraw/validate';
import { LoopTrackerComponent } from './LoopTrackerComponent.tsx';
import {
  LOOP_TRACKER_SHAPE_TYPE,
  LOOP_TRACKER_DEFAULT_PROPS,
  type LoopTrackerShapeProps,
} from './loopTrackerLogic';

export type ILoopTrackerShape = TLBaseShape<
  typeof LOOP_TRACKER_SHAPE_TYPE,
  LoopTrackerShapeProps
>;

export class LoopTrackerShapeUtil extends BaseBoxShapeUtil<any> {
  static override type = LOOP_TRACKER_SHAPE_TYPE;

  override canResize = () => true;

  override onResize(shape: ILoopTrackerShape, info: any) {
    return resizeBox(shape as any, info, {
      minWidth: 280,
      minHeight: 120,
    });
  }

  static override props = {
    w: T.number,
    h: T.number,
    header: T.string,
    conditionText: T.string,
    currentIteration: T.number,
    totalIterations: T.number,
    isComplete: T.boolean,
    iterationPills: T.arrayOf(T.string),
    evalState: T.string,
  };

  override getDefaultProps(): ILoopTrackerShape['props'] {
    return { ...LOOP_TRACKER_DEFAULT_PROPS };
  }

  override getIndicatorPath(shape: ILoopTrackerShape): Path2D {
    if (typeof Path2D !== 'undefined') {
      const path = new Path2D();
      path.rect(0, 0, shape.props.w, shape.props.h);
      return path;
    }
    return {} as Path2D;
  }

  override component(shape: ILoopTrackerShape) {
    return React.createElement(LoopTrackerComponent, { shape, util: this });
  }
}
