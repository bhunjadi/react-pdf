import Yoga from 'yoga-layout';
import Base from './Base';
import TextEngine from './TextEngine';

const WIDOW_THREASHOLD = 20;

class Text extends Base {
  static defaultProps = {
    wrap: true,
  };

  constructor(root, props) {
    super(root, props);

    this.engine = new TextEngine(this);
    this.layout.setMeasureFunc(this.measureText.bind(this));
    this.renderCallback = props.render;
  }

  get src() {
    return null;
  }

  appendChild(child) {
    if (typeof child === 'string') {
      this.children.push(child);
    } else {
      child.parent = this;
      this.children.push(child);
    }
  }

  removeChild(child) {
    this.children = null;
  }

  measureText(width, widthMode, height, heightMode) {
    // If the text has functions inside, we don't measure dimentions right away,
    // but we keep this until all functions are resolved after the layout stage.
    if (this.renderCallback) {
      return {};
    }

    if (widthMode === Yoga.MEASURE_MODE_EXACTLY) {
      this.engine.layout(width);

      return {
        height: this.style.flexGrow ? NaN : this.engine.height,
      };
    }

    if (
      widthMode === Yoga.MEASURE_MODE_AT_MOST ||
      heightMode === Yoga.MEASURE_MODE_AT_MOST
    ) {
      this.engine.layout(width);

      return {
        height: this.engine.height,
        width: Math.min(width, this.engine.width),
      };
    }

    return {};
  }

  recalculateLayout() {
    this.layout.markDirty();
  }

  isEmpty() {
    return this.engine.lines.length === 0;
  }

  hasOrphans(linesQuantity, slicedLines) {
    return slicedLines === 1 && linesQuantity !== 1;
  }

  hasWidows(linesQuantity, slicedLines) {
    return (
      linesQuantity !== 1 &&
      linesQuantity - slicedLines === 1 &&
      linesQuantity < WIDOW_THREASHOLD
    );
  }

  splice(height) {
    let engine;
    const linesQuantity = this.engine.lines.length;
    const sliceHeight = height - this.marginTop - this.paddingTop;
    const slicedLines = this.engine.lineIndexAtHeight(sliceHeight);

    if (
      this.hasOrphans(linesQuantity, slicedLines) ||
      this.hasWidows(linesQuantity, slicedLines)
    ) {
      engine = this.engine.splice(0);
    } else {
      engine = this.engine.splice(sliceHeight);
    }

    const result = this.clone();

    result.marginTop = 0;
    result.paddingTop = 0;
    result.width = this.width;
    result.marginBottom = this.marginBottom;
    result.engine = engine;
    result.engine.element = result;
    result.height = engine.height + this.paddingBottom + this.marginBottom;

    this.marginBottom = 0;
    this.paddingBottom = 0;
    this.height = height;

    return result;
  }

  async render(page) {
    this.drawBackgroundColor();
    this.drawBorders();

    if (this.props.debug) {
      this.debug();
    }

    this.engine.render();
  }
}

export default Text;
