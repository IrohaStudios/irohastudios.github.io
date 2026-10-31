'use strict';

// Cubism Core evaluates the exported moc3 keyforms; this renderer draws its
// indexed ArtMeshes, including stencil masks for independently moving irises.
class IrohaLive2D {
  static async load(url) {
    const descriptor = await (await fetch(url)).json();
    const base = new URL(url, location.href);
    const bytes = await (await fetch(new URL(descriptor.FileReferences.Moc, base))).arrayBuffer();
    const texture = new Image();
    texture.src = new URL(descriptor.FileReferences.Textures[0], base).href;
    await texture.decode();
    const core = window.Live2DCubismCore;
    if (!core) throw new Error('Cubism Core unavailable');
    const moc = core.Moc.fromArrayBuffer(bytes);
    if (!moc) throw new Error('Invalid moc3');
    const model = core.Model.fromMoc(moc);
    if (!model) throw new Error('Cannot initialize moc3');
    return new IrohaLive2D(moc, model, texture);
  }
  constructor(moc, model, texture) {
    this.moc = moc; this.model = model; this.texture = texture;
    this.indices = new Map(model.parameters.ids.map((id, i) => [id, i]));
    this.renderers = new Map(); this.values = {};
    this.update({});
  }
  update(values) {
    this.values = values;
    const p = this.model.parameters;
    for (let i = 0; i < p.count; i++) p.values[i] = Math.min(p.maximumValues[i], Math.max(p.minimumValues[i], values[p.ids[i]] ?? p.defaultValues[i]));
    this.model.update();
  }
  attach(canvas) {
    if (this.renderers.has(canvas)) return;
    const gl = canvas.getContext('webgl', { alpha: true, stencil: true, antialias: true, premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!gl) throw new Error('WebGL unavailable');
    function shader(type, source) {
      const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    const program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, 'attribute vec2 position; attribute vec2 uv; uniform vec2 fit; varying vec2 texCoord; void main(){gl_Position=vec4(position*2.0*fit,0.0,1.0);texCoord=uv;}'));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, 'precision mediump float; uniform sampler2D atlas; uniform float opacity; varying vec2 texCoord; void main(){vec4 color=texture2D(atlas,texCoord); if(color.a<0.045)discard; gl_FragColor=vec4(color.rgb,color.a*opacity);}'));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const buffers = this.model.drawables.ids.map((_, i) => {
      const position = gl.createBuffer(), uv = gl.createBuffer(), indices = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, uv); gl.bufferData(gl.ARRAY_BUFFER,this.model.drawables.vertexUvs[i],gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indices); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,this.model.drawables.indices[i],gl.STATIC_DRAW);
      return { position, uv, indices };
    });
    this.renderers.set(canvas,{gl,program,buffers,position:gl.getAttribLocation(program,'position'),uv:gl.getAttribLocation(program,'uv'),fit:gl.getUniformLocation(program,'fit'),opacity:gl.getUniformLocation(program,'opacity')});
    canvas.dataset.renderer = 'live2d-cubism';
    canvas.addEventListener('webglcontextlost', event => {event.preventDefault();this.renderers.delete(canvas);canvas.dataset.renderer='context-lost';});
    canvas.addEventListener('webglcontextrestored',()=>this.attach(canvas));
  }
  draw(canvas) {
    const r=this.renderers.get(canvas); if(!r)return;
    const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const dpr=Math.min(devicePixelRatio||1,2);
    const width=Math.round(rect.width*dpr), height=Math.round(rect.height*dpr);
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    const {gl}=r, d=this.model.drawables;
    gl.viewport(0,0,width,height);gl.useProgram(r.program);
    gl.clearColor(0,0,0,0);gl.stencilMask(255);gl.clear(gl.COLOR_BUFFER_BIT|gl.STENCIL_BUFFER_BIT);
    gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);
    const size=Math.min(width,height);
    gl.uniform2f(r.fit,size/width,size/height);
    const drawMesh=i=>{
      const b=r.buffers[i];gl.bindBuffer(gl.ARRAY_BUFFER,b.position);gl.bufferData(gl.ARRAY_BUFFER,d.vertexPositions[i],gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(r.position);gl.vertexAttribPointer(r.position,2,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,b.uv);gl.enableVertexAttribArray(r.uv);gl.vertexAttribPointer(r.uv,2,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b.indices);gl.uniform1f(r.opacity,d.opacities[i]);
      gl.drawElements(gl.TRIANGLES,d.indices[i].length,gl.UNSIGNED_SHORT,0);
    };
    const order=[...d.ids.keys()].sort((a,b)=>d.renderOrders[a]-d.renderOrders[b]);
    for(const i of order){
      if(d.opacities[i]<.001)continue;
      const masks=d.masks[i];
      if(masks.length){
        gl.enable(gl.STENCIL_TEST);gl.stencilMask(255);gl.clear(gl.STENCIL_BUFFER_BIT);
        gl.stencilFunc(gl.ALWAYS,1,255);gl.stencilOp(gl.KEEP,gl.KEEP,gl.REPLACE);
        gl.colorMask(false,false,false,false);for(const mask of masks)drawMesh(mask);gl.colorMask(true,true,true,true);
        gl.stencilFunc(gl.EQUAL,1,255);gl.stencilOp(gl.KEEP,gl.KEEP,gl.KEEP);gl.stencilMask(0);
      } else gl.disable(gl.STENCIL_TEST);
      drawMesh(i);
    }
    gl.disable(gl.STENCIL_TEST);gl.stencilMask(255);
  }
}
window.IrohaLive2D=IrohaLive2D;
