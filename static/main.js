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

// 创建一个xz平面
const planeGeometry = new THREE.PlaneGeometry(100, 100); // 设置平面的宽度和高度
const planeMaterial = new THREE.MeshBasicMaterial({
  color: 0x000000, // 设置平面颜色为黑色
  transparent: true, // 启用透明度
  opacity: 0.5, // 设置透明度为0.5
  side: THREE.DoubleSide, // 渲染平面的两面
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);

// 将平面旋转90度，使其与xz平面平行
plane.rotation.x = Math.PI / 2;

// 设置平面的y坐标，添加平面到场景中
plane.position.y = -10;
scene.add(plane);

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
    //让方块跟着后台返回的坐标运动
    cube.position.x = msg.x;
    border.position.x = msg.x;
    cube.position.z = msg.z;
    border.position.z = msg.z;
    cube.position.y = msg.y;
    border.position.y = msg.y;

    points.push(new THREE.Vector3(cube.position.x, cube.position.y, cube.position.z))
});

//在下拉列表中选模式
function showSelectedMode() {
    var dropdown = document.getElementById("modeDropdown");
    var selectedOption = dropdown.options[dropdown.selectedIndex];
    var selectedValue = selectedOption.value;
    var selectedText = selectedOption.text;

    console.log("Selected value:", selectedValue);
    console.log("Selected text:", selectedText);

    return selectedValue
}

// 点击开始按钮之后，开始运动，如果点了stop，停止运动
let start_switch = true;
let start_info = ['sin', start_switch]
document.querySelector('#start').onclick = () => {
    start_info = [showSelectedMode(), start_switch]
    if (start_switch) {
        //切换到运行状态，按钮文案显示为STOP
        socket.emit('start_button', start_info);
        document.querySelector('#start').innerText = 'STOP';
        start_switch = false;
    } else {
        //切换到停止状态，按钮文案显示为START
        socket.emit('start_button', start_info);
        document.querySelector('#start').innerText = 'START';
        start_switch = true;
    }

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

//支持通过按钮切换视角
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

// 支持捕捉键盘按键
document.addEventListener('DOMContentLoaded', function() {
  document.addEventListener('keydown', function(event) {
    switch (event.key) {
      case 'ArrowUp':
        console.log('Up arrow key pressed');
        break;
      case 'ArrowDown':
        console.log('Down arrow key pressed');
        break;
      case 'ArrowLeft':
        console.log('Left arrow key pressed');
        break;
      case 'ArrowRight':
        console.log('Right arrow key pressed');
        break;
    }
  });
});


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