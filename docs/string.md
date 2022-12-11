# Strings

Strings are created using double quotes (```"```), similar to any other language. Strings can't be made using single quotes (```'```) currently.

```c
//Create a string like this
string text = "Hello World"
```

<br/>

### Properties & Methods

Get this length of a string: ```Returns Integer```
```c
string text = "test"
int length = text.length

//length = 4
```

<br/>

Convert string to upper case: ```Returns String```
```c
string text = "test"
string textInCaps = text.toUpperCase()

//textInCaps = "TEST"
```

<br/>

Convert string to lower case: ```Returns String```
```c
string text = "TEST"
string textInCaps = text.toLowerCase()

//textInCaps = "test"
```

<br/>

Split text into chunks: ```Returns Array```
```c
string text = "I Like Basp!"
array textInChunks = text.split(" ")

//textInChunks = [ "I", "Like", "Basp!" ]
```