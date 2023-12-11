## 1. 环境以及Python解释器版本：
Python 3.7.7 (tags/v3.7.7:d7c567b08f, Mar 10 2020, 09:44:33) [MSC v.1900 32 bit (Intel)] on win32

开发环境部署步骤：
```
pip install -r requirements.txt
cd static
npm install
```
## 2. next plan：

1. 增加重启按钮；
2. 实现PID算法的动画演示过程；
3. 正方体位置y轴可以通过键盘事件来控制；
4. 预研一下使用什么前端框架合适这个项目；
5. 功能演示按步骤拆分、可分享单个步骤 ；
6. 如何在云端部署这个应用；
7. 无限延伸网格
8. 移动端适配 
9. 故事和功能演示解偶，故事可定制化

## 3. 开发日志

#### 2023-12-12 03:03

1. 解决了如何生成requirements.txt的问题，pip freeze > requirements.txt
2. 把项目传到git上
3. 当其他人克隆项目并运行npm install时，npm会自动安装package.json中列出的所有依赖包。
4. 按钮改为start/stop
5. 增加了物理引擎panda3D，引入重力、摩擦力、地面；
6. 搞清楚panda3D定义正方体、球，都是半边长、半径；

#### 2023-12-11 00:19

1. 在页面上实现正方体x方向不动，但是x轴坐标向左移动的效果（在XY平面上，画出正方体的轨迹）
2. 解决了如何在flask和main.js之间通过websocket传多个值的问题；
3. 画的物体超出视锥范围不被抹掉
4. 降低网格透明度

#### 2023-12-10 17:31

1. flask作为后端服务器架构，搭配three.js在页面显示动画；
2. 解决了加载three.js相关库的问题，尤其是.js文件的强制校验；
3. 解决了如何实现flask与前端页面的websocket问题；
