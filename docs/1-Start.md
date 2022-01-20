## 准备工作
### **1.参考资料**
1. [计算机图形学：基础入门][1]
2. [线性代数：线性代数的本质][2]
3. [数学基础：数学乐][3]
4. [前端基础：HTML][4]
5. [前端基础：Canvas][5]
6. [前端基础：ImageData][6]
7. [前端基础：Webpack][7]

[1]:https://www.bilibili.com/video/BV1X7411F744
[2]:https://www.bilibili.com/video/BV1ys411472E
[3]:https://www.shuxuele.com/
[4]:https://developer.mozilla.org/zh-CN/docs/Web/HTML
[5]:https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API
[6]:https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
[7]:https://webpack.docschina.org/concepts/

```html
   <canvas id='canvas'> </canvas>
```
```typescript
    // canvas画布
    const canvas:HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
    // canvas 2d上下文
    const ctx:CanvasRenderingContext2D = canvas.getContext('2d');
    // canvas像素数据  
    const imageData:ImageData = ctx.createImageData(canvas.width, canvas.height);
    const pixelData:Uint8ClampedArray = imageData.data;
```

### **2.环境搭建**
1. 初始化ts环境 
```shell
    // 如果没有node 请先安装node 具体google
    // 如果没有安装过typescript，则需要先执行 npm install typescript 安装，再执行
    tsc --init
```

2. 初始化npm环境
```shell
    npm init // 根据提示初始化Project即可
```
3. 创建`index.html`
```html
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <title>软件渲染器</title>
    </head>
    <body>
        <div id="root">
            <canvas id="canvas"></canvas>
            <script>"./dist/index.js"</script>
        </div>
    </body>
    </html>
```
4. 配置webpack
- 首先安装`webpack` `npm install -D webpack`
- 然后安装`HtmlWebpackPlugin`插件 `npm install -D html-webpack-plugin`
- 编写`webpack.config.js`

```javascript
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
module.exports = {
    mode: "development",
    entry: "./index.ts",
    devtool: "inline-source-map",
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.(mtl|png|jpg|obj|tga)$/,
                use: "file-loader",
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./index.html",
            filename: "index.html",
        }),
    ],
    // 编译输出文件
    output: {
        filename: "index.js",
        path: path.resolve(__dirname, "dist"),
        clean: true,
    },
    // 本地调试预览
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        compress: true,
        port: 9000,
    },
};

```


### **3.渲染管线**
1. 输入顶点数据和图元类型（点、直线、三角形等基本图元）
2. 顶点着色器对顶点进行处理，将坐标变换到世界坐标，计算纹理坐标和顶点颜色等
3. 进行图元装配过程，也就是为每个三角形指定顶点数据与索引
4. 将顶点变换到摄像机的观察空间
5. 进行投影，将顶点变换到裁剪空间
6. 进行裁剪和面剔除工作，将看不见的图元进行裁剪，剔除背向面，减少后续计算量
7. 执行齐次除法，将顶点变换到NDC（标准设备坐标）
8. 执行视口变换，最终将顶点转换到屏幕坐标（从三维变成二维）
9. 光栅化，计算图形在屏幕上最终覆盖的像素点
10. 用顶点数据插值，在像素点位置生成新的数据
11. 逐像素运行片元着色器，进行纹理采样、光照计算等，输出该点最终颜色值（RGBA）
12. 执行透明度测试->模板测试->深度测试，丢弃掉一些片元
13. 执行混合操作