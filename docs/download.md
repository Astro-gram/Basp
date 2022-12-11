## Setup Locally (Directly Run)
If you don't want to build it, run it direct from the source code

1. Download ```Node.js``` (https://nodejs.org/)
2. Download Basp repo (https://github.com/Astro-gram/Basp)
3. Go into that folder
4. open the config file: ```src/config.js```
5. Check the ```PRODUCTION``` variable and make sure it is ```false```
6. Change ```NON_PRODUCTION_FILE_LOCATION``` to the location of your .basp file
7. Go back to the root of the repo and run:

```bash
npm run go
```

If everything worked, you should get the results of your code in your terminal.

<br/>

## Setup Locally (Build)
(This setup is for Windows only)

1. Download ```Node.js``` (https://nodejs.org/)
2. Install ```pkg package``` to build executable

```bash
npm install -g pkg
```

3. Download Basp repo (https://github.com/Astro-gram/Basp)
4. Go into that folder
5. open the config file: ```src/config.js```
6. Check the ```PRODUCTION``` variable and make sure it is ```true```
7. Go back to the root of the repo and run:


```bash
npm run build
```

8. If everything was successful, there should be a file named "main.exe" under a folder named "exe"

```
Basp
└───exe
    └───main.exe

```

9. Run Command Prompt as administrator
10. Run these commands to associate .basp files with the executable

```bash
assoc .basp=BaspScript
ftype BaspScript=PathToMain.exe %1 %*
```
(Replace "PathToMain.exe" with the path to the main.exe file)

11. Create a file with the extension of .basp

Example File:
```
Basp
└───code
    └───example.basp
```

12. Write some code in your file and open it

If everything worked, you should get a node.js window popup giving you the results of your code.