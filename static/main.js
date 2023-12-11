import * as THREE from './node_modules/three/build/three.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';

// 创建场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// 获取显示器尺寸和分辨率
const screenWidthInMeters = 0.5;  // 假设显示器宽度为0.6米，您可以根据实际情况进行调整
const screenWidthInPixels = window.innerWidth;
const screenHeightInPixels = window.innerHeight;

// 计算透视相机的视场
const aspectRatio = screenWidthInPixels / screenHeightInPixels;
const fov = 2 * Math.atan((screenWidthInMeters / 2) / 5) * (180 / Math.PI);  // 假设相机距离显示器5米

// 创建相机
const camera = new THREE.PerspectiveCamera(fov, aspectRatio, 0.1, 1000);
camera.position.set(0, 0, 200);  // 将相机移动到正方体的Z轴正上方
camera.lookAt(0, 0, 0);

// 创建渲染器
const render = new THREE.WebGLRenderer();
render.setSize(screenWidthInPixels, screenHeightInPixels);
document.body.appendChild(render.domElement);

// 创建正方体
const geometry = new THREE.BoxGeometry(1, 1, 1);  // 正方体的边长为1米
const material = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.7 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

//创建边框
const edgesGeometry = new THREE.EdgesGeometry(geometry);
const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 }); // 黑色边框
const border = new THREE.LineSegments(edgesGeometry, lineMaterial);
scene.add(border);

// 创建网格平面
const gridHelper = new THREE.GridHelper(200, 200, 0x000000, 0x000000);
gridHelper.material.transparent = true;
gridHelper.material.opacity = 0.5;
gridHelper.rotation.x = Math.PI / 2;  // 将网格平面旋转90度，使其与Z轴垂直
scene.add(gridHelper);

// 创建坐标轴 The X axis is red. The Y axis is green. The Z axis is blue.
var axisHelper = new THREE.AxesHelper(250);
scene.add(axisHelper);

//接收服务器过来的websocket通信
const socket = io.connect('http://' + document.domain + ':' + location.port);

socket.on('connect', () => {
    console.log('Connected to server');
});

// 画方块的运动轨迹
const points = [];

const curve = new THREE.CatmullRomCurve3(points);

const track_geometry = new THREE.BufferGeometry().setFromPoints(points);
const track_material = new THREE.LineBasicMaterial({ color: 0xff0000 });
const line = new THREE.Line(track_geometry, track_material);
line.frustumCulled = false; //关掉视椎体剔除
scene.add(line);

socket.on('message', (msg) => {
    //console.log(msg.x, msg.y)
    //平移正方体
    cube.position.x += msg.x;
    border.position.x += msg.x;

    cube.position.y = parseFloat(msg.y);
    border.position.y = parseFloat(msg.y);
    points.push(new THREE.Vector3(cube.position.x, cube.position.y))
    //console.log(points)
});

document.querySelector('#start').onclick = () => {
    const msg = document.querySelector('#message').value;
    socket.emit('message', msg);
    document.querySelector('#message').value = '';
};

//定义切换视角后的渲染方法
const follow_mode_render = () => {
    camera.position.set(cube.position.x, 0, 200);
    camera.lookAt(cube.position.x, 0, 0);
    render.render(scene, camera);
};

const free_mode_render = () => {
    render.render(scene, camera);
};

//支持按钮切换视角
let view_switch = true;
document.querySelector('#view_change').onclick = () => {

    if (view_switch) {
        // 从Follow切到Free
        document.querySelector('#view_change').innerText = 'Free Mode NOW'
        view_switch = false
    } else {
        // 从Free切到Follow
        document.querySelector('#view_change').innerText = 'Follow Mode NOW'
        follow_mode_render();
        view_switch = true
    }
};

// Free Mode下，支持鼠标平移、缩放、旋转
var controls = new OrbitControls(camera,render.domElement);//创建控件对象
controls.addEventListener('change', free_mode_render);//监听鼠标、键盘事件，每次监测到事件，就重新渲染一次


// 动画渲染
function animate() {
    requestAnimationFrame(animate);

    // 重新设置线段几何的顶点
    track_geometry.setFromPoints(points);
    track_geometry.attributes.position.needsUpdate = true;

    if (view_switch) {
        //console.log('Change to follow view')
        camera.position.set(cube.position.x, 0, 200);
        follow_mode_render();
    } else {
        free_mode_render();
    }

}

animate();