
RETRO PRINTER - FULL STACK SETUP GUIDE
======================================

1. BACKEND SETUP (Spring Boot)
------------------------------
此项目已配置为使用 Spring Boot 2.7.18，**兼容 Java 14**。

A. 项目结构:
   确保你的后端文件夹结构如下：
   backend/
   ├── pom.xml                   <-- Maven 配置文件 (已设置为 Java 14)
   └── src/
       └── main/
           └── java/
               └── com/
                   └── example/
                       └── retroprinter/
                           ├── RetroPrinterApplication.java
                           ├── MessageController.java
                           └── Message.java

B. 运行方法 (推荐使用 Maven):
   1. 确保已安装 Java 14 (输入 `java -version` 检查)
   2. 在 backend 目录打开终端
   3. 运行命令: 
      mvn spring-boot:run

C. 常见报错解决:
   报错: "java.lang.UnsupportedClassVersionError"
   解决: 
   - 确保你的 IDE (IDEA/Eclipse) 项目设置中，SDK 和 Language Level 都选的是 14。
   - 如果之前用 Java 17 编译过，请先运行 `mvn clean` 清理旧的编译文件。

2. FRONTEND INTEGRATION
-----------------------
The Frontend is React + Vite.

A. Configuration:
   Open the file `services/api.ts` in the frontend root.

   Change the mock mode flag:
   const USE_MOCK_MODE = false;  <-- Set this to false

   Ensure the API URL matches your backend:
   const API_BASE_URL = 'http://localhost:8080/api/messages';

B. Running Frontend:
   Install dependencies: npm install
   Start dev server: npm run dev
