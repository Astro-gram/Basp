# Basp Programming Language

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

<br/>



---
## Documentation

#### [Documentation Folder](https://github.com/Astro-gram/Basp/tree/master/docs)

- [Arithmetic Operations](https://github.com/Astro-gram/Basp/blob/master/docs/arithmetic_operations.md)
- [Array](https://github.com/Astro-gram/Basp/blob/master/docs/array.md)
- [Built In Functions](https://github.com/Astro-gram/Basp/blob/master/docs/built_in_functions.md)
- [Comments](https://github.com/Astro-gram/Basp/blob/master/docs/arithmetic_operations.md)
- [Data Types](https://github.com/Astro-gram/Basp/blob/master/docs/data_types.md)
- [Download](https://github.com/Astro-gram/Basp/blob/master/docs/download.md)
- [Enum](https://github.com/Astro-gram/Basp/blob/master/docs/enum.md) (no docs currently)
- [For Loop](https://github.com/Astro-gram/Basp/blob/master/docs/for_loop.md)
- [Function](https://github.com/Astro-gram/Basp/blob/master/docs/function.md)
- [If Statement](https://github.com/Astro-gram/Basp/blob/master/docs/if_statements.md)
- [Math](https://github.com/Astro-gram/Basp/blob/master/docs/math.md)
- [String](https://github.com/Astro-gram/Basp/blob/master/docs/string.md)
- [Math](https://github.com/Astro-gram/Basp/blob/master/docs/math.md)
- [Structure](https://github.com/Astro-gram/Basp/blob/master/docs/structure.md)
- [While Loop](https://github.com/Astro-gram/Basp/blob/master/docs/while_loop.md)

---

## Credit

- David Callanan (CodePulse): Many methods of his I used to create this programming language.
    - His Youtube: https://www.youtube.com/c/CodePulse
    - Repo For His Language: https://github.com/davidcallanan/py-myopl-code
    - Make Your Own Language Playlist: https://www.youtube.com/playlist?list=PLZQftyCk7_SdoVexSmwy_tBgs7P0b97yD