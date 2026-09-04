import React from 'react';
import { BaseBoxShapeUtil, resizeBox } from '@tldraw/tldraw';
import type { TLBaseShape } from '@tldraw/tldraw';
import { T } from '@tldraw/validate';
import { BSTNodeComponent } from './BSTNodeComponent.tsx';
import {
  TREE_NODE_SHAPE_TYPE,
  TREE_NODE_DEFAULT_PROPS,
  type TreeNodeShapeProps,
} from './treeLayoutLogic';
import { TREE_NODE_PANEL_CONSTANTS } from './panelLayoutLogic';

export type ITreeNodeShape = TLBaseShape<typeof TREE_NODE_SHAPE_TYPE, TreeNodeShapeProps>;

export class BSTNodeShapeUtil extends BaseBoxShapeUtil<any> {
  static override type = TREE_NODE_SHAPE_TYPE;

  override canResize = () => true;

  override onResize(shape: ITreeNodeShape, info: any) {
    return resizeBox(shape as any, info, {
      minWidth: TREE_NODE_PANEL_CONSTANTS.MIN_WIDTH,
      minHeight: TREE_NODE_PANEL_CONSTANTS.MIN_HEIGHT,
    });
  }

  static override props = {
    w: T.number,
    h: T.number,
    nodeId: T.string,
    value: T.number,
    leftId: T.nullable(T.string),
    rightId: T.nullable(T.string),
    parentId: T.nullable(T.string),
    highlight: T.string,
    branchLabel: T.optional(T.string),
  };

  override getDefaultProps(): ITreeNodeShape['props'] {
    return {
      ...TREE_NODE_DEFAULT_PROPS,
      w: TREE_NODE_PANEL_CONSTANTS.MIN_WIDTH,
      h: TREE_NODE_PANEL_CONSTANTS.MIN_HEIGHT,
    };
  }

  override getIndicatorPath(shape: ITreeNodeShape): Path2D {
    if (typeof Path2D !== 'undefined') {
      const path = new Path2D();
      const radius = Math.min(shape.props.w, shape.props.h) / 2;
      path.arc(shape.props.w / 2, shape.props.h / 2, radius, 0, Math.PI * 2);
      return path;
    }
    return {} as Path2D;
  }

  override component(shape: ITreeNodeShape) {
    return React.createElement(BSTNodeComponent, { shape, util: this });
  }
}
