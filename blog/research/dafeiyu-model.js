'use strict';

// Adapter for the pinned Pixi/Cubism renderer shipped by dsh-pet-live2d.
// The page owns the animation clock so pause, hidden tabs and audio seeks stay in sync.
class DafeiyuLive2D {
  static async load(url) {
    const vendor = window.__dshLive2dPetVendor;
    if (!vendor || !window.Live2DCubismCore) throw new Error('Live2D runtime unavailable');
    vendor.extensions.add(vendor.Live2DPlugin);
    vendor.configureCubismSDK({ memorySizeMB: 64 });
    const base = new URL(url, location.href);
    const names = {joy: 'excited', anger: 'angry', sadness: 'sad', surprise: 'exclaim'};
    const expressions = Object.fromEntries(await Promise.all(Object.entries(names).map(async ([emotion, name]) => {
      const response = await fetch(new URL(`expressions/${name}.exp3.json`, base));
      if (!response.ok) throw new Error(`Expression unavailable: ${emotion}`);
      return [emotion, (await response.json()).Parameters];
    })));
    const model = await vendor.Live2DModel.from(base.href, {
      autoUpdate: false, autoHitTest: false, autoFocus: false, eyeBlink: false,
      textureOptions: {lod: 'full'},
    });
    return new DafeiyuLive2D(vendor, model, expressions);
  }

  constructor(vendor, model, expressions) {
    this.vendor = vendor;
    this.model = model;
    this.expressions = expressions;
    this.values = {};
    this.emotion = 'joy';
    this.lastParameters = {};
    this.expressionIds = new Set(Object.values(expressions).flat().map(p => p.Id));
    this.sourceWidth = model.internalModel.originalWidth;
    this.sourceHeight = model.internalModel.originalHeight;
    this.core = model.internalModel.coreModel;
    this.indices = new Map(this.core._model.parameters.ids.map((id, i) => [id, i]));
    model.internalModel.on('beforeModelUpdate', () => this.applyParameters());
  }

  async attach(canvas) {
    this.canvas = canvas;
    this.app = new this.vendor.Application();
    await this.app.init({canvas, width: 190, height: 210, backgroundAlpha: 0,
      autoStart: false, sharedTicker: false, antialias: true, autoDensity: false,
      resolution: Math.min(devicePixelRatio || 1, 2), preference: 'webgl',
      preserveDrawingBuffer: true});
    this.app.stop();
    this.model.automator.autoUpdate = false;
    this.app.stage.addChild(this.model);
    this.model.anchor.set(.5, .5);
    canvas.dataset.renderer = 'live2d-cubism';
    canvas.dataset.character = 'dafeiyu';
  }

  update(values) { this.values = values; this.applyParameters(); }
  setEmotion(emotion) { this.emotion = emotion in this.expressions ? emotion : 'joy'; }

  applyParameters() {
    const p = this.core._model.parameters;
    const desired = {};
    // Reset the previous expression to model defaults before applying the next.
    for (const id of this.expressionIds) {
      const index = this.indices.get(id);
      if (index !== undefined) desired[id] = p.defaultValues[index];
    }
    for (const entry of this.expressions[this.emotion]) {
      const current = desired[entry.Id] ?? 0;
      desired[entry.Id] = entry.Blend === 'Multiply' ? current * entry.Value
        : entry.Blend === 'Overwrite' ? entry.Value : current + entry.Value;
    }
    // Audio and pointer parameters take precedence; expression eyebrows remain intact.
    for (const [id, value] of Object.entries(this.values)) {
      if (id.startsWith('ParamBrow')) continue;
      desired[id] = value;
    }
    this.lastParameters = {};
    for (const [id, value] of Object.entries(desired)) {
      const index = this.indices.get(id);
      if (index === undefined) continue;
      const clamped = Math.min(p.maximumValues[index], Math.max(p.minimumValues[index], value));
      this.core.setParameterValueById(id, clamped);
      this.lastParameters[id] = clamped;
    }
  }

  draw(canvas, dt = 0) {
    if (!this.app) return;
    const {width, height} = canvas.getBoundingClientRect();
    if (!width || !height) return;
    if (width !== this.width || height !== this.height) {
      this.width = width; this.height = height;
      this.app.renderer.resize(width, height);
      this.model.scale.set(Math.min(width / this.sourceWidth, height / this.sourceHeight) * .96);
      this.model.position.set(width / 2, height / 2);
    }
    // A tiny step permits a forced closed-mouth repaint while motion is paused.
    this.model.update(Math.max(.001, dt * 1000));
    this.app.render();
  }
}
window.DafeiyuLive2D = DafeiyuLive2D;
