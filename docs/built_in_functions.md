# Built-In Functions

## Conversions

#### To Number:
Expected Type: String

```c
int number = Number("123")
//Result: 123
```

```c
int number = Number("Bad Number")
//Result: NaN
```

#### To String:
Expected Type: Any

```c
string number = String(123)
//Result: "123"
```

## Type Checks

#### Is Array:
Expected Type: Any

```c
bool isArray = IsArray("Hello World!")
//Result: False
```

```c
bool isArray = IsArray(["Hello", "World"])
//Result: True
```

<br/>

#### Is Number:
Expected Type: Any

```c
bool isNumber = IsNumber("Hello World!")
//Result: False
```

```c
bool isNumber = IsNumber(123)
//Result: True
```

<br/>

#### Is String:
Expected Type: Any

```c
bool isString = IsString({ Hello })
//Result: False
```

```c
bool isString = IsString("Hello World!")
//Result: True
```

<br/>

#### Is Enum:
Expected Type: Any

```c
bool isEnum = IsEnum("Not a enum")
//Result: False
```

```c
bool isEnum = IsEnum({ Hello, World })
//Result: True
```

<br/>

#### Is Boolean:
Expected Type: Any

```c
bool isBoolean = IsBoolean("This is a string")
//Result: False
```

```c
bool isBoolean = IsBoolean(False)
//Result: True
```

<br/>

#### Is Function:
Expected Type: Any

```c
bool isFunction = IsFunction(123)
//Result: False
```

```c
fn int add(int a, int b) {
    return a + b
}

bool isFunction = IsFunction(add)
//Result: True
```

<br/>

## Miscellaneous

#### Print:
Expected Type: Any

```c
Print("Hello World!")
//Result: [Basp] "Hello World!"
```

<br/>

#### Clear:
No Arugments

```c
Clear()
//Result:
```


<br/>

#### Type of:
Expected Type: Any

```c
Typeof(5)
//Result: "NUMBER"
```

```c
Typeof({ Monday, Tuesday })
//Result: "ENUM"
```

<br/>

#### Import
Expected Type: String

Import will fetch a "package" from a list of packages I created. The list can be added to, but requires a password.
You can also import from another .basp file.

```c
Import("./utils.basp")
//Result: Utils { ... }
```

<br/>