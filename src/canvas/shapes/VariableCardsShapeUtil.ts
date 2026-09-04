import React from 'react';
import { BaseBoxShapeUtil, resizeBox } from '@tldraw/tldraw';
import type { TLBaseShape } from '@tldraw/tldraw';
import { T } from '@tldraw/validate';
import { VariableCardsComponent } from './VariableCardsComponent.tsx';
import {
  VARIABLE_CARDS_SHAPE_TYPE,
  VARIABLE_CARDS_DEFAULT_PROPS,
  type VariableCardsShapeProps,
} from './variableCardsLogic';

import { PANEL_CONSTANTS } from './panelLayoutLogic';

export type IVariableCardsShape = TLBaseShape<
  typeof VARIABLE_CARDS_SHAPE_TYPE,
  VariableCardsShapeProps
>;

export class VariableCardsShapeUtil extends BaseBoxShapeUtil<any> {
  static override type = VARIABLE_CARDS_SHAPE_TYPE;

  override canResize = () => true;

  override onResize(shape: IVariableCardsShape, info: any) {
    return resizeBox(shape as any, info, {
      minWidth: PANEL_CONSTANTS.MIN_WIDTH,
      minHeight: PANEL_CONSTANTS.MIN_HEIGHT,
    });
  }

  static override props = {
    w: T.number,
    h: T.number,
    title: T.string,
    variables: T.arrayOf(T.any),
  };

  override getDefaultProps(): IVariableCardsShape['props'] {
    return {
      ...VARIABLE_CARDS_DEFAULT_PROPS,
      w: PANEL_CONSTANTS.MIN_WIDTH,
      h: PANEL_CONSTANTS.MIN_HEIGHT,
    };
  }

  override getIndicatorPath(shape: IVariableCardsShape): Path2D {
    if (typeof Path2D !== 'undefined') {
      const path = new Path2D();
      path.rect(0, 0, shape.props.w, shape.props.h);
      return path;
    }
    return {} as Path2D;
  }

  override component(shape: IVariableCardsShape) {
    return React.createElement(VariableCardsComponent, { shape, util: this });
  }
}
