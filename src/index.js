/*
eslint
indent: [ 'error', 'tab' ],
*/

/*
eslint-disable
id-match,
camelcase,
no-multiple-empty-lines,
id-length,
padded-blocks,
no-magic-numbers,
no-console,
brace-style,
max-len,
func-style,
no-bitwise,
no-underscore-dangle,
no-tabs,
max-statements,
space-before-function-paren,
complexity,
*/

import './index.scss';

// import * as THREE from 'three';

import Vec3 from '../../vec/src/data-objects/Vec3';
import Mat4 from '../../vec/src/data-objects/Mat4';
import Obj from '../../vec/src/derivatives/Obj';

import position_data from './geometry/position.json';
import normal_data from './geometry/normal.json';
import uv_data from './geometry/uv.json';
import index_data from './geometry/index.json';
import * as THREE from 'three';
console.log(THREE);

const dpr = window.devicePixelRatio || 1;

const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth * dpr;
canvas.height = window.innerHeight * dpr;

const gl = canvas.getContext('webgl', { antialias: false });

const EXT_texture_filter_anisotropic = gl.getExtension('EXT_texture_filter_anisotropic');
gl.getExtension('OES_texture_float');
gl.getExtension('OES_element_index_uint');
gl.getExtension('OES_standard_derivatives');

gl.viewport(0, 0, window.innerWidth, window.innerHeight);
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LESS);
// gl.enable(gl.BLEND);
gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);



const point_count = 11000;
console.log(point_count);
const squares = [];
// const weights = [];
const coords = [];
// let square_min = 0xEEEEEEEE;
let square_sum = 0;
const vec3_aux = new Vec3();
const flakes = [];


for (let i = 0; i < index_data.length; i += 3) {

	const ai = index_data[i + 0];
	const bi = index_data[i + 1];
	const ci = index_data[i + 2];

	// console.log(a, b, c);

	const av = new Vec3().set(

		position_data[(ai * 3) + 0],
		position_data[(ai * 3) + 1],
		position_data[(ai * 3) + 2],
	);

	const bv = new Vec3().set(

		position_data[(bi * 3) + 0],
		position_data[(bi * 3) + 1],
		position_data[(bi * 3) + 2],
	);

	const cv = new Vec3().set(

		position_data[(ci * 3) + 0],
		position_data[(ci * 3) + 1],
		position_data[(ci * 3) + 2],
	);

	coords.push(av.clone(), bv.clone(), cv.clone());

	const ab = vec3_aux.copy(av).sub(bv).length();
	const bc = vec3_aux.copy(bv).sub(cv).length();
	const ca = vec3_aux.copy(cv).sub(av).length();

	// const ad = Math.sqrt((av.arr[0] * av.arr[0]) + (av.arr[1] * av.arr[1]) + (av.arr[2] * av.arr[2]));
	// const bd = Math.sqrt((bv.arr[0] * bv.arr[0]) + (bv.arr[1] * bv.arr[1]) + (bv.arr[2] * bv.arr[2]));
	// const cd = Math.sqrt((cv.arr[0] * cv.arr[0]) + (cv.arr[1] * cv.arr[1]) + (cv.arr[2] * cv.arr[2]));

	const p = (ab + bc + ca) * 0.5;

	const square = Math.sqrt(p * (p - ab) * (p - bc) * (p - ca));

	square_sum += square;

	squares.push(square);

	// if (square < square_min) {

	// 	square_min = square;
	// }

	// console.log(p, ad, bd, cd, square, square_sum);
}

for (let i = 0; i < squares.length; ++i) {

	const weight = Math.floor(squares[i] / square_sum * point_count);

	for (let k = 0; k < weight; ++k) {

		// console.log(Math.floor(squares[i] / square_sum * point_count));

		// weights.push(Math.floor(squares[i] / square_sum * point_count));

		const ab = new Vec3().copy(coords[(i * 3) + 1]).sub(coords[(i * 3) + 0]);
		const ac = new Vec3().copy(coords[(i * 3) + 2]).sub(coords[(i * 3) + 0]);

		let r = Math.random();
		let s = Math.random();

		if (r + s >= 1) {

			r = 1 - r;
			s = 1 - s;
		}

		const res = new Vec3().copy(coords[(i * 3) + 0]).add(ab.mulS(r)).add(ac.mulS(s));

		flakes.push(

			res.arr[0],
			res.arr[1],
			res.arr[2],
			Math.random(),
		);
	}
}

// console.log(squares);
// console.log(weights);
console.log(flakes);


let time = 0;



class Camera {

	constructor() {

		this.obj = new Obj();

		this.obj.translation.set(0, 1, 10);
		this.obj.origin.set(0, 0, -10);
		// this.obj.preRotateX(Math.PI * 0.05);
		// this.obj.translation.set(0, 0.5, 0);
		this.obj.update2();

		this.view_mat = new Mat4()
			.copy(this.obj.matrix)
			.inverse();

		this.proj_mat = new Mat4().makePerspectiveProjection2(45, window.innerWidth / window.innerHeight, 0.1, 20, 1);

		const canvas_mousemove_callback = (evt) => {

			this.obj.postRotateX(evt.movementY * 0.01);
			this.obj.preRotateY(evt.movementX * 0.01);
			this.obj.update2();
			this.view_mat
				.copy(this.obj.matrix)
				.inverse();
		};

		canvas.addEventListener('mousedown', () => canvas.addEventListener('mousemove', canvas_mousemove_callback));
		canvas.addEventListener('mouseup', () => canvas.removeEventListener('mousemove', canvas_mousemove_callback));

		canvas.addEventListener('wheel', (evt) => {

			this.obj.translateZ(Math.sign(evt.deltaY) * 0.2);
			this.obj.update2();
			this.view_mat
				.copy(this.obj.matrix)
				.inverse();
		});
	}
}



const fb_tex0 = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, fb_tex0);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window.innerWidth, window.innerHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
gl.bindTexture(gl.TEXTURE_2D, null);


const fb_tex2 = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, fb_tex2);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window.innerWidth, window.innerHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
gl.bindTexture(gl.TEXTURE_2D, null);


const fb_tex1 = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, fb_tex1);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window.innerWidth, window.innerHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
gl.bindTexture(gl.TEXTURE_2D, null);


const tex_snow = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex_snow);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

if (EXT_texture_filter_anisotropic) {

	const max = gl.getParameter(EXT_texture_filter_anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
	gl.texParameterf(gl.TEXTURE_2D, EXT_texture_filter_anisotropic.TEXTURE_MAX_ANISOTROPY_EXT, max);
}

const snow_img = document.getElementById('noise');
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, snow_img);
gl.bindTexture(gl.TEXTURE_2D, null);


const tex_flake = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex_flake);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

if (EXT_texture_filter_anisotropic) {

	const max = gl.getParameter(EXT_texture_filter_anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
	gl.texParameterf(gl.TEXTURE_2D, EXT_texture_filter_anisotropic.TEXTURE_MAX_ANISOTROPY_EXT, max);
}

const flake_img = document.getElementById('flake');
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, flake_img);
gl.bindTexture(gl.TEXTURE_2D, null);


const tex_flake2 = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex_flake2);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

if (EXT_texture_filter_anisotropic) {

	const max = gl.getParameter(EXT_texture_filter_anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
	gl.texParameterf(gl.TEXTURE_2D, EXT_texture_filter_anisotropic.TEXTURE_MAX_ANISOTROPY_EXT, max);
}

const flake_img2 = document.getElementById('flake');
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, flake_img2);
gl.bindTexture(gl.TEXTURE_2D, null);


const tex_noise = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex_noise);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

if (EXT_texture_filter_anisotropic) {

	const max = gl.getParameter(EXT_texture_filter_anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
	gl.texParameterf(gl.TEXTURE_2D, EXT_texture_filter_anisotropic.TEXTURE_MAX_ANISOTROPY_EXT, max);
}

const noise_img = document.getElementById('normal_map');
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, noise_img);
gl.bindTexture(gl.TEXTURE_2D, null);


const tex_hm = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex_hm);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

if (EXT_texture_filter_anisotropic) {

	const max = gl.getParameter(EXT_texture_filter_anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
	gl.texParameterf(gl.TEXTURE_2D, EXT_texture_filter_anisotropic.TEXTURE_MAX_ANISOTROPY_EXT, max);
}

const hm_img = document.getElementById('heightmap');
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.FLOAT, hm_img);
gl.bindTexture(gl.TEXTURE_2D, null);


const fb_rb = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, fb_rb);
gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, window.innerWidth, window.innerHeight);
gl.bindRenderbuffer(gl.RENDERBUFFER, null);


const fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, fb_rb);
gl.bindFramebuffer(gl.FRAMEBUFFER, null);



gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, fb_tex0);

gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D, fb_tex1);

gl.activeTexture(gl.TEXTURE2);
gl.bindTexture(gl.TEXTURE_2D, tex_snow);

gl.activeTexture(gl.TEXTURE3);
gl.bindTexture(gl.TEXTURE_2D, tex_flake);

gl.activeTexture(gl.TEXTURE4);
gl.bindTexture(gl.TEXTURE_2D, tex_noise);

gl.activeTexture(gl.TEXTURE5);
gl.bindTexture(gl.TEXTURE_2D, fb_tex2);

gl.activeTexture(gl.TEXTURE6);
gl.bindTexture(gl.TEXTURE_2D, tex_flake2);

gl.activeTexture(gl.TEXTURE7);
gl.bindTexture(gl.TEXTURE_2D, tex_hm);



const camera = new Camera();



class BaseObjectClass {

	constructor (params = {

		surface: false,
		vs: '',
		fs: '',
	}) {

		if (params.surface && !params.vs) {

			params.vs = `
				precision highp int;
				precision highp float;

				attribute vec3 a_position;

				varying vec2 v_position;

				void main (void) {

					v_position = a_position.xy;

					gl_Position = vec4(a_position, 1.0);
				}
			`;
		}

		params.vs = Array.isArray(params.vs) ? params.vs : [ params.vs ];
		params.fs = Array.isArray(params.fs) ? params.fs : [ params.fs ];

		this.programs = new Array(Math.max(params.vs.length, params.fs.length)).fill(null).map(() => ({ handle: gl.createProgram(), uniform_locations: {} }));

		this.programs.forEach((program, program_index) => {

			const init_uniforms = {};

			const vs_code = params.vs[program_index] || params.vs[params.vs.length - 1];

			const vs = gl.createShader(gl.VERTEX_SHADER);
			BaseObjectClass.processShader(program.handle, vs, vs_code);

			const fs_code = params.fs[program_index] || params.fs[params.fs.length - 1];

			const fs = gl.createShader(gl.FRAGMENT_SHADER);
			BaseObjectClass.processShader(program.handle, fs, fs_code);

			gl.linkProgram(program.handle);

			const vs_lines = vs_code.split('\n').map((elm) => elm.trim()).filter((elm) => elm);
			const fs_lines = fs_code.split('\n').map((elm) => elm.trim()).filter((elm) => elm);

			vs_lines.forEach((elm) => {

				if (elm.match('attribute')) {

					const attrib_name = elm.split(' ').filter((_elm) => _elm).pop().replace(';', '').trim();

					this[attrib_name] = gl.getAttribLocation(program.handle, attrib_name);

					gl.enableVertexAttribArray(this[attrib_name]);
				}
				else if (elm.match('uniform')) {

					const [ _uniform_name, init ] = elm.split('//init').map((_elm) => _elm.trim());

					const uniform_name = _uniform_name.split(' ').filter((_elm) => _elm).pop().replace(';', '').trim();

					if (init) {

						const [ init_function, init_values ] = init.split(';').map((_elm) => _elm.trim());

						init_uniforms[uniform_name] = { init_function, init_values };
					}

					program.uniform_locations[uniform_name] = gl.getUniformLocation(program.handle, uniform_name);
				}
			});

			fs_lines.forEach((elm) => {

				if (elm.match('uniform')) {

					const [ _uniform_name, init ] = elm.split('//init').map((_elm) => _elm.trim());

					const uniform_name = _uniform_name.split(' ').filter((_elm) => _elm).pop().replace(';', '').trim();

					if (init) {

						const [ init_function, init_values ] = init.split(';').map((_elm) => _elm.trim());

						init_uniforms[uniform_name] = { init_function, init_values };
					}

					program.uniform_locations[uniform_name] = gl.getUniformLocation(program.handle, uniform_name);
				}
			});

			gl.useProgram(program.handle);

			for (const uniform_name in init_uniforms) {

				const { init_function, init_values } = init_uniforms[uniform_name];

				if (

					init_function === 'uniform1fv' ||
					init_function === 'uniform2fv' ||
					init_function === 'uniform3fv' ||
					init_function === 'uniform4fv'
				) {

					try {

						gl[init_uniforms[uniform_name].init_function](program.uniform_locations[uniform_name], JSON.parse(`[ ${ init_values } ]`));
					}
					catch (evt) {

						console.error({ program, program_index, uniform_name, init_function, init_values });

						console.error(evt);
					}
				}
				else if (

					init_function === 'uniformMatrix2fv' ||
					init_function === 'uniformMatrix3fv' ||
					init_function === 'uniformMatrix4fv'
				) {

					try {

						gl[init_uniforms[uniform_name].init_function](program.uniform_locations[uniform_name], false, JSON.parse(`[ ${ init_values } ]`));
					}
					catch (evt) {

						console.error({ program, program_index, uniform_name, init_function, init_values });

						console.error(evt);
					}
				}
				else {

					try {

						gl[init_uniforms[uniform_name].init_function](program.uniform_locations[uniform_name], init_values);
					}
					catch (evt) {

						console.error({ program, program_index, uniform_name, init_function, init_values });

						console.error(evt);
					}
				}
			}

			gl.useProgram(null);
		});

		if (params.surface) {

			this.position_data = new Float32Array([ -1, -1, 0, -1, 1, 0, 1, 1, 0, 1, 1, 0, 1, -1, 0, -1, -1, 0 ]);

			this.position_buffer = gl.createBuffer();

			gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
			gl.bufferData(gl.ARRAY_BUFFER, this.position_data.buffer, gl.STATIC_DRAW);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
		}
	}

	static processShader (program, shader, code) {

		gl.shaderSource(shader, code);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

			const strOut = `\n${ code.split('\n').map((elm, i) => `${ i + 1 }:${ elm }`).join('\n') }\n`;
			throw new Error(`${ strOut }${ gl.getShaderInfoLog(shader) }`);
		}

		gl.attachShader(program, shader);
	}
}



class Surface extends BaseObjectClass {

	constructor() {

		super({

			surface: true,

			fs: `
				precision highp int;
				precision highp float;

				uniform float u_time;
				uniform int u_mode;
				uniform sampler2D u_tex0_depth; //init uniform1i; 0
				uniform sampler2D u_tex1_color; //init uniform1i; 1
				uniform sampler2D u_tex5_brightness; //init uniform1i; 5
				uniform sampler2D u_tex3_flake; //init uniform1i; 3

				const vec2 resolution = vec2(${ window.innerWidth }.0, ${ window.innerHeight }.0);
				const vec2 pixel_size = 1.0 / resolution;
				const vec2 max_radius = pixel_size * 20.0;
				const float PI = ${ Math.PI };
				const float _05PI = PI * 0.5;
				const float _2PI = PI * 2.0;
				const float angle_delta = PI / 8.0;
				// const float angle_delta2 = PI / 16.0;

				float rand (vec2 coord) {

					float rand = fract(sin(dot(coord.xy, vec2(12.9898, 78.233))) * 43758.5453);

					return rand;

					// return rand > 0.99 ? 1.0 : 0.0;
				}

				vec3 getBlurredColor (vec2 uv) {

					vec3 color = texture2D(u_tex1_color, uv).rgb;
					float focus_depth = 0.4;
					float blur = pow(abs(focus_depth - texture2D(u_tex0_depth, uv).a), 1.5) / 10.0 * 10.0;

					vec2 radius = pixel_size;

					float counter = 1.0;

					for (int loop = 1; loop > 0; ++loop) {

						if (length(radius) > length(max_radius) * blur) {

							break;
						}

						for (float angle = 0.0; angle < _2PI; angle += angle_delta) {

							vec2 direction = vec2(cos(angle), sin(angle));

							color += texture2D(u_tex1_color, uv + direction * radius, -1.0).rgb * blur;

							counter += blur;

							// ++counter;
						}

						radius += pixel_size * 0.5;
					}

					color /= counter;

					// if (blur > 0.01 && blur < 0.02) {

					// 	color = vec3(1.0, 0.0, 0.0);
					// }

					// if (uv.x < (0.5 - pixel_size.x)) {

						// float bb = blur * 0.02 + 0.02;
						// float bb;

						// if (blur > 0.3) {

						// 	bb = 0.02;
						// }
						// if (blur > 0.15) {

						// 	bb = 0.02;
						// }
						// else {

						// 	bb = 0.02;
						// }

						// return color + (vec3(rand(floor(gl_FragCoord.xy * 0.2) / 0.2 + u_time))) * texture2D(u_tex5_brightness, uv).r * blur;
						// return
						// 	color +
						// 	// (vec3(rand(floor(gl_FragCoord.xy * 0.02) / 0.02 + u_time)) + vec3(rand(floor(gl_FragCoord.xy * (blur + 0.05)) / (blur + 0.05) + u_time))) *
						// 	(
						// 		vec3(rand(floor(gl_FragCoord.xy * 0.02) / 0.02 + u_time)) * texture2D(u_tex3_flake, gl_FragCoord.xy * 0.02).a +
						// 		vec3(rand(floor(gl_FragCoord.xy * 0.08) / 0.08 + u_time)) * texture2D(u_tex3_flake, gl_FragCoord.xy * 0.08).a +
						// 		vec3(rand(floor(gl_FragCoord.xy * 0.32) / 0.32 + u_time)) * texture2D(u_tex3_flake, gl_FragCoord.xy * 0.32).a
						// 	) *
						// 	// texture2D(u_tex3_flake, gl_FragCoord.xy * bb).a *
						// 	1.0 *
						// 	texture2D(u_tex5_brightness, uv).r * 1.0;

						return color;
					// }
					// else if (uv.x > (0.5 + pixel_size.x)) {

					// 	return texture2D(u_tex1_color, uv).rgb;
					// 	// return vec3(blur);
					// }
					// else {

					// 	return vec3(1.0);
					// }
				}

				void main (void) {

					vec2 uv = gl_FragCoord.xy * pixel_size;

					gl_FragColor = vec4(getBlurredColor(uv), 1.0);
				}
			`,
		});
	}

	drawCircles() {

		gl.useProgram(this.programs[0].handle);
		gl.uniform1i(this.programs[0].uniform_locations.u_mode, 0);
		gl.uniform1f(this.programs[0].uniform_locations.u_time, time);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
		gl.vertexAttribPointer(this.a_position, 3, gl.FLOAT, 0, 0, 0);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	draw() {

		gl.useProgram(this.programs[0].handle);
		gl.uniform1i(this.programs[0].uniform_locations.u_mode, 1);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
		gl.vertexAttribPointer(this.a_position, 3, gl.FLOAT, 0, 0, 0);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
}



class Cube extends BaseObjectClass {

	constructor() {

		super({

			vs: `
				precision highp int;
				precision highp float;

				attribute vec3 a_position;
				attribute vec3 a_normal;
				attribute vec2 a_uv;

				uniform mat4 u_proj_mat; //init uniformMatrix4fv; ${ camera.proj_mat.arr }
				uniform mat4 u_view_mat;
				uniform sampler2D u_tex_noise; //init uniform1i; 4

				varying vec3 v_world_position;
				varying vec3 v_normal;
				varying vec2 v_uv;

				void main (void) {

					v_world_position = a_position;
					// v_world_position.y *= -1.0;
					// v_world_position.y = 0.0;

					v_normal = a_normal;
					v_uv = a_uv;

					gl_Position = u_proj_mat * u_view_mat * vec4(v_world_position, 1.0);
				}
			`,

			fs: [

				`
					precision highp int;
					precision highp float;

					void main (void) {

						float depth = gl_FragCoord.z / gl_FragCoord.w / ${ 20 }.0;

						gl_FragColor = vec4(0.0, 0.0, 0.0, depth);
					}
				`,

				`
					precision highp int;
					precision highp float;

					uniform vec3 u_camera_position; //init uniform3fv; ${ camera.obj.matrix.arr.slice(12, 15) }

					varying vec3 v_world_position;
					varying vec3 v_normal;

					void main (void) {

						vec3 v_light_direction = normalize(v_world_position - vec3(0.0, 100.0, 0.0));
						vec3 v_view_direction = normalize(v_world_position - u_camera_position);
						vec3 reflected_direction = reflect(-v_light_direction, v_normal);

						float ambient = 0.1;
						float diffuse = max(dot(normalize(v_normal), v_light_direction), 0.0);
						float specular = pow(max(dot(v_view_direction, reflected_direction), 0.0), 0.5);

						vec3 color = vec3(1.0 - vec4(1.0) * (specular + diffuse * 0.1));

						gl_FragColor = vec4(color, 1.0);
					}
				`,

				`
					#extension GL_OES_standard_derivatives: enable

					precision highp int;
					precision highp float;

					uniform float u_time;
					uniform sampler2D u_tex_snow; //init uniform1i; 2
					uniform sampler2D u_tex_noise; //init uniform1i; 4
					uniform sampler2D u_tex_flake; //init uniform1i; 6
					uniform vec3 u_camera_position; //init uniform3fv; ${ camera.obj.matrix.arr.slice(12, 15) }

					varying vec3 v_world_position;
					varying vec3 v_normal;
					varying vec2 v_uv;

					const float uNormalScale = 1.0;

					const vec2 resolution = vec2(${ window.innerWidth }.0, ${ window.innerHeight }.0);
					const vec2 pixel_size = 1.0 / resolution;

					vec3 perturbNormal2Arb(sampler2D normalTex, vec3 eye_pos, vec3 surf_norm, vec2 uvs) {

						vec3 q0 = dFdx( eye_pos.xyz );
						vec3 q1 = dFdy( eye_pos.xyz );
						vec2 st0 = dFdx( uvs.st );
						vec2 st1 = dFdy( uvs.st );
						vec3 S = normalize( q0 * st1.t - q1 * st0.t );
						vec3 T = normalize( -q0 * st1.s + q1 * st0.s );
						vec3 N = normalize( surf_norm );
						vec3 mapN = texture2D( normalTex, vec2(mod(uvs.x, 1.), mod(uvs.y, 1.)) ).xyz * 2.0 - 1.0;
						mapN.xy = uNormalScale * mapN.xy;
						mat3 tsn = mat3( S, T, N );
						return normalize( tsn * mapN );
						// return surf_norm;
					}

					void main (void) {

						float circle_count = 2048.0;

						float depth = gl_FragCoord.z;

						vec3 world_position = v_world_position;
						// world_position.y = 0.0;

						vec3 normal = perturbNormal2Arb(u_tex_noise, world_position, v_normal, v_uv / 256.0 * circle_count);

						vec3 light_direction = normalize(vec3(0.0, 100.0, 100.0) - world_position);
						vec3 view_direction = normalize(u_camera_position - world_position);
						vec3 reflected_direction_fragment = reflect(-light_direction, normal);
						vec3 reflected_direction_surface = reflect(-light_direction, (v_normal + normal) * 0.5);

						float ambient = 1.0;
						float diffuse_surface = 0.5 - dot(v_normal, view_direction);
						float diffuse_surface3 = dot((normal + v_normal) * 0.5, view_direction);
						float diffuse_surface2 = pow(max(dot(v_normal, light_direction), 0.0), 1.0);
						float diffuse_fragment = pow(max(dot(normal, view_direction), 0.0), 1.0);
						float specular_fragment = pow(max(dot(view_direction, reflected_direction_fragment), 0.0), 8.0);
						float specular_surface = pow(max(dot(view_direction, reflected_direction_surface), 0.0), 32.0);

						// vec3 color = diffuse_surface3 * vec3(1.0);

						// float circle_count = 256.0;

						// gl_FragColor.rgb = (1.0 - texture2D(u_tex_snow, v_uv / (32.0 * 16.0) * circle_count).rgb) * texture2D(u_tex_flake, v_uv * circle_count).a * diffuse_surface3;

						// gl_FragColor.rgb = diffuse_surface3 * vec3(1.0);

						// vec3 color = vec3(1.0) * diffuse_fragment;

						// vec3 col = (1.0 - diffuse_surface) * vec3(1.0);
						// // if (col.x < 0.55) {

						// 	col = mix(vec3(pow(col.x, pow(2.0 - col.x, 4.0))), col, pow(0.5 - depth, 2.0));
						// // }
						// // else {

						// // 	col = vec3(pow(col.x, 0.25));
						// // }

						// vec3 yyy = (1.0 - texture2D(u_tex_snow, v_uv * 10.0).rgb);
						// if (yyy.x < 0.125) {

						// 	yyy = vec3(0.0);
						// }
						// else {

						// 	yyy = vec3((pow(diffuse_fragment * specular_fragment, 32.0)));
						// }

						// // yyy *= (pow(diffuse_surface2 * (diffuse_fragment * 0.5 + 0.5), 16.0));
						// // gl_FragColor.rgb = yyy + vec3(ivec3(172, 188, 220)) / 255.0;

						// color = mix(pow(1.0 - diffuse_surface * diffuse_fragment, 16.0), pow(1.0 - diffuse_surface, 8.0), 0.0) * col + mix(vec3(255.0) / 255.0, vec3(0.0), 1.0) + yyy + mix(vec3(ivec3(172, 188, 220)) / 255.0, vec3(1.0), 0.0);
						// // color = yyy;

						// if (gl_FragCoord.x * pixel_size.x > 0.5) {

						// 	color = mix(pow(1.0 - diffuse_surface * diffuse_fragment, 8.0), pow(1.0 - diffuse_surface, 8.0), 0.0) + mix(vec3(255.0) / 255.0, vec3(0.0), 1.0) + yyy + mix(vec3(ivec3(172, 188, 220)) / 255.0, vec3(1.0), 0.0);
						// }

						// // color = yyy + mix(vec3(ivec3(172, 188, 220)) / 255.0, vec3(1.0), 0.0);

						// // fog
						// gl_FragColor.rgb = mix(color, vec3(0.95), smoothstep(0.0, 1.0, pow(length(world_position) / 8.0, 4.0)));




						// vec3 noise = texture2D(u_tex_snow, v_uv * 10.0).rgb;

						// if (noise.x < diffuse_surface) {

						// 	noise = vec3(0.0);
						// }
						// else {

						// 	// noise = vec3((pow(diffuse_fragment * specular_fragment, 32.0)));
						// 	noise = vec3(1.0);
						// }

						// color = (ambient * (vec3(ivec3(172, 188, 220)) / 255.0) + pow(diffuse_surface + specular_surface, 1.0) * vec3(1.0) * (vec3(ivec3(172, 188, 220)) / 255.0));

						// color = ambient * (vec3(ivec3(172, 188, 220)) / 255.0) + diffuse_surface * diffuse_surface3 * vec3(1.0);

						// fog
						// gl_FragColor.rgb = mix(color, vec3(0.95), smoothstep(0.0, 1.0, pow(length(world_position) / 8.0, 4.0)));

						// gl_FragColor.rgb = (1.0 - texture2D(u_tex_snow, v_uv / (32.0 * 16.0) * circle_count).rgb) * texture2D(u_tex_flake, v_uv * circle_count).a * diffuse_surface3 + (vec3(ivec3(172, 188, 220)) / 255.0);
						gl_FragColor.rgb = vec3(1.0) * texture2D(u_tex_flake, v_uv * circle_count).a * (0.5 - diffuse_surface3) + (vec3(ivec3(172, 188, 220)) / 255.0);
					}
				`,
			],
		});

		// fetch('models/ground.obj')
		// 	.then((response) => response.text())
		// 	.then((text) => console.log(parse(text)));

		this.position_data = new Float32Array(position_data);
		this.normal_data = new Float32Array(normal_data);
		this.uv_data = new Float32Array(uv_data);
		this.index_data = new Uint32Array(index_data);

		this.position_data = new Float32Array(this.position_data);
		this.normal_data = new Float32Array(this.normal_data);
		this.uv_data = new Float32Array(this.uv_data);

		this.position_buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.position_data, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		this.normal_buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.normal_data, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		this.uv_buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.uv_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.uv_data, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		this.index_buffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.index_data, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}

	drawDepth() {

		gl.useProgram(this.programs[0].handle);

		gl.uniform1f(this.programs[0].uniform_locations.u_time, time);
		gl.uniformMatrix4fv(this.programs[0].uniform_locations.u_view_mat, false, camera.view_mat.arr);
		gl.uniform3f(this.programs[0].uniform_locations.u_camera_position, camera.obj.matrix.arr[12], camera.obj.matrix.arr[13], camera.obj.matrix.arr[14]);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
		gl.vertexAttribPointer(this.a_position, 3, gl.FLOAT, 0, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
		gl.vertexAttribPointer(this.a_normal, 3, gl.FLOAT, 0, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.uv_buffer);
		gl.vertexAttribPointer(this.a_uv, 2, gl.FLOAT, 0, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
		gl.drawElements(gl.TRIANGLES, this.index_data.length, gl.UNSIGNED_INT, 0);
	}

	drawBrightness() {

		gl.useProgram(this.programs[1].handle);

		gl.uniform1f(this.programs[1].uniform_locations.u_time, time);
		gl.uniformMatrix4fv(this.programs[1].uniform_locations.u_view_mat, false, camera.view_mat.arr);
		gl.uniform3f(this.programs[1].uniform_locations.u_camera_position, camera.obj.matrix.arr[12], camera.obj.matrix.arr[13], camera.obj.matrix.arr[14]);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
		gl.vertexAttribPointer(this.a_position, 3, gl.FLOAT, 0, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
		gl.vertexAttribPointer(this.a_normal, 3, gl.FLOAT, 0, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.uv_buffer);
		gl.vertexAttribPointer(this.a_uv, 2, gl.FLOAT, 0, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
		gl.drawElements(gl.TRIANGLES, this.index_data.length, gl.UNSIGNED_INT, 0);
	}

	drawRegular() {

		gl.useProgram(this.programs[2].handle);

		gl.uniform1f(this.programs[2].uniform_locations.u_time, time);
		gl.uniformMatrix4fv(this.programs[2].uniform_locations.u_view_mat, false, camera.view_mat.arr);
		gl.uniform3f(this.programs[2].uniform_locations.u_camera_position, camera.obj.matrix.arr[12], camera.obj.matrix.arr[13], camera.obj.matrix.arr[14]);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
		gl.vertexAttribPointer(this.a_position, 3, gl.FLOAT, 0, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
		gl.vertexAttribPointer(this.a_normal, 3, gl.FLOAT, 0, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.uv_buffer);
		gl.vertexAttribPointer(this.a_uv, 2, gl.FLOAT, 0, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
		gl.drawElements(gl.TRIANGLES, this.index_data.length, gl.UNSIGNED_INT, 0);
	}
}



class Points extends BaseObjectClass {

	constructor() {

		super({

			vs: `
				precision highp int;
				precision highp float;

				attribute vec4 a_vertex_data1;
				attribute vec3 a_vertex_data2;

				uniform float u_time;
				uniform mat4 u_proj_mat; //init uniformMatrix4fv; ${ camera.proj_mat.arr }
				uniform mat4 u_view_mat;

				varying float v_random;

				mat4 inverseRotationMatrix (mat4 matrix) {

					mat4 result_mat;

					result_mat[0] = vec4(matrix[0].x, matrix[1].x, matrix[2].x, 0.0);
					result_mat[1] = vec4(matrix[0].y, matrix[1].y, matrix[2].y, 0.0);
					result_mat[2] = vec4(matrix[0].z, matrix[1].z, matrix[2].z, 0.0);
					result_mat[3] = vec4(0.0, 0.0, 0.0, 1.0);

					return result_mat;
				}

				void main (void) {

					vec3 position = a_vertex_data1.xyz;
					float random = a_vertex_data1.w;
					vec3 center = a_vertex_data2;

					vec3 rotated_position = (inverseRotationMatrix(u_view_mat) * vec4(position - center, 1.0)).xyz + center;
					// rotated_position *= random;
					rotated_position.y += 0.015;

					gl_Position = u_proj_mat * u_view_mat * vec4(rotated_position, 1.0) * floor(sin((u_time * random + random) * 1000.0) + random);
				}
			`,

			fs: `
				precision highp int;
				precision highp float;

				uniform int u_mode;
				uniform float u_time;
				uniform sampler2D u_tex5_brightness; //init uniform1i; 5

				const vec2 resolution = vec2(${ window.innerWidth }.0, ${ window.innerHeight }.0);
				const vec2 pixel_size = 1.0 / resolution;

				void main (void) {

					float depth = gl_FragCoord.z / gl_FragCoord.w / ${ 20 }.0;

					if (u_mode == 0) { // depth

						gl_FragColor = vec4(0.0, 0.0, 0.0, depth);
					}
					else if (u_mode == 1) { // regular

						gl_FragColor = vec4(1.0) * texture2D(u_tex5_brightness, gl_FragCoord.xy * pixel_size).r;
						// gl_FragColor.a = ;
					}
				}
			`,
		});

		const circle_geometry = new THREE.CircleBufferGeometry(0.02, 5);
		console.log(1, circle_geometry.index.array);
		console.log(2, circle_geometry.attributes.position.array);

		const vertex_data = [];
		const _index_data = [];

		// console.log(flakes.length);

		for (let i = 0; i < flakes.length; i += 4) {

			for (let k = 0; k < circle_geometry.attributes.position.array.length; k += 3) {

				vertex_data.push(

					flakes[i + 0] + circle_geometry.attributes.position.array[k + 0],
					flakes[i + 1] + circle_geometry.attributes.position.array[k + 1],
					flakes[i + 2] + circle_geometry.attributes.position.array[k + 2],
					flakes[i + 3],
					flakes[i + 0],
					flakes[i + 1],
					flakes[i + 2],
				);
			}

			// console.log(i, (i * 4) + 3, flakes[(i * 4) + 3]);

			_index_data.push(...circle_geometry.index.array.map((elm) => (elm += circle_geometry.attributes.position.array.length / 3 * i / 4)));
		}

		console.log(3, vertex_data);
		console.log(4, _index_data);

		this.vertex_data = new Float32Array(vertex_data);
		// this.vertex_data = new Float32Array(flakes);
		this.index_data = new Uint32Array(_index_data);

		this.vertex_buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.vertex_data, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		this.index_buffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.index_data, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

		// console.log(this.vertex_data);
	}

	drawDepth() {

		gl.useProgram(this.programs[0].handle);

		gl.uniform1i(this.programs[0].uniform_locations.u_mode, 0);
		gl.uniform1f(this.programs[0].uniform_locations.u_time, time);
		gl.uniformMatrix4fv(this.programs[0].uniform_locations.u_view_mat, false, camera.view_mat.arr);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
		gl.vertexAttribPointer(this.a_vertex_data1, 4, gl.FLOAT, 0, 28, 0);
		gl.vertexAttribPointer(this.a_vertex_data2, 3, gl.FLOAT, 0, 28, 16);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
		gl.drawElements(gl.TRIANGLES, this.index_data.length, gl.UNSIGNED_INT, 0);
	}

	drawRegular() {

		gl.useProgram(this.programs[0].handle);

		gl.uniform1i(this.programs[0].uniform_locations.u_mode, 1);
		gl.uniform1f(this.programs[0].uniform_locations.u_time, time);
		gl.uniformMatrix4fv(this.programs[0].uniform_locations.u_view_mat, false, camera.view_mat.arr);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
		gl.vertexAttribPointer(this.a_vertex_data1, 4, gl.FLOAT, 0, 28, 0);
		gl.vertexAttribPointer(this.a_vertex_data2, 3, gl.FLOAT, 0, 28, 16);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);

		gl.enable(gl.BLEND);
		gl.disable(gl.DEPTH_TEST);
		gl.drawElements(gl.TRIANGLES, this.index_data.length, gl.UNSIGNED_INT, 0);
		gl.disable(gl.BLEND);
		gl.enable(gl.DEPTH_TEST);
	}
}



const surface = new Surface();
const cube = new Cube();
const points = new Points();
console.log(cube);
console.log(points);



// window.addEventListener('resize', () => {

//   viewport2_width = window.innerWidth * dpr;
//   viewport2_height = window.innerHeight * dpr;

//   canvas.width = viewport2_width;
//   canvas.height = viewport2_height;

//   camera.proj_mat.makePerspectiveProjection2(45, window.innerWidth / window.innerHeight, 1, 2000, 1);

//   gl.useProgram(cube.program);
//   gl.uniformMatrix4fv(cube.proj_mat, false, camera.proj_mat.arr);
//   gl.useProgram(null);
// });



const render = () => {

	time += 0.003;

	camera.obj.preRotateY(-Math.PI * 0.0001);
	camera.obj.update2();
	camera.view_mat
		.copy(camera.obj.matrix)
		.inverse();

	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fb_tex2, 0);
	gl.clearColor(1, 1, 1, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	cube.drawBrightness();



	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fb_tex0, 0);
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// points.drawDepth();
	cube.drawDepth();



	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fb_tex1, 0);
	gl.clearColor(0.95, 0.95, 0.95, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	cube.drawRegular();
	// points.drawRegular();

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);



	surface.draw();

	requestAnimationFrame(render);
};

render();
