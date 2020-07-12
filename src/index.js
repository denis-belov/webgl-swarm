/*
eslint-disable
no-console,
array-element-newline,
id-length,
id-match,
func-style,
no-magic-numbers,
camelcase,
no-bitwise,
no-multiple-empty-lines,
max-statements,
max-len,
prefer-destructuring,
no-constant-condition,
*/

import './index.scss';

import * as THREE from 'three';

import Vec2 from '../../vec/src/data-objects/Vec2';
import Vec3 from '../../vec/src/data-objects/Vec3';
import Mat4 from '../../vec/src/data-objects/Mat4';
import Obj from '../../vec/src/derivatives/Obj';

const canvas_size_multiplier = 2;

const dpr = window.devicePixelRatio || 1;

const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth * dpr;
canvas.height = window.innerHeight * dpr;

const gl = canvas.getContext('webgl', { antialias: false });

gl.getExtension('OES_texture_float');
gl.getExtension('OES_element_index_uint');
gl.clearColor(0, 0, 0, 0);
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LESS);



const size = 1024 * 1024;



// let frame_time = 0;
// let last_time = new Date();
let global_time = 0;



const light_position = new Vec3();
const mouse = new Vec2();
const v1 = new Vec3();

class Camera {
  constructor() {
    this.obj = new Obj();

    this.obj.translation.set(0, 0, 150);
    this.obj.origin.set(0, 0, -150);
    this.obj.update();

    this.view_mat = new Mat4()
      .copy(this.obj.matrix)
      .inverse();

    this.proj_mat = new Mat4().makePerspectiveProjection2(45, window.innerWidth / window.innerHeight, 1, 2000, 1);

    const canvas_mousemove_callback1 = (evt) => {
      const w = (evt.clientX / window.innerWidth * 2) - 1;
      const h = 1 - (evt.clientY / window.innerHeight * 2);

      light_position
        .set(w, 1 - h, 0)
        .unproject(this.view_mat, this.proj_mat);

      v1.directToScreenCoords(w, h, this.view_mat, this.proj_mat);

      light_position.add(v1.mulS(150));

      mouse.set(w, h, 0);
    };

    const canvas_mousemove_callback2 = (evt) => {
      this.obj.preRotateX(evt.movementY * 0.01);
      this.obj.preRotateY(evt.movementX * 0.01);
      this.obj.update();
      this.view_mat
        .copy(this.obj.matrix)
        .inverse();
    };

    canvas.addEventListener('mousedown', () => {
      canvas.removeEventListener('mousemove', canvas_mousemove_callback1);
      canvas.addEventListener('mousemove', canvas_mousemove_callback2);
    });

    canvas.addEventListener('mouseup', () => {
      canvas.removeEventListener('mousemove', canvas_mousemove_callback2);
      canvas.addEventListener('mousemove', canvas_mousemove_callback1);
    });

    canvas.addEventListener('mousemove', canvas_mousemove_callback1);

    // setInterval(() => {
    //   const x = Math.random() * 2 - 1;
    //   const y = Math.random() * 2 - 1;

    //   light_position
    //     .set(x, x, 0)
    //     .unproject(this.view_mat, this.proj_mat);

    //   mouse.set(x, y, 0);

    //   v1.directToScreenCoords(x, y, this.view_mat, this.proj_mat);
    //   light_position.add(v1.mulS(150));
    // }, 3000);
  }
}



const v2 = new Vec3();
const m = new Mat4();
const points = [];

const vvv = new Vec3();

for (let i = 0; i < 512; i++) {
  v1
    .set(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    )
    .normalize()
    .mulS(20);

  v2
    .set(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    )
    .normalize();

  while (1) {
    m.postRotate(v2, Math.random() * Math.PI);

    v1.applyMat4(m);

    const dot = vvv.dot(v1.clone().normalize());

    if (Math.abs(dot) < 0.5) {
      vvv.copy(v1).negate().normalize();

      break;
    } else {
      vvv.copy(v1).negate().normalize();
    }
  }

  points.push(
    v1.clone(),
    v1.clone().negate(),
  );
}

const spline_points = Vec3.makeCatmullRomSpline3PointsClosed(points, 1024, 1, v1, v2);
const spline_texture_data = new Float32Array(1024 * 1024 * 4);

for (let i = 0; i < spline_points.length; i++) {
  spline_texture_data[(i * 4) + 0] = spline_points[i].arr[0];
  spline_texture_data[(i * 4) + 1] = spline_points[i].arr[1];
  spline_texture_data[(i * 4) + 2] = spline_points[i].arr[2];
}



const spline_texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, spline_texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 1024, 0, gl.RGBA, gl.FLOAT, spline_texture_data);
gl.bindTexture(gl.TEXTURE_2D, null);



const param_texture_data = new Float32Array(32 * 32 * 4);

let n = 0;
let n2 = 0;
let pp = 0;
let r2 = Math.random();

for (let i = 0; i < 1024; i++) {
  if (i % 128 === 0) {
    n += 1024 * 10;
    n2 += (1024 * 10) + 1000;
    r2 = Math.random();
  }

  const r = Math.random();

  param_texture_data[(i * 4) + 0] = r;
  param_texture_data[(i * 4) + 1] = (i / 2) + n;
  param_texture_data[(i * 4) + 2] = (i / 2) + (pp ? n2 : -n2);
  param_texture_data[(i * 4) + 3] = r2;
  pp = 1 - pp;
}

const param_texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, param_texture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 32, 32, 0, gl.RGBA, gl.FLOAT, param_texture_data);
gl.bindTexture(gl.TEXTURE_2D, null);

const fb_tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, fb_tex);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024 * canvas_size_multiplier, 1024 * canvas_size_multiplier, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
gl.bindTexture(gl.TEXTURE_2D, null);

const fb_tex2 = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, fb_tex2);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024 * canvas_size_multiplier, 1024 * canvas_size_multiplier, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
gl.bindTexture(gl.TEXTURE_2D, null);


const fb_tex3 = [ gl.createTexture(), gl.createTexture() ];
gl.bindTexture(gl.TEXTURE_2D, fb_tex3[0]);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024 * canvas_size_multiplier, 1024 * canvas_size_multiplier, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
gl.bindTexture(gl.TEXTURE_2D, null);
gl.bindTexture(gl.TEXTURE_2D, fb_tex3[1]);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024 * canvas_size_multiplier, 1024 * canvas_size_multiplier, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
gl.bindTexture(gl.TEXTURE_2D, null);
let fbt3 = 0;



const fb_rend = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, fb_rend);
gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 1024 * canvas_size_multiplier, 1024 * canvas_size_multiplier);
gl.bindRenderbuffer(gl.RENDERBUFFER, null);

const fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, fb_rend);
gl.bindFramebuffer(gl.FRAMEBUFFER, null);



const fb_tex4 = [ gl.createTexture(), gl.createTexture() ];
gl.bindTexture(gl.TEXTURE_2D, fb_tex4[0]);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 32, 32, 0, gl.RGBA, gl.FLOAT, null);
gl.bindTexture(gl.TEXTURE_2D, null);
gl.bindTexture(gl.TEXTURE_2D, fb_tex4[1]);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 32, 32, 0, gl.RGBA, gl.FLOAT, null);
gl.bindTexture(gl.TEXTURE_2D, null);
let fbt4 = 0;



const fb2 = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb2);
gl.bindFramebuffer(gl.FRAMEBUFFER, null);



gl.activeTexture(gl.TEXTURE4);
gl.bindTexture(gl.TEXTURE_2D, param_texture);

gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, spline_texture);

gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D, fb_tex);

gl.activeTexture(gl.TEXTURE2);
gl.bindTexture(gl.TEXTURE_2D, fb_tex2);

gl.activeTexture(gl.TEXTURE3);
gl.bindTexture(gl.TEXTURE_2D, fb_tex3[0]);

gl.activeTexture(gl.TEXTURE5);
gl.bindTexture(gl.TEXTURE_2D, fb_tex4[0]);



class Trans {
  constructor() {
    this.geometry = new Float32Array([ -1, -1, 0, -1, 1, 0, 1, 1, 0, 1, 1, 0, 1, -1, 0, -1, -1, 0 ]);

    this.program = gl.createProgram();

    this.vs_code = `
      attribute vec3 position;

      varying vec2 v_pos;

      void main (void) {

        v_pos = position.xy;

        gl_Position = vec4(position, 1.0);
      }
    `;

    this.vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(this.vs, this.vs_code);
    gl.compileShader(this.vs);
    if (!gl.getShaderParameter(this.vs, gl.COMPILE_STATUS)) {
      const strOut = `\n${ this.vs_code.split('\n').map((elm, i) => `${ i + 1 }:${ elm }`).join('\n') }\n`;
      throw new Error(`${ strOut }${ gl.getShaderInfoLog(this.vs) }`);
    }
    gl.attachShader(this.program, this.vs);

    this.fs_code = `
      precision highp float;

      uniform sampler2D SPLINE;
      uniform sampler2D PARAMS;
      uniform sampler2D SELF;
      uniform float time;
      uniform vec3 light_position;

      varying vec2 v_pos;

      struct Points {

        vec3 p1;
        vec3 p2;
      };

      Points getPoints(int param_loc) {

        vec4 params = texture2D(PARAMS, v_pos * 0.5 + 0.5);

        float param2 = param_loc == 0 ? params.y : params.z;

        float a = fract((time + param2 * 10.0) / ${ size }.0) * ${ size }.0;
        float b = a - 1.0;
        float c = a + 1.0;

        float x_pos2 = fract(b / 1024.0) + (0.5 / 1024.0);
        float y_pos2 = (floor(b / 1024.0) / 1024.0) + (0.5 / 1024.0);

        float x_pos3 = fract(c / 1024.0) + (0.5 / 1024.0);
        float y_pos3 = (floor(c / 1024.0) / 1024.0) + (0.5 / 1024.0);

        vec3 point_prev = texture2D(SPLINE, vec2(x_pos2, y_pos2)).rgb;
        vec3 point_next = texture2D(SPLINE, vec2(x_pos3, y_pos3)).rgb;

        Points points;

        points.p1 = point_prev;
        points.p2 = point_next;

        return points;
      }

      void main (void) {

        float interp = sin((fract(time / ${ size }.0)) * 1000.0 * texture2D(PARAMS, v_pos * 0.5 + 0.5).w) * 0.5 + 0.5;

        Points points = getPoints(0);
        Points points2 = getPoints(1);

        vec3 point_prev = mix(points.p1, points2.p1, interp);
        vec3 point_next = mix(points.p2, points2.p2, interp);

        vec3 normal_dst = normalize(point_prev - point_next);

        normal_dst = normalize(point_prev - point_next);

        vec3 prev_trans = texture2D(SELF, v_pos * 0.5 + 0.5).rgb;

        vec3 dir1 = normalize(normal_dst + normalize(prev_trans - light_position));

        vec3 dir2 = normalize(prev_trans - light_position);

        float dot_ = dot(dir1, dir2);

        vec3 next_trans = (light_position - prev_trans) * 0.02 * ((dot_ - 0.5) * 2.0);

        if (dot_ > 0.5) {

          gl_FragColor = vec4(prev_trans + next_trans, (dot_ - 0.5) * 2.0);
        }
        else {

          gl_FragColor = vec4(prev_trans, 0.0);
        }
      }
    `;

    this.fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(this.fs, this.fs_code);
    gl.compileShader(this.fs);
    if (!gl.getShaderParameter(this.fs, gl.COMPILE_STATUS)) {
      const strOut = `\n${ this.fs_code.split('\n').map((elm, i) => `${ i + 1 }:${ elm }`).join('\n') }\n`;
      throw new Error(`${ strOut }${ gl.getShaderInfoLog(this.fs) }`);
    }
    gl.attachShader(this.program, this.fs);

    this.position_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.geometry.buffer, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.linkProgram(this.program);

    this.position_attr = gl.getAttribLocation(this.program, 'position');

    this.time = gl.getUniformLocation(this.program, 'time');
    this.light_position = gl.getUniformLocation(this.program, 'light_position');

    gl.useProgram(this.program);
    gl.uniform1i(gl.getUniformLocation(this.program, 'SPLINE'), 0);
    gl.uniform1i(gl.getUniformLocation(this.program, 'PARAMS'), 4);
    gl.uniform1i(gl.getUniformLocation(this.program, 'SELF'), 5);
    gl.useProgram(null);

    gl.enableVertexAttribArray(this.position_attr);
  }

  draw() {
    gl.useProgram(this.program);
    gl.uniform1f(this.time, global_time);
    gl.uniform3fv(this.light_position, light_position.arr);
    // gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.vertexAttribPointer(this.position_attr, 3, gl.FLOAT, 0, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}



class BloomSurface {
  constructor() {
    this.geometry = new Float32Array([ -1, -1, 0, -1, 1, 0, 1, 1, 0, 1, 1, 0, 1, -1, 0, -1, -1, 0 ]);

    this.obj = new Obj();

    this.program = gl.createProgram();

    this.vs_code = `
      attribute vec3 position;

      varying vec2 v_pos;

      void main (void) {

        v_pos = position.xy;

        gl_Position = vec4(position, 1.0);
      }
    `;

    this.vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(this.vs, this.vs_code);
    gl.compileShader(this.vs);
    if (!gl.getShaderParameter(this.vs, gl.COMPILE_STATUS)) {
      const strOut = `\n${ this.vs_code.split('\n').map((elm, i) => `${ i + 1 }:${ elm }`).join('\n') }\n`;
      throw new Error(`${ strOut }${ gl.getShaderInfoLog(this.vs) }`);
    }
    gl.attachShader(this.program, this.vs);

    this.fs_code = `
      precision highp float;

      uniform sampler2D INPUT;
      uniform sampler2D INPUT2;
      uniform vec2 mouse;

      varying vec2 v_pos;

      void main (void) {

        vec4 rgba =
          texture2D(INPUT2, v_pos * 0.5 + 0.5) +
          texture2D(INPUT2, vec2(v_pos.x - 1.0 / 1024.0, v_pos.y + 1.0 / 1024.0) * 0.5 + 0.5) +
          texture2D(INPUT2, vec2(v_pos.x      , v_pos.y + 1.0 / 1024.0) * 0.5 + 0.5) +
          texture2D(INPUT2, vec2(v_pos.x + 1.0 / 1024.0, v_pos.y + 1.0 / 1024.0) * 0.5 + 0.5) +
          texture2D(INPUT2, vec2(v_pos.x + 1.0 / 1024.0, v_pos.y      ) * 0.5 + 0.5) +
          texture2D(INPUT2, vec2(v_pos.x + 1.0 / 1024.0, v_pos.y - 1.0 / 1024.0) * 0.5 + 0.5) +
          texture2D(INPUT2, vec2(v_pos.x      , v_pos.y - 1.0 / 1024.0) * 0.5 + 0.5) +
          texture2D(INPUT2, vec2(v_pos.x - 1.0 / 1024.0, v_pos.y - 1.0 / 1024.0) * 0.5 + 0.5) +
          texture2D(INPUT2, vec2(v_pos.x - 1.0 / 1024.0, v_pos.y      ) * 0.5 + 0.5);

        rgba /= 9.0;

        float weight[5];
        weight[0] = 0.227027;
        weight[1] = 0.1945946;
        weight[2] = 0.1216216;
        weight[3] = 0.054054;
        weight[4] = 0.016216;

        vec2 tex_offset = vec2(1.0 / 2048.0);

        vec3 result = texture2D(INPUT, v_pos * 0.5 + 0.5).rgb * weight[0];

        for(int i = 1; i < 5; i++) {

          result += texture2D(INPUT, v_pos * 0.5 + 0.5 + vec2(tex_offset.x * float(i), 0.0)).rgb * weight[i];
          result += texture2D(INPUT, v_pos * 0.5 + 0.5 - vec2(tex_offset.x * float(i), 0.0)).rgb * weight[i];
        }

        for(int i = 1; i < 5; i++) {

          result += texture2D(INPUT, v_pos * 0.5 + 0.5 + vec2(0.0, tex_offset.y * float(i))).rgb * weight[i];
          result += texture2D(INPUT, v_pos * 0.5 + 0.5 - vec2(0.0, tex_offset.y * float(i))).rgb * weight[i];
        }

        gl_FragColor = vec4(result, 1.0) + rgba * 0.1;
        // gl_FragColor = vec4(result, 1.0);
      }
    `;

    this.fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(this.fs, this.fs_code);
    gl.compileShader(this.fs);
    if (!gl.getShaderParameter(this.fs, gl.COMPILE_STATUS)) {
      const strOut = `\n${ this.fs_code.split('\n').map((elm, i) => `${ i + 1 }:${ elm }`).join('\n') }\n`;
      throw new Error(`${ strOut }${ gl.getShaderInfoLog(this.fs) }`);
    }
    gl.attachShader(this.program, this.fs);

    this.position_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.geometry.buffer, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.linkProgram(this.program);

    this.position_attr = gl.getAttribLocation(this.program, 'position');

    this.INPUT = gl.getUniformLocation(this.program, 'INPUT');
    this.INPUT2 = gl.getUniformLocation(this.program, 'INPUT2');
    this.mouse = gl.getUniformLocation(this.program, 'mouse');

    gl.useProgram(this.program);
    gl.uniform1i(this.INPUT, 2);
    gl.uniform1i(this.INPUT2, 3);
    gl.useProgram(null);

    gl.enableVertexAttribArray(this.position_attr);
  }

  draw() {
    gl.useProgram(this.program);
    gl.uniform2fv(this.mouse, mouse.arr);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.vertexAttribPointer(this.position_attr, 3, gl.FLOAT, 0, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}



class Surface {
  constructor() {
    this.geometry = new Float32Array([ -1, -1, 0, -1, 1, 0, 1, 1, 0, 1, 1, 0, 1, -1, 0, -1, -1, 0 ]);

    this.program = gl.createProgram();

    this.vs_code = `
      attribute vec3 position;

      varying vec2 v_pos;

      void main (void) {

        v_pos = position.xy;

        gl_Position = vec4(position, 1.0);
      }
    `;

    this.vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(this.vs, this.vs_code);
    gl.compileShader(this.vs);
    if (!gl.getShaderParameter(this.vs, gl.COMPILE_STATUS)) {
      const strOut = `\n${ this.vs_code.split('\n').map((elm, i) => `${ i + 1 }:${ elm }`).join('\n') }\n`;
      throw new Error(`${ strOut }${ gl.getShaderInfoLog(this.vs) }`);
    }
    gl.attachShader(this.program, this.vs);

    this.fs_code = `
      precision highp float;

      uniform sampler2D INPUT;
      uniform sampler2D INPUT2;
      uniform sampler2D INPUT3;
      uniform float time;
      uniform vec2 mouse;
      uniform vec2 window_sizes;

      varying vec2 v_pos;

      float rand (vec2 coord) {

        return fract(sin(dot(coord.xy, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main (void) {

        vec2 v_pos2 = v_pos;
        vec2 v_pos3 = v_pos;

        // v_pos2.y += sin(v_pos2.x + fract(time / ${ size }.0) * ${ size }.0 / 1024.0) * pow(clamp(1.0 - distance(v_pos * 0.5, mouse * 0.5), 0.0, 1.0) * 0.75, 4.0) * (1.0 - abs(v_pos2.y));
        // v_pos3 += sin(clamp(1.0 - distance(v_pos * 0.5, mouse * 0.5), 0.0, 1.0) * 3.14) / 10.0;

        vec4 light_spot = vec4(vec3(pow(clamp(1.0 - distance(v_pos * 0.25 * vec2(1.0, window_sizes.y / window_sizes.x), mouse * 0.25 * vec2(1.0, window_sizes.y / window_sizes.x)), 0.0, 1.0) * 0.75, 4.0)), 1.0);

        vec4 noise = vec4(vec3(rand(v_pos2 + time / (1024.0 * 1024.0)) * 0.05), 1.0);
        // vec4 noise2 = vec4(vec3(rand(floor(v_pos2 * window_sizes * 0.5) / (window_sizes * 0.5) + time / (1024.0 * 1024.0)) * 0.05), 1.0);
        vec4 noise3 = vec4(vec3(rand(floor(v_pos2 * window_sizes) / window_sizes + time / (1024.0 * 1024.0)) * 0.05), 1.0);

        vec4 regular_image = texture2D(INPUT, v_pos2 * 0.5 + 0.5);
        // regular_image = vec4(0.0);
        // noise3.r = mix(noise3.r, 0.0, regular_image.r);
        regular_image.a = clamp(mix(regular_image.a, noise3.r * 100.0, 0.1), 0.0, 1.0);

        // gl_FragColor = mix(light_spot, regular_image, regular_image.a) + mix(vec4(texture2D(INPUT3, v_pos2 * 0.5 + 0.5).rgb, 1.0), vec4(0), 0.0);
        gl_FragColor = mix(light_spot, regular_image, regular_image.a) + texture2D(INPUT3, v_pos2 * 0.5 + 0.5);

        gl_FragColor.rgb *= mix(vec3(v_pos2, 119.0 / 255.0), vec3(1), 0.75);

        // gl_FragColor = noise3 * texture2D(INPUT3, v_pos2 * 0.5 + 0.5);
      }
    `;

    this.fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(this.fs, this.fs_code);
    gl.compileShader(this.fs);
    if (!gl.getShaderParameter(this.fs, gl.COMPILE_STATUS)) {
      const strOut = `\n${ this.fs_code.split('\n').map((elm, i) => `${ i + 1 }:${ elm }`).join('\n') }\n`;
      throw new Error(`${ strOut }${ gl.getShaderInfoLog(this.fs) }`);
    }
    gl.attachShader(this.program, this.fs);

    this.position_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.geometry.buffer, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.linkProgram(this.program);

    this.position_attr = gl.getAttribLocation(this.program, 'position');

    this.INPUT = gl.getUniformLocation(this.program, 'INPUT');
    this.INPUT2 = gl.getUniformLocation(this.program, 'INPUT2');
    this.INPUT3 = gl.getUniformLocation(this.program, 'INPUT3');
    this.time = gl.getUniformLocation(this.program, 'time');
    this.bloom = gl.getUniformLocation(this.program, 'bloom');
    this.mouse = gl.getUniformLocation(this.program, 'mouse');
    this.window_sizes = gl.getUniformLocation(this.program, 'window_sizes');

    gl.useProgram(this.program);
    gl.uniform2f(this.window_sizes, window.innerWidth, window.innerHeight);
    gl.uniform1i(this.INPUT, 1);
    gl.uniform1i(this.INPUT2, 2);
    gl.uniform1i(this.INPUT3, 3);
    gl.useProgram(null);

    gl.enableVertexAttribArray(this.position_attr);
  }

  draw() {
    gl.useProgram(this.program);
    gl.uniform1f(this.time, global_time);
    gl.uniform2fv(this.mouse, mouse.arr);
    // gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.vertexAttribPointer(this.position_attr, 3, gl.FLOAT, 0, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}



const camera = new Camera();



class Cube {
  constructor() {
    console.log(THREE);
    // const qwe = new THREE.CylinderBufferGeometry(0.5, 0.5, 5, 32, 1, false);
    // console.log(qwe);

    // const sphere_position_data = qwe.attributes.position.array;
    // const sphere_normal_data = qwe.attributes.normal.array;
    // const sphere_index_data = qwe.index.array;
    // const sphere_position_data = [ 0, 0.5, 0, 0, 0.5, 0, 0, 0.5, 0, 0, 0.5, 0, 0, 0.5, 0, 0, 0.5, 0, 0, 0.5, 0, 0, 0.5, 0, 0, 0.5, 0, -0.19134171307086945, 0.4619397521018982, 0, -0.13529902696609497, 0.4619397521018982, 0.13529902696609497, -1.1716301174306229e-17, 0.4619397521018982, 0.19134171307086945, 0.13529902696609497, 0.4619397521018982, 0.13529902696609497, 0.19134171307086945, 0.4619397521018982, 2.3432602348612458e-17, 0.13529902696609497, 0.4619397521018982, -0.13529902696609497, 3.5148902695738074e-17, 0.4619397521018982, -0.19134171307086945, -0.13529902696609497, 0.4619397521018982, -0.13529902696609497, -0.19134171307086945, 0.4619397521018982, -4.6865204697224915e-17, -0.3535533845424652, 0.3535533845424652, 0, -0.25, 0.3535533845424652, 0.25, -2.1648901508566386e-17, 0.3535533845424652, 0.3535533845424652, 0.25, 0.3535533845424652, 0.25, 0.3535533845424652, 0.3535533845424652, 4.329780301713277e-17, 0.25, 0.3535533845424652, -0.25, 6.494670121697671e-17, 0.3535533845424652, -0.3535533845424652, -0.25, 0.3535533845424652, -0.25, -0.3535533845424652, 0.3535533845424652, -8.659560603426554e-17, -0.4619397521018982, 0.19134171307086945, 0, -0.3266407549381256, 0.19134171307086945, 0.3266407549381256, -2.8285652804487595e-17, 0.19134171307086945, 0.4619397521018982, 0.3266407549381256, 0.19134171307086945, 0.3266407549381256, 0.4619397521018982, 0.19134171307086945, 5.657130560897519e-17, 0.3266407549381256, 0.19134171307086945, -0.3266407549381256, 8.485695841346278e-17, 0.19134171307086945, -0.4619397521018982, -0.3266407549381256, 0.19134171307086945, -0.3266407549381256, -0.4619397521018982, 0.19134171307086945, -1.1314261121795038e-16, -0.5, 3.0616171314629196e-17, 0, -0.3535533845424652, 3.0616171314629196e-17, 0.3535533845424652, -3.0616171314629196e-17, 3.0616171314629196e-17, 0.5, 0.3535533845424652, 3.0616171314629196e-17, 0.3535533845424652, 0.5, 3.0616171314629196e-17, 6.123234262925839e-17, 0.3535533845424652, 3.0616171314629196e-17, -0.3535533845424652, 9.184850732644269e-17, 3.0616171314629196e-17, -0.5, -0.3535533845424652, 3.0616171314629196e-17, -0.3535533845424652, -0.5, 3.0616171314629196e-17, -1.2246468525851679e-16, -0.4619397521018982, -0.19134171307086945, 0, -0.3266407549381256, -0.19134171307086945, 0.3266407549381256, -2.8285652804487595e-17, -0.19134171307086945, 0.4619397521018982, 0.3266407549381256, -0.19134171307086945, 0.3266407549381256, 0.4619397521018982, -0.19134171307086945, 5.657130560897519e-17, 0.3266407549381256, -0.19134171307086945, -0.3266407549381256, 8.485695841346278e-17, -0.19134171307086945, -0.4619397521018982, -0.3266407549381256, -0.19134171307086945, -0.3266407549381256, -0.4619397521018982, -0.19134171307086945, -1.1314261121795038e-16, -0.3535533845424652, -0.3535533845424652, 0, -0.25, -0.3535533845424652, 0.25, -2.1648901508566386e-17, -0.3535533845424652, 0.3535533845424652, 0.25, -0.3535533845424652, 0.25, 0.3535533845424652, -0.3535533845424652, 4.329780301713277e-17, 0.25, -0.3535533845424652, -0.25, 6.494670121697671e-17, -0.3535533845424652, -0.3535533845424652, -0.25, -0.3535533845424652, -0.25, -0.3535533845424652, -0.3535533845424652, -8.659560603426554e-17, -0.19134171307086945, -0.4619397521018982, 0, -0.13529902696609497, -0.4619397521018982, 0.13529902696609497, -1.1716301174306229e-17, -0.4619397521018982, 0.19134171307086945, 0.13529902696609497, -0.4619397521018982, 0.13529902696609497, 0.19134171307086945, -0.4619397521018982, 2.3432602348612458e-17, 0.13529902696609497, -0.4619397521018982, -0.13529902696609497, 3.5148902695738074e-17, -0.4619397521018982, -0.19134171307086945, -0.13529902696609497, -0.4619397521018982, -0.13529902696609497, -0.19134171307086945, -0.4619397521018982, -4.6865204697224915e-17, -6.123234262925839e-17, -0.5, 0, -4.329780301713277e-17, -0.5, 4.329780301713277e-17, -3.7493993930529855e-33, -0.5, 6.123234262925839e-17, 4.329780301713277e-17, -0.5, 4.329780301713277e-17, 6.123234262925839e-17, -0.5, 7.498798786105971e-33, 4.329780301713277e-17, -0.5, -4.329780301713277e-17, 1.1248198179158957e-32, -0.5, -6.123234262925839e-17, -4.329780301713277e-17, -0.5, -4.329780301713277e-17, -6.123234262925839e-17, -0.5, -1.4997597572211942e-32 ];
    // const sphere_normal_data = [ 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, -0.3826834261417389, 0.9238795042037964, 0, -0.27059805393218994, 0.9238795042037964, 0.27059805393218994, -2.3432602348612458e-17, 0.9238795042037964, 0.3826834261417389, 0.27059805393218994, 0.9238795042037964, 0.27059805393218994, 0.3826834261417389, 0.9238795042037964, 4.6865204697224915e-17, 0.27059805393218994, 0.9238795042037964, -0.27059805393218994, 7.029780539147615e-17, 0.9238795042037964, -0.3826834261417389, -0.27059805393218994, 0.9238795042037964, -0.27059805393218994, -0.3826834261417389, 0.9238795042037964, -9.373040939444983e-17, -0.7071067690849304, 0.7071067690849304, 0, -0.5, 0.7071067690849304, 0.5, -4.329780301713277e-17, 0.7071067690849304, 0.7071067690849304, 0.5, 0.7071067690849304, 0.5, 0.7071067690849304, 0.7071067690849304, 8.659560603426554e-17, 0.5, 0.7071067690849304, -0.5, 1.2989340243395341e-16, 0.7071067690849304, -0.7071067690849304, -0.5, 0.7071067690849304, -0.5, -0.7071067690849304, 0.7071067690849304, -1.7319121206853109e-16, -0.9238795042037964, 0.3826834261417389, 0, -0.6532815098762512, 0.3826834261417389, 0.6532815098762512, -5.657130560897519e-17, 0.3826834261417389, 0.9238795042037964, 0.6532815098762512, 0.3826834261417389, 0.6532815098762512, 0.9238795042037964, 0.3826834261417389, 1.1314261121795038e-16, 0.6532815098762512, 0.3826834261417389, -0.6532815098762512, 1.6971391682692557e-16, 0.3826834261417389, -0.9238795042037964, -0.6532815098762512, 0.3826834261417389, -0.6532815098762512, -0.9238795042037964, 0.3826834261417389, -2.2628522243590076e-16, -1, 6.123234262925839e-17, 0, -0.7071067690849304, 6.123234262925839e-17, 0.7071067690849304, -6.123234262925839e-17, 6.123234262925839e-17, 1, 0.7071067690849304, 6.123234262925839e-17, 0.7071067690849304, 1, 6.123234262925839e-17, 1.2246468525851679e-16, 0.7071067690849304, 6.123234262925839e-17, -0.7071067690849304, 1.8369701465288538e-16, 6.123234262925839e-17, -1, -0.7071067690849304, 6.123234262925839e-17, -0.7071067690849304, -1, 6.123234262925839e-17, -2.4492937051703357e-16, -0.9238795042037964, -0.3826834261417389, 0, -0.6532815098762512, -0.3826834261417389, 0.6532815098762512, -5.657130560897519e-17, -0.3826834261417389, 0.9238795042037964, 0.6532815098762512, -0.3826834261417389, 0.6532815098762512, 0.9238795042037964, -0.3826834261417389, 1.1314261121795038e-16, 0.6532815098762512, -0.3826834261417389, -0.6532815098762512, 1.6971391682692557e-16, -0.3826834261417389, -0.9238795042037964, -0.6532815098762512, -0.3826834261417389, -0.6532815098762512, -0.9238795042037964, -0.3826834261417389, -2.2628522243590076e-16, -0.7071067690849304, -0.7071067690849304, 0, -0.5, -0.7071067690849304, 0.5, -4.329780301713277e-17, -0.7071067690849304, 0.7071067690849304, 0.5, -0.7071067690849304, 0.5, 0.7071067690849304, -0.7071067690849304, 8.659560603426554e-17, 0.5, -0.7071067690849304, -0.5, 1.2989340243395341e-16, -0.7071067690849304, -0.7071067690849304, -0.5, -0.7071067690849304, -0.5, -0.7071067690849304, -0.7071067690849304, -1.7319121206853109e-16, -0.3826834261417389, -0.9238795042037964, 0, -0.27059805393218994, -0.9238795042037964, 0.27059805393218994, -2.3432602348612458e-17, -0.9238795042037964, 0.3826834261417389, 0.27059805393218994, -0.9238795042037964, 0.27059805393218994, 0.3826834261417389, -0.9238795042037964, 4.6865204697224915e-17, 0.27059805393218994, -0.9238795042037964, -0.27059805393218994, 7.029780539147615e-17, -0.9238795042037964, -0.3826834261417389, -0.27059805393218994, -0.9238795042037964, -0.27059805393218994, -0.3826834261417389, -0.9238795042037964, -9.373040939444983e-17, -1.2246468525851679e-16, -1, 0, -8.659560603426554e-17, -1, 8.659560603426554e-17, -7.498798786105971e-33, -1, 1.2246468525851679e-16, 8.659560603426554e-17, -1, 8.659560603426554e-17, 1.2246468525851679e-16, -1, 1.4997597572211942e-32, 8.659560603426554e-17, -1, -8.659560603426554e-17, 2.2496396358317913e-32, -1, -1.2246468525851679e-16, -8.659560603426554e-17, -1, -8.659560603426554e-17, -1.2246468525851679e-16, -1, -2.9995195144423884e-32 ];
    // const sphere_index_data = [ 0, 9, 10, 1, 10, 11, 2, 11, 12, 3, 12, 13, 4, 13, 14, 5, 14, 15, 6, 15, 16, 7, 16, 17, 10, 9, 19, 9, 18, 19, 11, 10, 20, 10, 19, 20, 12, 11, 21, 11, 20, 21, 13, 12, 22, 12, 21, 22, 14, 13, 23, 13, 22, 23, 15, 14, 24, 14, 23, 24, 16, 15, 25, 15, 24, 25, 17, 16, 26, 16, 25, 26, 19, 18, 28, 18, 27, 28, 20, 19, 29, 19, 28, 29, 21, 20, 30, 20, 29, 30, 22, 21, 31, 21, 30, 31, 23, 22, 32, 22, 31, 32, 24, 23, 33, 23, 32, 33, 25, 24, 34, 24, 33, 34, 26, 25, 35, 25, 34, 35, 28, 27, 37, 27, 36, 37, 29, 28, 38, 28, 37, 38, 30, 29, 39, 29, 38, 39, 31, 30, 40, 30, 39, 40, 32, 31, 41, 31, 40, 41, 33, 32, 42, 32, 41, 42, 34, 33, 43, 33, 42, 43, 35, 34, 44, 34, 43, 44, 37, 36, 46, 36, 45, 46, 38, 37, 47, 37, 46, 47, 39, 38, 48, 38, 47, 48, 40, 39, 49, 39, 48, 49, 41, 40, 50, 40, 49, 50, 42, 41, 51, 41, 50, 51, 43, 42, 52, 42, 51, 52, 44, 43, 53, 43, 52, 53, 46, 45, 55, 45, 54, 55, 47, 46, 56, 46, 55, 56, 48, 47, 57, 47, 56, 57, 49, 48, 58, 48, 57, 58, 50, 49, 59, 49, 58, 59, 51, 50, 60, 50, 59, 60, 52, 51, 61, 51, 60, 61, 53, 52, 62, 52, 61, 62, 55, 54, 64, 54, 63, 64, 56, 55, 65, 55, 64, 65, 57, 56, 66, 56, 65, 66, 58, 57, 67, 57, 66, 67, 59, 58, 68, 58, 67, 68, 60, 59, 69, 59, 68, 69, 61, 60, 70, 60, 69, 70, 62, 61, 71, 61, 70, 71, 64, 63, 73, 65, 64, 74, 66, 65, 75, 67, 66, 76, 68, 67, 77, 69, 68, 78, 70, 69, 79, 71, 70, 80 ];

    this.program = gl.createProgram();

    this.vs_code = `
      precision highp float;

      attribute vec3 position;
      attribute vec3 normal;
      attribute float index;

      uniform mat4 proj_mat;
      uniform mat4 view_mat;
      uniform sampler2D SPLINE;
      uniform sampler2D PARAMS;
      uniform sampler2D TRANS;
      uniform sampler2D TRANS_PREV;
      uniform float time;
      uniform vec3 light_position;

      varying vec4 world_position;
      varying vec3 v_normal;
      varying vec3 light_direction;

      struct Points {

        vec3 p1;
        vec3 p2;
        vec3 p3;
        vec3 p4;
        vec3 p5;
      };

      vec4 QUAT_FROM_VECS (vec3 v0, vec3 v1) {

        vec4 quat;

        float EPS = 0.000001;

        float r = dot(v0, v1) + 1.0;

        if (r < EPS) {
          r = 0.0;

          if (abs(v0.x) > abs(v0.z)) {
            quat.x = -v0.y;
            quat.y = v0.x;
            quat.z = 0.0;
            quat.w = r;
          } else {
            quat.x = 0.0;
            quat.y = -v0.z;
            quat.z = v0.y;
            quat.w = r;
          }
        } else {
          quat.x = v0.y * v1.z - v0.z * v1.y;
          quat.y = v0.z * v1.x - v0.x * v1.z;
          quat.z = v0.x * v1.y - v0.y * v1.x;
          quat.w = r;
        }

        return normalize(quat);
      }

      mat4 MAT4_FROM_QUAT (vec4 q) {

        float xx = 2.0 * q.x * q.x;
        float yy = 2.0 * q.y * q.y;
        float zz = 2.0 * q.z * q.z;
        float xy = 2.0 * q.x * q.y;
        float xz = 2.0 * q.x * q.z;
        float xw = 2.0 * q.x * q.w;
        float yz = 2.0 * q.y * q.z;
        float yw = 2.0 * q.y * q.w;
        float zw = 2.0 * q.z * q.w;

        mat4 m;
        m[0] = vec4(1.0 - yy - zz, xy + zw, xz - yw, 0.0);
        m[1] = vec4(xy - zw, 1.0 - xx - zz, yz + xw, 0.0);
        m[2] = vec4(xz + yw, yz - xw, 1.0 - xx - yy, 0.0);
        m[3] = vec4(0.0, 0.0, 0.0, 1.0);

        return m;
      }

      Points getPoints(int param_loc) {

        float param_x = fract(index / 32.0);
        float param_y = floor(index / 32.0) / 32.0;

        vec4 params = texture2D(PARAMS, vec2(param_x, param_y));

        float param2 = param_loc == 0 ? params.y : params.z;

        float a = fract((time + param2 * 10.0) / ${ size }.0) * ${ size }.0;
        float bb = a - 40.0 * floor(abs(position.y));
        float b = a - 1.0;
        float c = a + 1.0;
        float cc = a + 40.0 * floor(abs(position.y));

        float x_pos4 = fract(bb / 1024.0) + (0.5 / 1024.0);
        float y_pos4 = (floor(bb / 1024.0) / 1024.0) + (0.5 / 1024.0);

        float x_pos = fract(a / 1024.0) + (0.5 / 1024.0);
        float y_pos = (floor(a / 1024.0) / 1024.0) + (0.5 / 1024.0);

        float x_pos2 = fract(b / 1024.0) + (0.5 / 1024.0);
        float y_pos2 = (floor(b / 1024.0) / 1024.0) + (0.5 / 1024.0);

        float x_pos3 = fract(c / 1024.0) + (0.5 / 1024.0);
        float y_pos3 = (floor(c / 1024.0) / 1024.0) + (0.5 / 1024.0);

        float x_pos5 = fract(cc / 1024.0) + (0.5 / 1024.0);
        float y_pos5 = (floor(cc / 1024.0) / 1024.0) + (0.5 / 1024.0);

        Points points;
        points.p1 = texture2D(SPLINE, vec2(x_pos4, y_pos4)).rgb;

        points.p2 = texture2D(SPLINE, vec2(x_pos2, y_pos2)).rgb;
        points.p3 = texture2D(SPLINE, vec2(x_pos, y_pos)).rgb;
        points.p4 = texture2D(SPLINE, vec2(x_pos3, y_pos3)).rgb;

        points.p5 = texture2D(SPLINE, vec2(x_pos5, y_pos5)).rgb;

        return points;
      }

      void main (void) {

        float param_x = fract(index / 32.0);
        float param_y = floor(index / 32.0) / 32.0;
        float param1 = texture2D(PARAMS, vec2(param_x, param_y)).x;

        vec4 trans = texture2D(TRANS, vec2(param_x, param_y));
        vec4 trans_prev = texture2D(TRANS_PREV, vec2(param_x, param_y));

        Points points = getPoints(0);
        Points points2 = getPoints(1);

        float interp = pow(sin((fract(time / ${ size }.0)) * 1000.0 * texture2D(PARAMS, vec2(param_x, param_y)).w) * 0.5 + 0.5, 8.0);

        vec3 point_prev1 = mix(points.p1, points2.p1, interp);

        vec3 point_prev = mix(points.p2, points2.p2, interp);
        vec3 point_curr = mix(points.p3, points2.p3, interp);
        vec3 point_next = mix(points.p4, points2.p4, interp);

        vec3 point_next1 = mix(points.p5, points2.p5, interp);

        vec3 normal_src = vec3(0, 1, 0);
        vec3 normal_dst = normalize(point_prev - point_next);

        normal_dst = normalize(point_prev - point_next);

        vec3 nrm1 = -normalize(point_curr - point_prev1);
        vec3 nrm2 = -normalize(point_curr - point_next1);

        mat4 mmm;
        if (position.y < 0.0) {

          mmm = MAT4_FROM_QUAT(QUAT_FROM_VECS(-normal_dst, nrm1));
        }
        else {

          mmm = MAT4_FROM_QUAT(QUAT_FROM_VECS(normal_dst, nrm2));
        }

        normal_dst += (trans.rgb - trans_prev.rgb) * 2.0 * trans_prev.a;
        normal_dst = normalize(normal_dst);

        mat4 mat = MAT4_FROM_QUAT(QUAT_FROM_VECS(normal_src, normal_dst));
        vec3 rotated_position = (mat * vec4(position, 1.0)).xyz;
        rotated_position = (mmm * vec4(rotated_position, 1.0)).xyz;

        float f = (sin(fract(time / ${ size }.0) * param1 / 1024.0 + param1 * ${ size }.0) + 3.0) / 4.0;

        float ttt = param1;
        vec3 offset = vec3(0);
        if (ttt < 0.33) {

          offset.x = ttt;
        } else if (ttt < 0.66) {

          offset.y = ttt;
        } else {

          offset.z = ttt;
        }

        world_position = vec4(rotated_position + point_curr * f + trans.rgb + offset * 10.0, 1.0);

        gl_Position = proj_mat * view_mat * world_position;



        v_normal = (mmm * vec4(normal, 1.0)).xyz;

        light_direction = normalize(world_position.xyz + light_position);
      }
    `;

    this.vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(this.vs, this.vs_code);
    gl.compileShader(this.vs);
    if (!gl.getShaderParameter(this.vs, gl.COMPILE_STATUS)) {
      const strOut = `\n${ this.vs_code.split('\n').map((elm, i) => `${ i + 1 }:${ elm }`).join('\n') }\n`;
      throw new Error(`${ strOut }${ gl.getShaderInfoLog(this.vs) }`);
    }
    gl.attachShader(this.program, this.vs);

    this.fs_code = `
      precision highp float;

      uniform float bloom;
      uniform vec3 camera_position;
      uniform vec3 light_position;

      varying vec4 world_position;
      varying vec3 v_normal;
      varying vec3 light_direction;

      float rand (vec2 coord) {

        return fract(sin(dot(coord.xy ,vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main (void) {

        float diffuse = max(dot(v_normal, -light_direction), 0.0);

        if (bloom > 0.5) {

          diffuse *= 2.0;

          float distance_factor = pow(1.0 - clamp(distance(world_position.xyz, light_position) / 32.0, 0.0, 1.0), 2.0);

          gl_FragColor = vec4(vec3(0.0), 1.0) + vec4(vec3(diffuse * distance_factor), 1.0);
        }
        else {

          float distance_factor = pow(1.0 - clamp(distance(world_position.xyz, light_position) / 32.0, 0.0, 1.0), 2.0);

          gl_FragColor = vec4(vec3(0.0), 1.0) + vec4(vec3(diffuse * distance_factor), 1.0);

          gl_FragColor.a = 1.0 - distance(camera_position, world_position.xyz) / 200.0;
        }
      }
    `;

    this.fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(this.fs, this.fs_code);
    gl.compileShader(this.fs);
    if (!gl.getShaderParameter(this.fs, gl.COMPILE_STATUS)) {
      const strOut = `\n${ this.fs_code.split('\n').map((elm, i) => `${ i + 1 }:${ elm }`).join('\n') }\n`;
      throw new Error(`${ strOut }${ gl.getShaderInfoLog(this.fs) }`);
    }
    gl.attachShader(this.program, this.fs);

    gl.linkProgram(this.program);

    this.position_attr = gl.getAttribLocation(this.program, 'position');
    this.normal_attr = gl.getAttribLocation(this.program, 'normal');
    this.index_attr = gl.getAttribLocation(this.program, 'index');

    this.proj_mat = gl.getUniformLocation(this.program, 'proj_mat');
    this.view_mat = gl.getUniformLocation(this.program, 'view_mat');
    this.SPLINE = gl.getUniformLocation(this.program, 'SPLINE');
    this.PARAMS = gl.getUniformLocation(this.program, 'PARAMS');
    this.TRANS = gl.getUniformLocation(this.program, 'TRANS');
    this.TRANS_PREV = gl.getUniformLocation(this.program, 'TRANS_PREV');
    this.time = gl.getUniformLocation(this.program, 'time');
    this.bloom = gl.getUniformLocation(this.program, 'bloom');
    this.camera_position = gl.getUniformLocation(this.program, 'camera_position');
    this.light_position = gl.getUniformLocation(this.program, 'light_position');

    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.proj_mat, false, camera.proj_mat.arr);
    gl.uniform1i(this.SPLINE, 0);
    gl.uniform1i(this.PARAMS, 4);
    gl.uniform1i(this.TRANS, 5);
    gl.uniform1i(this.TRANS_PREV, 6);
    gl.useProgram(null);

    gl.enableVertexAttribArray(this.position_attr);
    gl.enableVertexAttribArray(this.normal_attr);
    gl.enableVertexAttribArray(this.index_attr);

    const vertex_data = [];
    this.index_data = [];

    /* eslint-disable no-shadow */
    for (let k = 0; k < 1024; k++) {
      const qwe = new THREE.CylinderBufferGeometry(0.4, 0.4, (Math.random() * 5) + 5, 16, 9, false);
      // const qwe = new THREE.CylinderBufferGeometry(0.4, 0.4, 10, 32, 9, false);
      const sphere_position_data = qwe.attributes.position.array;
      const sphere_normal_data = qwe.attributes.normal.array;
      const sphere_index_data = qwe.index.array;

      for (let i = 0; i < sphere_position_data.length; i += 3) {
        vertex_data.push(
          sphere_position_data[i + 0],
          sphere_position_data[i + 1],
          sphere_position_data[i + 2],
          sphere_normal_data[i + 0],
          sphere_normal_data[i + 1],
          sphere_normal_data[i + 2],
          k,
        );
      }

      for (let i = 0; i < sphere_index_data.length; i++) {
        this.index_data.push((k * (sphere_position_data.length / 3)) + sphere_index_data[i]);
      }
    }

    this.position_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.index_data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  draw() {
    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.view_mat, false, camera.view_mat.arr);
    gl.uniform3f(this.camera_position, camera.obj.matrix.arr[12], camera.obj.matrix.arr[13], camera.obj.matrix.arr[14]);
    gl.uniform1f(this.time, global_time);
    gl.uniform1f(this.bloom, 0);
    gl.uniform3fv(this.light_position, light_position.arr);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.vertexAttribPointer(this.position_attr, 3, gl.FLOAT, 0, 28, 0);
    gl.vertexAttribPointer(this.normal_attr, 3, gl.FLOAT, 0, 28, 12);
    gl.vertexAttribPointer(this.index_attr, 1, gl.FLOAT, 0, 28, 24);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
    gl.drawElements(gl.TRIANGLES, this.index_data.length, gl.UNSIGNED_INT, 0);
  }

  draw2() {
    gl.uniform1f(this.bloom, 1);
    gl.drawElements(gl.TRIANGLES, this.index_data.length, gl.UNSIGNED_INT, 0);
  }
}



const trans = new Trans();
const cube = new Cube();
const bloom_surface = new BloomSurface();
const surface = new Surface();



const viewport1_size = 1024 * canvas_size_multiplier;
let viewport2_width = window.innerWidth * dpr;
let viewport2_height = window.innerHeight * dpr;



window.addEventListener('resize', () => {
  viewport2_width = window.innerWidth * dpr;
  viewport2_height = window.innerHeight * dpr;

  canvas.width = viewport2_width;
  canvas.height = viewport2_height;

  camera.proj_mat.makePerspectiveProjection2(45, window.innerWidth / window.innerHeight, 1, 2000, 1);

  gl.useProgram(cube.program);
  gl.uniformMatrix4fv(cube.proj_mat, false, camera.proj_mat.arr);
  gl.useProgram(null);

  gl.useProgram(surface.program);
  gl.uniform2f(surface.window_sizes, window.innerWidth, window.innerHeight);
  gl.useProgram(null);
});



const render = () => {
  // const now = new Date();
  // frame_time = now - last_time;
  // last_time = now;
  global_time += 7;



  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

  gl.viewport(0, 0, viewport1_size, viewport1_size);

  // render regular
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fb_tex, 0);
  gl.clearColor(0.05, 0.05, 0.05, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  cube.draw();

  // render light
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fb_tex2, 0);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  cube.draw2();

  // render bloom
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, fb_tex3[fbt3]);
  fbt3 = 1 - fbt3;
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fb_tex3[fbt3], 0);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  bloom_surface.draw();



  // render trans
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb2);

  gl.viewport(0, 0, 32, 32);

  gl.activeTexture(gl.TEXTURE5);
  gl.bindTexture(gl.TEXTURE_2D, fb_tex4[fbt4]);
  gl.activeTexture(gl.TEXTURE6);
  gl.bindTexture(gl.TEXTURE_2D, fb_tex4[1 - fbt4]);
  fbt4 = 1 - fbt4;
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fb_tex4[fbt4], 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  trans.draw();

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);



  gl.viewport(0, 0, viewport2_width, viewport2_height);
  gl.clear(gl.COLOR_BUFFER_BIT);

  surface.draw();

  requestAnimationFrame(render);
};

render();
