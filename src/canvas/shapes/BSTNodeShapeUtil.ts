import React from 'react';
import { BaseBoxShapeUtil } from '@tldraw/tldraw';
import type { TLBaseShape } from '@tldraw/tldraw';
import { T } from '@tldraw/validate';
import { BSTNodeComponent } from './BSTNodeComponent.tsx';
import {
  TREE_NODE_SHAPE_TYPE,
  TREE_NODE_DEFAULT_PROPS,
  type TreeNodeShapeProps,
} from './treeLayoutLogic';

export type ITreeNodeShape = TLBaseShape<typeof TREE_NODE_SHAPE_TYPE, TreeNodeShapeProps>;

export class BSTNodeShapeUtil extends BaseBoxShapeUtil<any> {
  static override type = TREE_NODE_SHAPE_TYPE;

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
    return { ...TREE_NODE_DEFAULT_PROPS };
  }

  override getIndicatorPath(shape: ITreeNodeShape): Path2D {
    if (typeof Path2D !== 'undefined') {
      const path = new Path2D();
      path.arc(shape.props.w / 2, shape.props.h / 2, shape.props.w / 2, 0, Math.PI * 2);
      return path;
    }
    return {} as Path2D;
  }

  override component(shape: ITreeNodeShape) {
    return React.createElement(BSTNodeComponent, { shape, util: this });
  }
}
